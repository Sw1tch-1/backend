/**
 * @module middleware/languageMiddleware
 * @description Middleware для определения языка пользователя.
 */

module.exports = (req, res, next) => {
    /**
     * Список поддерживаемых языков.
     * @constant
     * @type {string[]}
     */
    const supportedLangs = ['ru', 'en'];

    /**
     * Определение языка пользователя.
     * @type {string}
     * @description Язык определяется из cookie, заголовков Accept-Language или переменной окружения.
     */
    let lang = req.cookies.lang ||
        req.acceptsLanguages(...supportedLangs) ||
        process.env.DEFAULT_LANGUAGE || 'ru';

    /**
     * Проверка, поддерживается ли определённый язык.
     * Если язык не поддерживается, устанавливается язык по умолчанию ('ru').
     */
    if (!supportedLangs.includes(lang)) lang = 'ru';

    /**
     * Установка локальной переменной для языка.
     * @description Эта переменная будет доступна в шаблонах и других middleware.
     */
    res.locals.lang = lang;

    // Передача управления следующему middleware
    next();
};