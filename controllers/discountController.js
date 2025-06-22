/**
 * @module controllers/discountController
 * @description Контроллер для управления скидками, включая получение активных скидок для продуктов.
 */

// Импорт необходимых моделей и библиотек
const Discount = require('../models/Discount'); // Модель для работы со скидками
const Product = require('../models/Product'); // Модель для работы с продуктами
const DiscountService = require('../services/discountService'); // Сервис для работы со скидками

/**
 * @class DiscountController
 * @description Класс для управления скидками.
 */
class DiscountController {
    /**
     * Создает новую скидку.
     * @async
     * @function createDiscount
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если данные скидки некорректны.
     */
    static async createDiscount(req, res) {
        try {
            // Создание новой скидки через DiscountService
            const discount = await DiscountService.createDiscount(req.body);

            // Успешный ответ с данными созданной скидки
            res.status(201).json({
                success: true,
                discount
            });
        } catch (error) {
            // Обработка ошибки валидации данных скидки
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Обновляет существующую скидку.
     * @async
     * @function updateDiscount
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если данные обновления некорректны.
     */
    static async updateDiscount(req, res) {
        try {
            // Обновление скидки через DiscountService
            const discount = await DiscountService.updateDiscount(
                req.params.id, // ID скидки из параметров запроса
                req.body // Данные для обновления
            );

            // Успешный ответ с данными обновленной скидки
            res.json({
                success: true,
                discount
            });
        } catch (error) {
            // Обработка ошибки валидации данных обновления
            res.status(400).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Получает список всех скидок с возможностью фильтрации по активности и типу.
     * @async
     * @function getAllDiscounts
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод позволяет получить список всех скидок с учетом фильтров, таких как активность и тип скидки.
     */
    static async getAllDiscounts(req, res) {
        try {
            const { active, type } = req.query; // Извлечение параметров фильтрации из строки запроса
            const query = {}; // Инициализация объекта для фильтрации скидок

            // Фильтрация по типу скидки, если указан параметр type
            if (type) query.type = type;

            // Фильтрация по активности скидки
            if (active && active === 'true') {
                const now = new Date(); // Текущая дата для проверки активности скидок
                query.active = true; // Только активные скидки
                query.startDate = { $lte: now }; // Скидки, начавшиеся до текущей даты
                query.endDate = { $gte: now }; // Скидки, не истекшие на текущую дату
            } else if (active && active === 'false') {
                const now = new Date(); // Текущая дата для проверки неактивных скидок
                query.$or = [
                    { active: false }, // Неактивные скидки
                    { startDate: { $gt: now } }, // Скидки, которые еще не начались
                    { endDate: { $lt: now } } // Скидки, которые уже истекли
                ];
            }

            // Поиск скидок в базе данных с учетом фильтров и сортировка по дате создания
            const discounts = await Discount.find(query)
                .sort({ createdAt: -1 }); // Сортировка: сначала самые новые скидки

            // Успешный ответ с данными найденных скидок
            res.json({
                success: true,
                discounts
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
     * Получает скидку по ID.
     * @async
     * @function getDiscountById
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если скидка не найдена.
     * @throws Возвращает 500 в случае ошибки сервера.
     */
    static async getDiscountById(req, res) {
        try {
            // Поиск скидки по ID в базе данных
            const discount = await Discount.findById(req.params.id);

            // Проверка, найдена ли скидка
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    error: 'Discount not found' // Ошибка: скидка не найдена
                });
            }

            // Успешный ответ с данными найденной скидки
            res.json({
                success: true,
                discount
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
     * Удаляет скидку по ID.
     * @async
     * @function deleteDiscount
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если скидка не найдена.
     * @throws Возвращает 500 в случае ошибки сервера.
     */
    static async deleteDiscount(req, res) {
        try {
            // Удаление скидки по ID из базы данных
            const discount = await Discount.findByIdAndDelete(req.params.id);

            // Проверка, найдена ли скидка для удаления
            if (!discount) {
                return res.status(404).json({
                    success: false,
                    error: 'Discount not found' // Ошибка: скидка не найдена
                });
            }

            // Успешный ответ с сообщением об удалении скидки
            res.json({
                success: true,
                message: 'Discount deleted successfully'
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
     * Получает активные скидки для указанного продукта.
     * @async
     * @function getActiveDiscountsForProduct
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если у продукта нет категории.
     * @throws Возвращает 500 в случае ошибки сервера.
     */
    static async getProductDiscounts(req, res) {
        try {
            const { productId } = req.params; // Извлечение ID продукта из параметров запроса

            // Поиск продукта в базе данных
            const product = await Product.findById(productId);

            // Проверка, есть ли у продукта категория
            if (!product || !product.category) {
                return res.status(400).json({
                    success: false,
                    error: 'Product does not have a category' // Ошибка: у продукта нет категории
                });
            }

            const now = new Date(); // Текущая дата для фильтрации активных скидок

            // Поиск активных скидок, связанных с продуктом, категорией или общих скидок
            const discounts = await Discount.find({
                $or: [
                    { products: productId }, // Скидки, связанные с конкретным продуктом
                    { type: 'category', categories: product.category }, // Скидки, связанные с категорией продукта
                    { type: 'general' } // Общие скидки
                ],
                startDate: { $lte: now }, // Скидки, начавшиеся до текущей даты
                endDate: { $gte: now }, // Скидки, не истекшие на текущую дату
                active: true // Только активные скидки
            }).sort({ percentage: -1 }); // Сортировка скидок по убыванию процента

            // Успешный ответ с данными скидок
            res.json({
                success: true,
                discounts
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

module.exports = DiscountController; // Экспорт класса для использования в маршрутах
