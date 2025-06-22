/**
 * @module config/appConfig
 * @description Конфигурация приложения, включая настройки cookie и пользовательские параметры.
 */

module.exports = {
    /**
     * Настройки cookie.
     * @type {Object}
     * @property {string} sameSite - Политика SameSite для cookie.
     * @property {boolean} secure - Использование защищенного соединения для cookie.
     * @property {string} domain - Домен для cookie.
     */
    cookieSettings: {
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || 'localhost'
    },

    appSettings: {
        /**
         * Поддерживаемые языки приложения.
         * @type {Array<{code: string, name: string}>}
         */
        supportedLanguages: [
            { code: 'ru', name: 'Русский' },
            { code: 'en', name: 'English' }
        ],

        /**
         * Поддерживаемые темы приложения.
         * @type {Array<{id: string, name: string}>}
         */
        supportedThemes: [
            { id: 'light', name: 'Светлая' },
            { id: 'dark', name: 'Тёмная' }
        ],

        /**
         * Настройки по умолчанию для приложения.
         * @type {Object}
         * @property {string} language - Язык по умолчанию.
         * @property {string} theme - Тема по умолчанию.
         */
        defaultSettings: {
            language: 'ru',
            theme: 'light'
        }
    }
};