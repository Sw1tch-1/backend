/**
 * @module services/discountService
 * @description Сервис для управления скидками, включая получение применимых скидок для продукта и пользователя.
 */

const Discount = require('../models/Discount');
const Product = require('../models/Product');
const User = require('../models/User');

/**
 * @class DiscountService
 * @description Класс, предоставляющий методы для работы со скидками.
 */
class DiscountService {
    /**
     * @method getApplicableDiscounts
     * @description Получает список применимых скидок для указанного продукта и пользователя.
     * @param {string} productId - Идентификатор продукта, для которого нужно получить скидки.
     * @param {string|null} [userId=null] - Идентификатор пользователя (опционально).
     * @returns {Promise<Array>} Возвращает массив применимых скидок, отсортированных по убыванию процента скидки.
     * @throws {Error} Если продукт не найден.
     */
    static async getApplicableDiscounts(productId, userId = null) {
        // Поиск продукта по его идентификатору.
        const product = await Product.findById(productId);
        if (!product) {
            // Генерация ошибки, если продукт не найден.
            throw new Error('Product not found');
        }

        // Текущее время для фильтрации активных скидок.
        const now = new Date();

        // Формирование запроса для поиска скидок.
        const query = {
            $or: [
                {products: productId}, // Скидки, привязанные к конкретному продукту.
                {type: 'category', categories: product.category}, // Скидки для категории продукта.
                {type: 'general'} // Общие скидки.
            ],
            startDate: {$lte: now}, // Скидки, которые уже начались.
            endDate: {$gte: now}, // Скидки, которые еще не закончились.
            active: true // Только активные скидки.
        };

        // Если указан пользователь, добавляем скидки для его группы пользователей.
        if (userId) {
            const user = await User.findById(userId); // Поиск пользователя по идентификатору.
            if (user && user.userGroup) {
                query.$or.push({
                    type: 'userGroup', // Скидки для группы пользователей.
                    userGroup: user.userGroup
                });
            }
        }

        // Поиск скидок в базе данных с сортировкой по убыванию процента скидки.
        return await Discount.find(query).sort({percentage: -1});
    }

    /**
     * @method calculateBestDiscount
     * @description Вычисляет лучшую скидку для указанного продукта и пользователя.
     * @param {string} productId - Идентификатор продукта.
     * @param {string|null} [userId=null] - Идентификатор пользователя (опционально).
     * @returns {Promise<Object|null>} Возвращает объект лучшей скидки или null, если скидок нет.
     */
    static async calculateBestDiscount(productId, userId = null) {
        // Получение всех применимых скидок для продукта и пользователя.
        const discounts = await this.getApplicableDiscounts(productId, userId);
        // Возвращаем первую (лучшую) скидку или null, если скидок нет.
        return discounts[0] || null;
    }

    /**
     * @method calculateProductDiscount
     * @description Рассчитывает цену продукта с учетом лучшей скидки.
     * @param {string} productId - Идентификатор продукта.
     * @param {string|null} [userId=null] - Идентификатор пользователя (опционально).
     * @returns {Promise<Object>} Возвращает объект с информацией о скидке и цене продукта.
     * @throws {Error} Если продукт не найден.
     */
    static async calculateProductDiscount(productId, userId = null) {
        // Поиск продукта по его идентификатору.
        const product = await Product.findById(productId);
        if (!product) {
            // Генерация ошибки, если продукт не найден.
            throw new Error('Product not found');
        }

        // Получение лучшей скидки для продукта и пользователя.
        const bestDiscount = await this.calculateBestDiscount(productId, userId);

        // Если скидок нет, возвращаем исходную цену продукта.
        if (!bestDiscount) {
            return {
                originalPrice: product.price,
                discountedPrice: product.price,
                hasDiscount: false
            };
        }

        // Рассчитываем цену со скидкой.
        const discountMultiplier = (100 - bestDiscount.percentage) / 100;
        const discountedPrice = Math.round(product.price * discountMultiplier * 100) / 100;

        // Возвращаем информацию о скидке и цене.
        return {
            originalPrice: product.price,
            discountedPrice: discountedPrice,
            discountPercentage: bestDiscount.percentage,
            discount: bestDiscount,
            hasDiscount: true,
            savedAmount: parseFloat((product.price - discountedPrice).toFixed(2)),
            discountType: bestDiscount.type
        };
    }

