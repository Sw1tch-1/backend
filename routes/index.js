/**
 * @module routes/index
 * @description Главный файл маршрутов, объединяющий все маршруты приложения.
 */

const express = require('express');
const router = express.Router();


const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const favoriteRoutes = require('./favoriteRoutes');
const newsletterRoutes = require('./newsletterRoutes');
const discountRoutes = require('./discountRoutes');
const settingsRoutes = require('./settingsRoutes');


/**
 * Подключение маршрутов для различных частей приложения.
 * @middleware router.use
 * @description Подключает маршруты для аутентификации, продуктов, корзины, избранного, рассылок, скидок и настроек.
 */
router.use('/auth', authRoutes); // Маршруты для аутентификации
router.use('/products', productRoutes); // Маршруты для управления продуктами
router.use('/cart', cartRoutes); // Маршруты для управления корзиной
router.use('/favorites', favoriteRoutes); // Маршруты для управления избранным
router.use('/newsletter', newsletterRoutes); // Маршруты для управления подписками на рассылку
router.use('/discounts', discountRoutes); // Маршруты для управления скидками
router.use('/settings', settingsRoutes); // Маршруты для управления настройками


/**
 * @route GET /health
 * @description Проверяет состояние сервера.
 * @returns {Object} Объект с состоянием сервера и текущим временем.
 */
router.get('/health', (req, res) => {
    res.status(200).json({status: 'OK', timestamp: new Date()}); // Ответ с состоянием сервера
});


/**
 * @route ALL *
 * @description Обрабатывает запросы на несуществующие маршруты.
 * @returns {Object} Объект с ошибкой 404.
 */
router.use('*', (req, res) => {
    res.status(404).json({error: 'Endpoint not found'}); // Ответ с ошибкой 404
});


/**
 * Middleware для настройки заголовков CORS.
 * @middleware router.use
 * @description Устанавливает заголовки для разрешения CORS-запросов.
 */
router.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Разрешает запросы с любого источника
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Разрешает указанные HTTP-методы
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Разрешает указанные заголовки
    next(); // Передача управления следующему middleware
});


module.exports = router; // Экспорт маршрутов для использования в основном приложении
