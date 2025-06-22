/**
 * @module middleware/validation
 * @description Middleware для валидации данных запросов.
 */

const { check, validationResult } = require('express-validator'); // Импорт функции для проверки результатов валидации
const validator = require('validator');
const { appSettings } = require('../config/appConfig'); // Импорт настроек приложения


/**
 * Проверяет результаты валидации запросов.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если есть ошибки валидации.
 * @description Этот middleware проверяет, есть ли ошибки валидации, и возвращает их, если они есть.
 */
exports.validateRequest = [
    (req, res, next) => {
        // Проверка наличия ошибок валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Возврат ответа с ошибками валидации
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // Передача управления следующему middleware
    }
];

/**
 * Проверяет, поддерживается ли указанный язык.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если язык не поддерживается.
 * @description Этот middleware проверяет, поддерживается ли указанный язык, и возвращает ошибку, если он не поддерживается.
 */
exports.validateLanguage = (req, res, next) => {
    // Получение списка поддерживаемых языков из настроек приложения
    const supportedCodes = appSettings.supportedLanguages.map(lang => lang.code);

    // Проверка, поддерживается ли указанный язык
    if (!supportedCodes.includes(req.body.language)) {
        return res.status(400).json({
            success: false,
            error: `Unsupported language. Supported: ${supportedCodes.join(', ')}` // Ошибка: язык не поддерживается
        });
    }
    next(); // Передача управления следующему middleware
};

/**
 * Проверяет, поддерживается ли указанная тема.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если тема не поддерживается.
 * @description Этот middleware проверяет, поддерживается ли указанная тема, и возвращает ошибку, если она не поддерживается.
 */
exports.validateTheme = (req, res, next) => {
    // Получение списка поддерживаемых тем из настроек приложения
    const supportedThemes = appSettings.supportedThemes.map(theme => theme.id);

    // Проверка, поддерживается ли указанная тема
    if (!supportedThemes.includes(req.body.theme)) {
        return res.status(400).json({
            success: false,
            error: `Unsupported theme. Supported: ${supportedThemes.join(', ')}` // Ошибка: тема не поддерживается
        });
    }
    next(); // Передача управления следующему middleware
};

/**
 * Валидация данных при регистрации.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если есть ошибки валидации.
 * @description Этот middleware выполняет валидацию данных, предоставленных пользователем при регистрации.
 */
exports.validateRegister = [
    check('email').isEmail().withMessage('Некорректный email'), // Проверка, что email имеет корректный формат
    check('password')
        .isLength({ min: 8 })
        .withMessage('Пароль должен быть не менее 8 символов'), // Проверка минимальной длины пароля
    check('firstName').notEmpty().withMessage('Укажите имя'), // Проверка, что имя не пустое
    check('lastName').notEmpty().withMessage('Укажите фамилию'), // Проверка, что фамилия не пустая
    check('phone')
        .isMobilePhone('any')
        .withMessage('Некорректный номер телефона'), // Проверка, что номер телефона корректен
    (req, res, next) => {
        // Извлечение ошибок валидации из запроса
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем их в ответе с кодом 400
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // Если ошибок нет, передаем управление следующему middleware
    }
];

/**
 * Валидация данных при входе в систему.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если есть ошибки валидации.
 * @description Этот middleware выполняет валидацию данных, предоставленных пользователем при входе в систему.
 */
exports.validateLogin = [
    check('email').isEmail().withMessage('Invalid email'), // Проверка, что email имеет корректный формат
    check('password').exists().withMessage('Password is required'), // Проверка, что пароль предоставлен
    (req, res, next) => {
        // Извлечение ошибок валидации из запроса
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем их в ответе с кодом 400
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // Если ошибок нет, передаем управление следующему middleware
    }
];

/**
 * Валидация email-адреса.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} res - Объект ответа Express.
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @throws Возвращает 400, если email некорректен.
 * @description Этот middleware выполняет валидацию email-адреса, предоставленного пользователем.
 */
exports.validateEmail = [
    check('email').isEmail().withMessage('Invalid email'), // Проверка, что email имеет корректный формат
    (req, res, next) => {
        // Извлечение ошибок валидации из запроса
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Если есть ошибки, возвращаем их в ответе с кодом 400
            return res.status(400).json({ errors: errors.array() });
        }
        next(); // Если ошибок нет, передаем управление следующему middleware
    }
];
