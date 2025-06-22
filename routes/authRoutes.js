/**
 * @module routes/authRoutes
 * @description Маршруты для управления аутентификацией и регистрацией пользователей.
 */

const express = require('express'); // Импорт библиотеки Express для создания маршрутов
const router = express.Router(); // Создание экземпляра маршрутизатора Express
const authController = require('../controllers/authController'); // Импорт контроллера для обработки логики аутентификации
const {validateRegister, validateLogin} = require('../middleware/validation'); // Импорт middleware для валидации данных

/**
 * @route POST /register
 * @description Регистрирует нового пользователя.
 * @middleware validateRegister - Проверяет корректность данных регистрации.
 * @controller authController.register - Обрабатывает регистрацию пользователя.
 */
router.post('/register', validateRegister, authController.register);

/**
 * @route POST /login
 * @description Авторизует пользователя.
 * @middleware validateLogin - Проверяет корректность данных для входа.
 * @controller authController.login - Обрабатывает вход пользователя в систему.
 */
router.post('/login', validateLogin, authController.login);

/**
 * @route POST /logout
 * @description Выходит из системы.
 * @controller authController.logout - Обрабатывает выход пользователя из системы.
 */
router.post('/logout', authController.logout);

/**
 * @route POST /forgot-password
 * @description Инициирует процесс сброса пароля.
 * @controller authController.forgotPassword - Обрабатывает запрос на сброс пароля.
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route POST /reset-password/:token
 * @description Сбрасывает пароль пользователя с использованием токена.
 * @controller authController.resetPassword - Обрабатывает сброс пароля.
 */
router.post('/reset-password/:token', authController.resetPassword);

/**
 * @route GET /verify-email/:token
 * @description Подтверждает email пользователя с использованием токена.
 * @controller authController.verifyEmail - Обрабатывает подтверждение email.
 */
router.get('/verify-email/:token', authController.verifyEmail);

/**
 * @route POST /resend-verification
 * @description Повторно отправляет письмо для подтверждения email.
 * @controller authController.resendVerificationEmail - Обрабатывает повторную отправку письма.
 */
router.post('/resend-verification', authController.resendVerificationEmail);

/**
 * @route GET /test
 * @description Тестовый маршрут для проверки работы API.
 * @returns {Object} Сообщение о работе API.
 */
router.get('/test', (req, res) => {
    res.json({message: 'API is working!'});
});

module.exports = router; // Экспорт маршрутов для использования в основном приложении
