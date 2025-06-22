/**
 * @module routes/favoriteRoutes
 * @description Маршруты для управления избранными товарами пользователя.
 */

const express = require('express'); // Импорт библиотеки Express для создания маршрутов
const router = express.Router(); // Создание экземпляра маршрутизатора Express
const favoriteController = require('../controllers/favoriteController'); // Импорт контроллера для обработки логики избранного
const authMiddleware = require('../middleware/auth'); // Импорт middleware для проверки аутентификации

/**
 * Middleware для проверки аутентификации.
 * @middleware authMiddleware
 * @description Проверяет, авторизован ли пользователь, перед выполнением маршрутов избранного.
 */
router.use(authMiddleware);

/**
 * @route GET /
 * @description Получает список избранных товаров пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller favoriteController.getFavorites - Обрабатывает получение списка избранного.
 */
router.get('/', favoriteController.getFavorites);

/**
 * @route POST /add
 * @description Добавляет товар в избранное пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller favoriteController.addToFavorites - Обрабатывает добавление товара в избранное.
 */
router.post('/add', favoriteController.addToFavorites);

/**
 * @route DELETE /remove/:productId
 * @description Удаляет товар из избранного пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller favoriteController.removeFromFavorites - Обрабатывает удаление товара из избранного.
 */
router.delete('/remove/:productId', favoriteController.removeFromFavorites);

/**
 * @route GET /check/:productId
 * @description Проверяет, является ли товар избранным для пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller favoriteController.checkFavorite - Обрабатывает проверку статуса избранного.
 */
router.get('/check/:productId', favoriteController.checkFavorite);

module.exports = router; // Экспорт маршрутов для использования в основном приложении
