/**
 * @module middleware/errorHandler
 * @description Middleware для обработки ошибок в приложении.
 */

module.exports = (err, req, res, next) => {
    /**
     * Middleware для обработки ошибок.
     * @function
     * @param {Object} err - Объект ошибки, содержащий информацию о произошедшей ошибке.
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @param {Function} next - Функция следующего промежуточного обработчика.
     * @description Этот middleware обрабатывает ошибки, логирует их и отправляет ответ с соответствующим статусом и сообщением.
     */

    // Логирование стека ошибки для отладки
    console.error(err.stack);

    // Установка кода состояния ответа. Если он не указан, используется 500 (Internal Server Error)
    const statusCode = err.statusCode || 500;

    // Установка сообщения об ошибке. Если оно не указано, используется "Internal Server Error"
    const message = err.message || 'Internal Server Error';

    // Формирование ответа с информацией об ошибке
    res.status(statusCode).json({
        success: false, // Указывает, что запрос завершился с ошибкой
        statusCode, // Код состояния HTTP
        message // Сообщение об ошибке
    });
};