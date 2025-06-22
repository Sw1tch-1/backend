/**
 * @module middleware/admin
 * @description Middleware для проверки прав администратора у пользователя.
 */

module.exports = (req, res, next) => {
    /**
     * Проверяет, является ли пользователь администратором.
     * @function
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @param {Function} next - Функция следующего промежуточного обработчика.
     * @throws Возвращает 403, если пользователь не является администратором.
     */

    // Проверка, имеет ли пользователь группу "admin"
    if (req.user?.userGroup === 'admin') {
        return next(); // Если пользователь администратор, передаем управление следующему middleware
    }

    // Ответ с ошибкой 403, если пользователь не администратор
    res.status(403).json({ error: 'Forbidden: Admin rights required'});
};