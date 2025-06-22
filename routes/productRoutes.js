/**
 * @module routes/productRoutes
 * @description Маршруты для управления продуктами, включая создание, обновление, удаление и восстановление.
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const adminMiddleware = require('../middleware/admin');
const upload = require('../middleware/upload');
const authController = require('../controllers/authController');

/**
 * @route GET /
 * @description Получение всех продуктов.
 * @controller productController.getAllProducts - Обрабатывает логику получения всех продуктов.
 */
router.get('/', productController.getAllProducts);

/**
 * @route GET /search
 * @description Поиск продуктов по заданным критериям.
 * @controller productController.searchProducts - Обрабатывает логику поиска продуктов.
 */
router.get('/search', productController.searchProducts);

/**
 * @route GET /:id
 * @description Получение информации о продукте по его ID.
 * @controller productController.getProductById - Обрабатывает логику получения продукта по ID.
 */
router.get('/:id', productController.getProductById);

/**
 * @route POST /
 * @description Создание нового продукта.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @middleware upload.single('image') - Обрабатывает загрузку изображения продукта.
 * @controller productController.createProduct - Обрабатывает логику создания продукта.
 */
router.post('/', authController.verifyToken, adminMiddleware, upload.single('image'), productController.createProduct);

/**
 * @route PUT /:id
 * @description Обновление информации о продукте по его ID.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @middleware upload.single('image') - Обрабатывает загрузку нового изображения продукта.
 * @controller productController.updateProduct - Обрабатывает логику обновления продукта.
 */
router.put('/:id', authController.verifyToken, adminMiddleware, upload.single('image'), productController.updateProduct);

/**
 * @route DELETE /:id
 * @description Удаление продукта по его ID.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @controller productController.deleteProduct - Обрабатывает логику удаления продукта.
 */
router.delete('/:id', authController.verifyToken, adminMiddleware, productController.deleteProduct);

/**
 * @route POST /:id/restore
 * @description Восстановление ранее удаленного продукта по его ID.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @controller productController.restoreProduct - Обрабатывает логику восстановления продукта.
 */
router.post('/:id/restore', authController.verifyToken, adminMiddleware, productController.restoreProduct);

module.exports = router;