    /**
     * @method applyBulkDiscounts
     * @description Применяет скидки к массиву продуктов с учетом группы пользователя.
     * @param {Array} products - Массив продуктов, к которым нужно применить скидки.
     * @param {string|null} [userId=null] - Идентификатор пользователя (опционально).
     * @returns {Promise<Array>} Возвращает массив продуктов с примененными скидками.
     */
    static async applyBulkDiscounts(products, userId = null) {
        // Текущее время для фильтрации активных скидок.
        const now = new Date();

        // Поиск всех активных скидок, применимых к продуктам.
        const allDiscounts = await Discount.find({
            $or: [
                {products: {$in: products.map(p => p._id)}},
                {type: 'category', categories: {$in: [...new Set(products.map(p => p.category))]}},
                {type: 'general'}
            ],
            startDate: {$lte: now},
            endDate: {$gte: now},
            active: true
        });

        // Переменная для хранения скидок по группе пользователя.
        let userGroupDiscounts = [];
        // Если указан идентификатор пользователя, ищем скидки для его группы.
        if (userId) {
            const user = await User.findById(userId);
            if (user?.userGroup) {
                userGroupDiscounts = await Discount.find({
                    type: 'userGroup',
                    userGroup: user.userGroup,
                    startDate: {$lte: now},
                    endDate: {$gte: now},
                    active: true
                });
            }
        }

        // Объединение всех скидок и скидок по группе пользователя.
        const combinedDiscounts = [...allDiscounts, ...userGroupDiscounts];

        // Применение лучших скидок к каждому продукту.
        return products.map(product => {

            // Фильтрация скидок, применимых к текущему продукту.
            const productDiscounts = combinedDiscounts.filter(d =>
                d.type === 'general' ||
                (d.type === 'category' && d.categories.includes(product.category)) ||
                (d.type === 'product' && d.products.includes(product._id)) ||
                (d.type === 'userGroup' && userId)
            );

            // Поиск лучшей скидки среди применимых к продукту.
            const bestDiscount = productDiscounts.length
                ? productDiscounts.reduce((max, d) => d.percentage > max.percentage ? d : max)
                : null;

            // Если скидок нет, возвращаем продукт с исходной ценой.
            if (!bestDiscount) {
                return {
                    ...product,
                    originalPrice: product.price,
                    discountedPrice: product.price,
                    hasDiscount: false
                };
            }

            // Рассчитываем цену со скидкой.
            const discountMultiplier = (100 - bestDiscount.percentage) / 100;
            const discountedPrice = Math.round(product.price * discountMultiplier * 100) / 100;

            // Возвращаем продукт с информацией о скидке.
            return {
                ...product, 
                originalPrice: product.price,
                discountedPrice: discountedPrice,
                discountPercentage: bestDiscount.percentage,
                discount: bestDiscount,
                hasDiscount: true,
                savedAmount: parseFloat((product.price - discountedPrice).toFixed(2)),
                discountType: bestDiscount.type
            };
        });
    }

    /**
     * @method createDiscount
     * @description Создает новую скидку в базе данных.
     * @param {Object} discountData - Данные о скидке, которые нужно сохранить.
     * @returns {Promise<Object>} Возвращает созданный объект скидки.
     */
    static async createDiscount(discountData) {
        const discount = new Discount(discountData);
        await discount.save();
        return discount;
    }

    /**
     * @method updateDiscount
     * @description Обновляет существующую скидку по ее идентификатору.
     * @param {string} discountId - Идентификатор скидки, которую нужно обновить.
     * @param {Object} updateData - Данные для обновления скидки.
     * @returns {Promise<Object>} Возвращает обновленный объект скидки.
     */
    static async updateDiscount(discountId, updateData) {
        return await Discount.findByIdAndUpdate(
            discountId,
            updateData,
            {new: true, runValidators: true}
        );
    }

    /**
     * @method getActiveDiscounts
     * @description Получает список всех активных скидок в системе.
     * @returns {Promise<Array>} Возвращает массив активных скидок, отсортированных по убыванию процента скидки.
     */
    static async getActiveDiscounts() {
        const now = new Date();
        return await Discount.find({
            startDate: {$lte: now},
            endDate: {$gte: now},
            active: true
        }).sort({percentage: -1});
    }
}

module.exports = DiscountService;