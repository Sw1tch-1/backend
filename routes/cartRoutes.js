/**
 * @module routes/cartRoutes
 * @description Маршруты для управления корзиной пользователя.
 */

const express = require('express'); // Импорт библиотеки Express для создания маршрутов
const router = express.Router(); // Создание экземпляра маршрутизатора Express
const cartController = require('../controllers/cartController'); // Импорт контроллера для обработки логики корзины
const authMiddleware = require('../middleware/auth'); // Импорт middleware для проверки аутентификации

/**
 * Middleware для проверки аутентификации.
 * @middleware authMiddleware
 * @description Проверяет, авторизован ли пользователь, перед выполнением маршрутов корзины.
 */
router.use(authMiddleware);

/**
 * @route GET /
 * @description Получает текущую корзину пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller cartController.getCart - Обрабатывает получение корзины.
 */
router.get('/', cartController.getCart);

/**
 * @route POST /add
 * @description Добавляет товар в корзину пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller cartController.addToCart - Обрабатывает добавление товара в корзину.
 */
router.post('/add', cartController.addToCart);

/**
 * @route PUT /update/:itemId
 * @description Обновляет количество товара в корзине пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller cartController.updateCartItem - Обрабатывает обновление количества товара.
 */
router.put('/update/:itemId', cartController.updateCartItem);

/**
 * @route DELETE /remove/:itemId
 * @description Удаляет товар из корзины пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller cartController.removeFromCart - Обрабатывает удаление товара из корзины.
 */
router.delete('/remove/:itemId', cartController.removeFromCart);

/**
 * @route DELETE /clear
 * @description Очищает корзину пользователя.
 * @middleware authMiddleware - Проверяет аутентификацию пользователя.
 * @controller cartController.clearCart - Обрабатывает очистку корзины.
 */
router.delete('/clear', cartController.clearCart);

module.exports = router; // Экспорт маршрутов для использования в основном приложении
