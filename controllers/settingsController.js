const { appSettings, cookieSettings } = require('../config/appConfig');

/**
 * @module controllers/settingsController
 * @description Контроллер для управления пользовательскими настройками.
 */

class SettingsController {
    /**
     * Обновляет язык пользователя.
     * @async
     * @function updateLanguage
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки обновления языка.
     */
    static async updateLanguage(req, res) {
        try {
            const { language } = req.body;

            // Обновление предпочтений пользователя.
            req.user.preferences.language = language;
            await req.user.save();

            // Установка cookie для языка.
            res.cookie('lang', language, {
                ...cookieSettings,
                maxAge: 365 * 24 * 60 * 60 * 1000, 
                httpOnly: true
            });

            res.json({
                success: true,
                message: 'Language preference updated'
            });

        } catch (error) {
            console.error('Language update error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update language settings'
            });
        }
    }

    /**
     * Обновляет тему пользователя.
     * @async
     * @function updateTheme
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки обновления темы.
     */
    static async updateTheme(req, res) {
        try {
            const { theme } = req.body;

            // Обновление предпочтений пользователя.
            req.user.preferences.theme = theme;
            await req.user.save();

            // Установка cookie для темы.
            res.cookie('theme', theme, {
                ...cookieSettings,
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: false
            });

            res.json({
                success: true,
                message: 'Theme preference updated'
            });

        } catch (error) {
            console.error('Theme update error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update theme settings'
            });
        }
    }

    /**
     * Получает текущие настройки пользователя.
     * @async
     * @function getSettings
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки получения настроек.
     */
    static async getSettings(req, res) {
        try {
            const { preferences } = req.user;

            res.json({
                success: true,
                preferences: {
                    language: preferences.language,
                    theme: preferences.theme
                }
            });

        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve user settings'
            });
        }
    }

    /**
     * Сбрасывает настройки пользователя на значения по умолчанию.
     * @async
     * @function resetSettings
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки сброса настроек.
     */
    static async resetSettings(req, res) {
        try {
            // Сброс предпочтений пользователя.
            req.user.preferences = {
                language: 'ru',
                theme: 'light'
            };
            await req.user.save();

            // Очистка cookie.
            res.clearCookie('lang', cookieSettings);
            res.clearCookie('theme', cookieSettings);

            res.json({
                success: true,
                message: 'Settings reset to default'
            });

        } catch (error) {
            console.error('Reset settings error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to reset settings'
            });
        }
    }

    /**
     * Возвращает список поддерживаемых языков.
     * @function getSupportedLanguages
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     */
    static getSupportedLanguages(req, res) {
        res.json({
            success: true,
            languages: appSettings.supportedLanguages,
            defaultLanguage: appSettings.defaultSettings.language
        });
    }

    /**
     * Возвращает список поддерживаемых тем.
     * @function getSupportedThemes
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     */
    static getSupportedThemes(req, res) {
        res.json({
            success: true,
            themes: appSettings.supportedThemes,
            defaultTheme: appSettings.defaultSettings.theme
        });
    }
}

module.exports = SettingsController;