/**
 * @module controllers/cartController
 * @description Контроллер для управления корзиной пользователя.
 */

// Импорт модели корзины для работы с данными корзины пользователя
const Cart = require('../models/Cart');
// Импорт модели продукта для проверки существования товаров
const Product = require('../models/Product');
// Импорт сервиса скидок для применения скидок к товарам в корзине
const DiscountService = require('../services/discountService');

/**
 * @class CartController
 * @description Класс для управления корзиной пользователя.
 */
class CartController {
    /**
     * Добавляет товар в корзину пользователя.
     * @async
     * @function addToCart
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если товар не найден.
     * @throws Возвращает 400, если запрашиваемое количество превышает доступный запас.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод добавляет указанный товар в корзину пользователя. Если корзина отсутствует, она создается. Также проверяется доступный запас товара и применяются скидки.
     */
    static async addToCart(req, res) {
        try {
            const { productId, quantity } = req.body; // Извлечение ID продукта и количества из тела запроса
            const userId = req.user._id; // ID пользователя из токена

            // Проверка существования товара в базе данных
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found' // Ошибка: товар не найден
                });
            }

            // Получение корзины пользователя или создание новой, если она отсутствует
            let cart = await Cart.findOne({ user: userId });
            if (!cart) {
                cart = new Cart({ user: userId, items: [] }); // Создание новой корзины
            }

            // Проверка доступного запаса товара
            const existingItemIndex = cart.items.findIndex(item => item.product.equals(productId)); // Поиск товара в корзине
            const currentQty = existingItemIndex !== -1 ? cart.items[existingItemIndex].quantity : 0; // Текущее количество товара в корзине
            const requestedQty = currentQty + quantity; // Запрашиваемое количество товара

            if (requestedQty > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Not enough stock. Available: ${product.stock}`, // Ошибка: недостаточно запаса
                    maxAllowed: product.stock - currentQty // Максимально доступное количество
                });
            }

            // Применение скидки к товару
            const discountInfo = await DiscountService.calculateProductDiscount(productId, userId); // Получение информации о скидке

            if (existingItemIndex !== -1) {
                // Если товар уже есть в корзине, обновляем его количество и цены
                cart.items[existingItemIndex].quantity = requestedQty;
                cart.items[existingItemIndex].originalPrice = discountInfo.originalPrice;
                cart.items[existingItemIndex].discountedPrice = discountInfo.discountedPrice;
                cart.items[existingItemIndex].discountApplied = discountInfo.hasDiscount ? {
                    percentage: discountInfo.discountPercentage,
                    name: discountInfo.discount?.name
                } : null;
            } else {
                // Если товара нет в корзине, добавляем его
                cart.items.push({
                    product: productId,
                    quantity,
                    originalPrice: discountInfo.originalPrice,
                    discountedPrice: discountInfo.discountedPrice,
                    discountApplied: discountInfo.hasDiscount ? {
                        percentage: discountInfo.discountPercentage,
                        name: discountInfo.discount?.name
                    } : null
                });
            }

            await cart.save(); // Сохранение изменений в корзине

            // Обновление корзины с учетом новых данных
            const updatedCart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name price stock imageUrl' // Подключение данных о продукте
                });


            const totals = CartController.calculateCartTotals(updatedCart); // Расчет итоговых значений корзины

            // Успешный ответ с данными обновленной корзины
            res.status(200).json({
                success: true,
                ...totals
            });

        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Рассчитывает общие значения корзины (количество, цена, скидка).
     * @function calculateCartTotals
     * @param {Object} cart - Объект корзины.
     * @returns {Object} Итоговые значения корзины.
     * @description Этот метод подсчитывает общее количество товаров, их исходную стоимость, стоимость со скидкой и общую сумму скидки.
     */
    static calculateCartTotals(cart) {
        let totalItems = 0; // Общее количество товаров в корзине
        let totalOriginalPrice = 0; // Общая исходная стоимость товаров
        let totalDiscountedPrice = 0; // Общая стоимость товаров с учетом скидок

        // Перебор всех товаров в корзине для подсчета итоговых значений
        cart.items.forEach(item => {
            totalItems += item.quantity; // Суммирование количества товаров
            totalOriginalPrice += item.originalPrice * item.quantity; // Суммирование исходной стоимости
            totalDiscountedPrice += (item.discountedPrice || item.originalPrice) * item.quantity; // Суммирование стоимости со скидкой
        });

        const totalDiscount = totalOriginalPrice - totalDiscountedPrice; // Расчет общей суммы скидки

        return {
            items: cart.items, // Список товаров в корзине
            totalItems, // Общее количество товаров
            totalPrice: parseFloat(totalDiscountedPrice.toFixed(2)), // Общая стоимость с учетом скидок
            totalDiscount: parseFloat(totalDiscount.toFixed(2)) // Общая сумма скидки
        };
    }

    /**
     * Получает корзину пользователя.
     * @async
     * @function getCart
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод возвращает текущую корзину пользователя, включая товары, их количество и примененные скидки.
     */
    static async getCart(req, res) {
        try {
            // Поиск корзины пользователя в базе данных с подключением данных о товарах
            const cart = await Cart.findOne({user: req.user._id})
                .populate({
                    path: 'items.product',
                    select: 'name price stock imageUrl' // Выбор полей для отображения
                });

            // Если корзина не найдена, возвращается пустая корзина
            if (!cart) {
                return res.status(200).json({
                    success: true,
                    items: [],
                    totalItems: 0,
                    totalPrice: 0,
                    totalDiscount: 0
                });
            }

            // Применение скидок к каждому товару в корзине
            for (const item of cart.items) {
                const discountInfo = await DiscountService.calculateProductDiscount(item.product._id, req.user._id);
                item.originalPrice = discountInfo.originalPrice; // Исходная цена товара
                item.discountedPrice = discountInfo.discountedPrice; // Цена товара со скидкой
                item.discountApplied = discountInfo.hasDiscount ? {
                    percentage: discountInfo.discountPercentage, // Процент скидки
                    name: discountInfo.discount?.name // Название скидки
                } : null;
            }

            await cart.save(); // Сохранение обновленной корзины в базе данных

            // Расчет итоговых значений корзины
            const totals = CartController.calculateCartTotals(cart);

            // Успешный ответ с данными корзины
            res.status(200).json({
                success: true,
                ...totals
            });

        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Обновляет количество товара в корзине пользователя.
     * @async
     * @function updateCartItem
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если корзина или товар не найдены.
     * @throws Возвращает 400, если запрашиваемое количество превышает доступный запас.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод обновляет количество указанного товара в корзине пользователя.
     */
    static async updateCartItem(req, res) {
        try {
            const {itemId} = req.params; // Извлечение ID элемента корзины из параметров запроса
            const {quantity} = req.body; // Извлечение нового количества из тела запроса
            const userId = req.user._id; // ID пользователя из токена

            // Поиск корзины пользователя в базе данных
            const cart = await Cart.findOne({user: userId});
            if (!cart) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart not found' // Ошибка: корзина не найдена
                });
            }

            // Поиск элемента корзины по ID
            const itemIndex = cart.items.findIndex(i => i._id.equals(itemId));
            if (itemIndex === -1) {
                return res.status(404).json({
                    success: false,
                    error: 'Item not found in cart' // Ошибка: элемент не найден в корзине
                });
            }

            // Проверка доступного запаса товара
            const product = await Product.findById(cart.items[itemIndex].product);
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Not enough stock. Available: ${product.stock}`, // Ошибка: недостаточно запаса
                    maxAllowed: product.stock
                });
            }

            // Обновление количества товара в корзине
            cart.items[itemIndex].quantity = quantity;
            await cart.save();

            // Обновление корзины с подключением данных о товарах
            const updatedCart = await Cart.findById(cart._id)
                .populate({
                    path: 'items.product',
                    select: 'name price stock imageUrl' // Выбор полей для отображения
                });

            // Расчет итоговых значений корзины
            const totals = CartController.calculateCartTotals(updatedCart);

            // Успешный ответ с данными обновленной корзины
            res.status(200).json({
                success: true,
                ...totals
            });

        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Удаляет товар из корзины пользователя.
     * @async
     * @function removeFromCart
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если корзина не найдена.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод удаляет указанный товар из корзины пользователя.
     */
    static async removeFromCart(req, res) {
        try {
            const {itemId} = req.params; // Извлечение ID элемента корзины из параметров запроса
            const userId = req.user._id; // ID пользователя из токена

            // Удаление элемента корзины пользователя
            const cart = await Cart.findOneAndUpdate(
                {user: userId},
                {$pull: {items: {_id: itemId}}}, // Удаление элемента из массива items
                {new: true} // Возврат обновленного документа
            ).populate({
                path: 'items.product',
                select: 'name price stock imageUrl' // Выбор полей для отображения
            });

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart not found' // Ошибка: корзина не найдена
                });
            }

            // Расчет итоговых значений корзины
            const totals = CartController.calculateCartTotals(cart);

            // Успешный ответ с данными обновленной корзины
            res.status(200).json({
                success: true,
                ...totals
            });

        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Очищает корзину пользователя.
     * @async
     * @function clearCart
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод удаляет все товары из корзины пользователя.
     */
    static async clearCart(req, res) {
        try {
            const userId = req.user._id; // ID пользователя из токена

            // Очистка корзины пользователя
            await Cart.findOneAndUpdate(
                {user: userId},
                {items: []} // Удаление всех элементов из массива items
            );

            // Успешный ответ с пустой корзиной
            res.status(200).json({
                success: true,
                items: [],
                totalItems: 0,
                totalPrice: 0,
                totalDiscount: 0,
                message: 'Cart cleared successfully' // Сообщение об успешной очистке корзины
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = CartController; // Экспорт класса для использования в маршрутах
