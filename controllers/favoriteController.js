/**
 * @module controllers/favoriteController
 * @description Контроллер для управления избранными товарами пользователя.
 */

// Импорт модели избранного для работы с коллекцией избранных товаров
const Favorite = require('../models/Favorite');
// Импорт модели продукта для проверки существования товара
const Product = require('../models/Product');

/**
 * @class FavoriteController
 * @description Класс для управления избранными товарами пользователя.
 */
class FavoriteController {
    /**
     * Получает список избранных товаров пользователя.
     * @async
     * @function getFavorites
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки получения данных.
     */
    static async getFavorites(req, res) {
        try {
            // Поиск всех избранных товаров пользователя с использованием его ID
            const favorites = await Favorite.find({ user: req.user._id })
                .populate('product', 'name price imageUrl'); // Подключение данных о продукте

            // Успешный ответ с данными избранных товаров
            res.status(200).json({
                success: true,
                favorites
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
     * Добавляет товар в избранное пользователя.
     * @async
     * @function addToFavorites
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если товар не найден.
     * @throws Возвращает 500 в случае ошибки добавления в избранное.
     */
    static async addToFavorites(req, res) {
        try {
            const { productId } = req.body; // Извлечение ID продукта из тела запроса

            // Проверка существования продукта в базе данных
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found' // Ошибка: продукт не найден
                });
            }

            // Проверка, добавлен ли уже продукт в избранное
            const existingFavorite = await Favorite.findOne({
                user: req.user._id, // ID пользователя из токена
                product: productId // ID продукта
            });

            if (existingFavorite) {
                return res.status(400).json({
                    success: false,
                    error: 'Product already in favorites' // Ошибка: продукт уже в избранном
                });
            }

            // Создание нового избранного товара
            const favorite = new Favorite({
                user: req.user._id, // ID пользователя из токена
                product: productId // ID продукта
            });

            // Сохранение избранного товара в базе данных
            await favorite.save();

            // Успешный ответ с данными нового избранного товара
            res.status(201).json({
                success: true,
                message: 'Product added to favorites',
                favorite
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
     * Удаляет товар из избранного пользователя.
     * @async
     * @function removeFromFavorites
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если избранное не найдено.
     * @throws Возвращает 500 в случае ошибки удаления из избранного.
     */
    static async removeFromFavorites(req, res) {
        try {
            const { productId } = req.params; // Извлечение ID продукта из параметров запроса

            // Поиск и удаление избранного товара пользователя
            const favorite = await Favorite.findOneAndDelete({
                user: req.user._id, // ID пользователя из токена
                product: productId // ID продукта
            });

            if (!favorite) {
                return res.status(404).json({
                    success: false,
                    error: 'Favorite not found' // Ошибка: избранное не найдено
                });
            }

            // Успешный ответ с сообщением об удалении
            res.status(200).json({
                success: true,
                message: 'Product removed from favorites'
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
     * Проверяет, является ли товар избранным для пользователя.
     * @async
     * @function checkFavorite
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки проверки данных.
     */
    static async checkFavorite(req, res) {
        try {
            const { productId } = req.params; // Извлечение ID продукта из параметров запроса

            // Поиск избранного товара пользователя
            const favorite = await Favorite.findOne({
                user: req.user._id, // ID пользователя из токена
                product: productId // ID продукта
            });

            // Успешный ответ с информацией о том, является ли товар избранным
            res.status(200).json({
                success: true,
                isFavorite: !!favorite // Преобразование результата в булево значение
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

module.exports = FavoriteController; // Экспорт класса для использования в маршрутах
