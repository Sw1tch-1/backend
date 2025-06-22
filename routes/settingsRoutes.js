/**
 * @module routes/settingsRoutes
 * @description Маршруты для управления настройками пользователя, включая язык, тему и получение доступных опций.
 */

const express = require('express');
const router = express.Router();
const {validateLanguage, validateTheme} = require('../middleware/validation');
const authMiddleware = require('../middleware/auth');
const settingsController = require('../controllers/settingsController');

/**
 * @route POST /language
 * @description Обновление языка пользователя.
 * @middleware authMiddleware - Проверяет, авторизован ли пользователь.
 * @middleware validateLanguage - Проверяет корректность переданного языка.
 * @controller settingsController.updateLanguage - Обрабатывает логику обновления языка.
 */
router.post('/language', authMiddleware, validateLanguage, settingsController.updateLanguage);

/**
 * @route POST /theme
 * @description Обновление темы пользователя.
 * @middleware authMiddleware - Проверяет, авторизован ли пользователь.
 * @middleware validateTheme - Проверяет корректность переданной темы.
 * @controller settingsController.updateTheme - Обрабатывает логику обновления темы.
 */
router.post('/theme', authMiddleware, validateTheme, settingsController.updateTheme);

/**
 * @route GET /
 * @description Получение текущих настроек пользователя.
 * @middleware authMiddleware - Проверяет, авторизован ли пользователь.
 * @controller settingsController.getSettings - Обрабатывает логику получения настроек.
 */
router.get('/', authMiddleware, settingsController.getSettings);

/**
 * @route GET /languages
 * @description Получение списка поддерживаемых языков.
 * @controller settingsController.getSupportedLanguages - Обрабатывает логику получения списка языков.
 */
router.get('/languages', settingsController.getSupportedLanguages);

/**
 * @route GET /themes
 * @description Получение списка поддерживаемых тем.
 * @controller settingsController.getSupportedThemes - Обрабатывает логику получения списка тем.
 */
router.get('/themes', settingsController.getSupportedThemes);

module.exports = router;