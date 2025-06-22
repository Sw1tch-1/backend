/**
 * @module routes/newsletterRoutes
 * @description Маршруты для управления подпиской на рассылку, отправкой обновлений и просмотром подписчиков.
 */

const express = require('express');
const router = express.Router();
const newsletterController = require('../controllers/newsletterController');
const adminMiddleware = require('../middleware/admin');
const {validateEmail} = require('../middleware/validation');
const authController = require('../controllers/authController');

/**
 * @route POST /subscribe
 * @description Маршрут для подписки на рассылку.
 * @middleware validateEmail - Проверяет корректность email перед обработкой запроса.
 * @controller newsletterController.subscribe - Обрабатывает логику подписки.
 */
router.post('/subscribe', validateEmail, newsletterController.subscribe);

/**
 * @route POST /unsubscribe
 * @description Маршрут для отписки от рассылки.
 * @middleware validateEmail - Проверяет корректность email перед обработкой запроса.
 * @controller newsletterController.unsubscribe - Обрабатывает логику отписки.
 */
router.post('/unsubscribe', validateEmail, newsletterController.unsubscribe);

/**
 * @route POST /send
 * @description Маршрут для отправки обновлений подписчикам.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @controller newsletterController.sendUpdates - Обрабатывает логику отправки обновлений.
 */
router.post('/send', authController.verifyToken, adminMiddleware, newsletterController.sendUpdates);

/**
 * @route GET /subscribers
 * @description Маршрут для получения списка подписчиков.
 * @middleware authController.verifyToken - Проверяет токен авторизации пользователя.
 * @middleware adminMiddleware - Проверяет, является ли пользователь администратором.
 * @controller newsletterController.getSubscribers - Обрабатывает логику получения списка подписчиков.
 */
router.get('/subscribers', authController.verifyToken, adminMiddleware, newsletterController.getSubscribers);

module.exports = router;