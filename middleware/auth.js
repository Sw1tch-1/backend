/**
 * @module middleware/auth
 * @description Middleware для проверки аутентификации пользователя.
 */

const jwt = require('jsonwebtoken'); // Библиотека для работы с JWT токенами
const User = require('../models/User'); // Модель пользователя для взаимодействия с базой данных
const logger = require('../config/logger'); // Логгер для записи событий

/**
 * Middleware для проверки аутентификации пользователя.
 * @async
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 401, если токен отсутствует, недействителен или пользователь не найден.
 * @description Этот middleware проверяет наличие и валидность токена, а также существование пользователя в базе данных.
 */
module.exports = async (req, res, next) => {
    try {
        // Извлечение токена из cookie или заголовка Authorization
        const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            // Логирование попытки доступа без токена
            logger.warn('Попытка доступа без токена');
            return res.status(401).json({
                success: false,
                error: 'Требуется аутентификация' // Ошибка: токен отсутствует
            });
        }

        // Проверка токена с использованием JWT
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Поиск пользователя по ID из токена
        const user = await User.findById(decoded.userId).select('-password -resetPasswordToken -resetPasswordExpires');
        if (!user) {
            // Логирование ошибки, если пользователь не найден
            logger.error(`Пользователь не найден для токена: ${token}`);
            return res.status(401).json({
                success: false,
                error: 'Пользователь не найден' // Ошибка: пользователь не найден
            });
        }

        // Добавление пользователя в объект запроса
        req.user = user;

        // Установка языка и темы из cookie или предпочтений пользователя
        req.lang = req.cookies.lang || user.preferences?.language || 'ru'; // Язык по умолчанию: русский
        req.theme = req.cookies.theme || user.preferences?.theme || 'light'; // Тема по умолчанию: светлая

        // Передача управления следующему middleware
        next();
    } catch (error) {
        // Логирование ошибки при обработке токена
        logger.error(`Ошибка аутентификации: ${error.message}`);

        // Очищаем невалидные куки
        res.clearCookie('accessToken', {
            domain: process.env.COOKIE_DOMAIN,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        });
        res.status(401).json({
            success: false,
            error: 'Недействительный токен' // Ошибка: токен недействителен
        });
    }
};