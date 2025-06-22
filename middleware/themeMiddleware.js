/**
 * @module middleware/themeMiddleware
 * @description Middleware для установки темы пользователя.
 */

module.exports = (req, res, next) => {
    /**
     * Устанавливает тему пользователя.
     * @function
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @param {Function} next - Функция следующего промежуточного обработчика.
     * @description Этот middleware проверяет наличие cookie с темой пользователя и устанавливает её. Если cookie отсутствует, используется тема по умолчанию ('light').
     */

    // Установка локальной переменной для темы. Если cookie с темой отсутствует, используется тема по умолчанию ('light').
    res.locals.theme = req.cookies.theme || 'light';

    // Передача управления следующему middleware
    next();
};