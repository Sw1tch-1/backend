/**
 * @module routes/discountRoutes
 * @description Маршруты для управления скидками в системе.
 */

const express = require('express'); // Импорт библиотеки Express для создания маршрутов
const router = express.Router(); // Создание экземпляра маршрутизатора Express
const DiscountController = require('../controllers/discountController'); // Импорт контроллера для обработки логики скидок
const authController = require('../controllers/authController'); // Импорт контроллера для проверки токена аутентификации
const adminMiddleware = require('../middleware/admin'); // Импорт middleware для проверки прав администратора

/**
 * @route GET /
 * @description Получает список всех скидок.
 * @controller DiscountController.getAllDiscounts - Обрабатывает получение всех скидок.
 */
router.get('/', DiscountController.getAllDiscounts);

/**
 * @route GET /:id
 * @description Получает информацию о скидке по её ID.
 * @controller DiscountController.getDiscountById - Обрабатывает получение скидки по ID.
 */
router.get('/:id', DiscountController.getDiscountById);

/**
 * @route GET /product/:productId
 * @description Получает скидки, связанные с указанным продуктом.
 * @controller DiscountController.getProductDiscounts - Обрабатывает получение скидок для продукта.
 */
router.get('/product/:productId', DiscountController.getProductDiscounts);

/**
 * @route POST /
 * @description Создаёт новую скидку.
 * @middleware authController.verifyToken - Проверяет токен аутентификации пользователя.
 * @middleware adminMiddleware - Проверяет права администратора.
 * @controller DiscountController.createDiscount - Обрабатывает создание новой скидки.
 */
router.post('/', authController.verifyToken, adminMiddleware, DiscountController.createDiscount);

/**
 * @route PUT /:id
 * @description Обновляет существующую скидку по её ID.
 * @middleware authController.verifyToken - Проверяет токен аутентификации пользователя.
 * @middleware adminMiddleware - Проверяет права администратора.
 * @controller DiscountController.updateDiscount - Обрабатывает обновление скидки.
 */
router.put('/:id', authController.verifyToken, adminMiddleware, DiscountController.updateDiscount);

/**
 * @route DELETE /:id
 * @description Удаляет скидку по её ID.
 * @middleware authController.verifyToken - Проверяет токен аутентификации пользователя.
 * @middleware adminMiddleware - Проверяет права администратора.
 * @controller DiscountController.deleteDiscount - Обрабатывает удаление скидки.
 */
router.delete('/:id', authController.verifyToken, adminMiddleware, DiscountController.deleteDiscount);

module.exports = router; // Экспорт маршрутов для использования в основном приложении
