const Product = require('../models/Product');
const DiscountService = require('../services/discountService');

/**
 * @module controllers/productController
 * @description Контроллер для управления продуктами, включая их создание, обновление, удаление и восстановление.
 */

/**
 * @class ProductController
 * @description Класс для управления продуктами.
 */
class ProductController {
    /**
     * Получает список всех активных товаров с возможностью фильтрации и сортировки.
     * @async
     * @function getAllProducts
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     */
    static async getAllProducts(req, res) {
        try {
            const {query, category, minPrice, maxPrice, sortBy = 'name', sortOrder = 'asc'} = req.query;
            const searchQuery = {isActive: true};

            // Построение поискового запроса
            if (query) {
                searchQuery.$or = [
                    {name: {$regex: query, $options: 'i'}},
                    {description: {$regex: query, $options: 'i'}}
                ];
            }

            if (category) searchQuery.category = category;
            if (minPrice || maxPrice) {
                searchQuery.price = {};
                if (minPrice) searchQuery.price.$gte = Number(minPrice);
                if (maxPrice) searchQuery.price.$lte = Number(maxPrice);
            }

            // Получаем продукты с базовой сортировкой
            let products = await Product.find(searchQuery).lean();

            // Применяем скидки
            products = await DiscountService.applyBulkDiscounts(products, req.user?._id);

            // Специальная обработка для сортировки по скидке
            if (sortBy === 'discount') {
                products.sort((a, b) => {
                    const discountA = a.discountPercentage || 0;
                    const discountB = b.discountPercentage || 0;
                    return sortOrder === 'asc' ? discountA - discountB : discountB - discountA;
                });
            } else {
                // Стандартная сортировка для других случаев
                const sortOptions = {};
                switch (sortBy) {
                    case 'price':
                        sortOptions.price = sortOrder === 'asc' ? 1 : -1;
                        break;
                    case 'newest':
                        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
                        break;
                    default:
                        sortOptions.name = sortOrder === 'asc' ? 1 : -1;
                }
                products.sort((a, b) => {
                    const aValue = sortBy === 'price' ? a.discountedPrice :
                        sortBy === 'newest' ? a.createdAt : a.name;
                    const bValue = sortBy === 'price' ? b.discountedPrice :
                        sortBy === 'newest' ? b.createdAt : b.name;
                    return sortOrder === 'asc' ?
                        (aValue > bValue ? 1 : -1) :
                        (aValue < bValue ? 1 : -1);
                });
            }

            res.json({
                success: true,
                products
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получает информацию о товаре по его ID.
     * @async
     * @function getProductById
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если товар не найден или неактивен.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     */
    static async getProductById(req, res) {
        try {
            let product = await Product.findById(req.params.id).lean();
            if (!product || !product.isActive) {
                return res.status(404).json({success: false, error: 'Product not found'});
            }

            // Применение скидки к товару.
            const discountInfo = await DiscountService.calculateProductDiscount(product._id, req.user?._id);
            product = {...product, ...discountInfo};

            res.json({success: true, product});
        } catch (error) {
            res.status(500).json({success: false, error: error.message});
        }
    }

    /**
     * Создает новый продукт.
     * @async
     * @function createProduct
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400 в случае ошибки валидации данных продукта.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     */
    static async createProduct(req, res) {
        try {
            const productData = req.body;
            if (req.file) productData.imageUrl = `/public/uploads/${req.file.filename}`;

            const product = new Product(productData);
            await product.save();

            res.status(201).json({
                success: true,
                product: product.toObject()
            });
        } catch (error) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    /**
     * Обновляет информацию о продукте.
     * @async
     * @function updateProduct
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если продукт не найден.
     * @throws Возвращает 400 в случае ошибки валидации данных продукта.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     */
    static async updateProduct(req, res) {
        try {
            const updateData = req.body;
            if (req.file) updateData.imageUrl = `/public/uploads/${req.file.filename}`;

            const product = await Product.findByIdAndUpdate(
                req.params.id,
                updateData,
                {new: true, runValidators: true}
            ).lean();

            if (!product) {
                return res.status(404).json({success: false, error: 'Product not found'});
            }

            res.json({success: true, product});
        } catch (error) {
            res.status(400).json({success: false, error: error.message});
        }
    }

    /**
     * Деактивирует продукт, помечая его как неактивный.
     * @async
     * @function deleteProduct
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если продукт не найден.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     */
    static async deleteProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                {isActive: false},
                {new: true}
            ).lean();

            if (!product) {
                return res.status(404).json({success: false, error: 'Product not found'});
            }

            res.json({success: true, message: 'Product deactivated successfully'});
        } catch (error) {
            res.status(500).json({success: false, error: error.message});
        }
    }


    /**
     * Восстанавливает продукт, делая его активным.
     * @async
     * @function restoreProduct
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если продукт не найден.
     * @throws Возвращает 500 в случае ошибки восстановления продукта.
     */
    static async restoreProduct(req, res) {
        try {
            // Поиск и обновление продукта по ID, установка isActive в true
            const product = await Product.findByIdAndUpdate(
                req.params.id, // ID продукта из параметров запроса
                {isActive: true}, // Установка флага активности
                {new: true} // Возврат обновленного документа
            ).lean(); // Преобразование результата в простой объект JavaScript

            // Проверка, найден ли продукт
            if (!product) {
                return res.status(404).json({success: false, error: 'Product not found'}); // Ошибка: продукт не найден
            }

            res.json({success: true, product}); // Успешный ответ с данными продукта
        } catch (error) {
            res.status(500).json({success: false, error: error.message}); // Ошибка сервера
        }
    }
}

module.exports = ProductController; // Экспорт класса для использования в других модулях
