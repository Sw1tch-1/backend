/**
 * @module controllers/authController
 * @description Контроллер для управления аутентификацией и регистрацией пользователей.
 */

const jwt = require('jsonwebtoken'); // Библиотека для работы с JWT токенами
const User = require('../models/User'); // Модель пользователя для взаимодействия с базой данных
const emailService = require('../services/emailService'); // Сервис для отправки email
const crypto = require('crypto'); // Библиотека для работы с криптографией
const validator = require('validator'); // Библиотека для валидации данных, таких как email и телефон

/**
 * @class AuthController
 * @description Класс для управления аутентификацией и регистрацией пользователей.
 */
class AuthController {
    /**
     * Регистрирует нового пользователя.
     * @async
     * @function register
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если email или телефон некорректны, или email уже используется.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод регистрирует нового пользователя, проверяя корректность email и телефона, а также уникальность email.
     */
    static async register(req, res) {
        try {
            const {email, password, firstName, lastName, phone} = req.body; // Извлечение данных из тела запроса

            // Проверка формата email и телефона
            if (!validator.isEmail(email)) {
                return res.status(400).json({error: 'Некорректный формат email'}); // Ошибка: некорректный email
            }
            if (!validator.isMobilePhone(phone, 'any')) {
                return res.status(400).json({error: 'Некорректный номер телефона'}); // Ошибка: некорректный номер телефона
            }

            // Проверка на существование пользователя с таким email
            const existingUser = await User.findOne({email});
            if (existingUser) {
                return res.status(400).json({error: 'Email уже используется'}); // Ошибка: email уже зарегистрирован
            }

            // Создание нового пользователя с настройками по умолчанию
            const user = new User({
                email,
                password,
                firstName,
                lastName,
                phone,
                isEmailVerified: false, // Установка флага подтверждения email в false
                preferences: {
                    language: 'ru', // Язык по умолчанию
                    theme: 'light' // Тема по умолчанию
                }
            });

            // Генерация токена для подтверждения email
            const verificationToken = crypto.randomBytes(20).toString('hex');
            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // Токен действителен 24 часа

            await user.save(); // Сохранение пользователя в базе данных

            // Отправка email с токеном подтверждения
            await emailService.sendVerificationEmail(user._id, verificationToken);

            // Успешный ответ с сообщением
            res.status(201).json({
                success: true,
                message: 'Регистрация успешна. Пожалуйста, подтвердите ваш email.',
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Подтверждает email пользователя.
     * @async
     * @function verifyEmail
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если токен недействителен или истек.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод подтверждает email пользователя, используя токен подтверждения.
     */
    static async verifyEmail(req, res) {
        try {
            const {token} = req.params; // Извлечение токена из параметров запроса

            // Поиск пользователя по токену подтверждения email
            const user = await User.findOne({
                emailVerificationToken: token,
                emailVerificationExpires: {$gt: Date.now()} // Проверка, что токен не истек
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный или просроченный токен' // Ошибка: токен недействителен
                });
            }

            // Обновление статуса подтверждения email
            user.isEmailVerified = true;
            user.emailVerificationToken = undefined; // Удаление токена
            user.emailVerificationExpires = undefined; // Удаление времени истечения
            await user.save();

            // Отправка приветственного письма
            await emailService.sendWelcomeEmail(user._id);

            // Генерация JWT токена для аутентификации
            const authToken = jwt.sign({userId: user._id}, process.env.JWT_ACCESS_SECRET, {
                expiresIn: '7d' // Токен действителен 7 дней
            });

            // Успешный ответ с данными пользователя и токеном
            res.json({
                success: true,
                message: 'Email успешно подтвержден!',
                token: authToken,
                user: {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                    isEmailVerified: true
                }
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Авторизует пользователя.
     * @async
     * @function login
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если email или пароль отсутствуют.
     * @throws Возвращает 401, если пользователь не найден или пароль неверный.
     * @throws Возвращает 403, если email не подтвержден.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод выполняет вход пользователя в систему, проверяя учетные данные и статус подтверждения email.
     */
    static async login(req, res) {
        try {
            const {email, password, rememberMe = false} = req.body; // Извлечение данных из тела запроса

            // Проверка наличия email и пароля
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email и пароль обязательны' // Ошибка: отсутствуют учетные данные
                });
            }

            // Поиск пользователя по email
            const user = await User.findOne({email}).select('+password'); // Включение пароля в выборку
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не найден' // Ошибка: пользователь не найден
                });
            }

            // Проверка пароля
            const isPasswordValid = await user.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    error: 'Неверные учетные данные' // Ошибка: неверный пароль
                });
            }

            // Проверка статуса подтверждения email
            if (!user.isEmailVerified) {
                return res.status(403).json({
                    success: false,
                    error: 'Подтвердите ваш email. Проверьте вашу почту.' // Ошибка: email не подтвержден
                });
            }

            // Генерация JWT токена
            const tokenExpiresIn = rememberMe ? '30d' : '7d'; // Срок действия токена
            const token = jwt.sign(
                {
                    userId: user._id,
                    role: user.userGroup
                },
                process.env.JWT_ACCESS_SECRET,
                {expiresIn: tokenExpiresIn}
            );

            // Настройки cookie для токена
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                domain: process.env.COOKIE_DOMAIN,
                maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
            };

            const userPreferences = user.preferences || {
                language: process.env.DEFAULT_LANGUAGE || 'ru',
                theme: process.env.DEFAULT_THEME || 'light'
            };


            res.cookie('accessToken', token, cookieOptions);
            res.cookie('lang', userPreferences.language, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: false
            });
            res.cookie('theme', userPreferences.theme, {
                maxAge: 365 * 24 * 60 * 60 * 1000,
                httpOnly: false
            });
            console.log('Cookies:', req.cookies);

            // Формирование ответа с данными пользователя
            const userResponse = {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                isEmailVerified: user.isEmailVerified,
                preferences: userPreferences,
                role: user.userGroup,
                adminToken: token
            };

            // Успешный ответ с данными пользователя
            res.status(200).json({
                success: true,
                user: userResponse
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: 'Внутренняя ошибка сервера'
            });
        }
    }

    /**
     * Выходит из системы.
     * @function logout
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @returns {Object} Ответ с сообщением об успешном выходе.
     * @description этот метод очищает cookie с токеном доступа и завершает сессию пользователя.
     */
    static logout(req, res) {
        // Очистка cookie с токеном доступа
        res.clearCookie('accessToken', {
            domain: process.env.COOKIE_DOMAIN, // Домен для cookie
            httpOnly: true, // Cookie доступно только через HTTP (не доступно через JavaScript)
            secure: process.env.NODE_ENV === 'production' // Использовать secure только в продакшене
        });

        // Успешный ответ с сообщением об успешном выходе
        res.json({success: true, message: 'Вы успешно вышли из системы'});
    }


    /**
     * Инициирует процесс сброса пароля.
     * @async
     * @function forgotPassword
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если пользователь не найден.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод отправляет пользователю email с инструкциями по сбросу пароля.
     */
    static async forgotPassword(req, res) {
        try {
            const {email} = req.body; // Извлечение email из тела запроса

            // Поиск пользователя по email
            const user = await User.findOne({email});
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден' // Ошибка: пользователь с таким email не найден
                });
            }

            // Генерация токена для сброса пароля
            const resetToken = crypto.randomBytes(20).toString('hex');
            const resetPasswordExpires = Date.now() + 3600000; // Токен действителен 1 час

            // Сохранение токена и времени истечения в базе данных
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetPasswordExpires;
            await user.save();

            // Отправка email с инструкциями по сбросу пароля
            await emailService.sendPasswordResetEmail(user._id, resetToken);

            // Успешный ответ с сообщением
            res.json({
                success: true,
                message: 'Инструкции по сбросу пароля отправлены на ваш email'
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Сбрасывает пароль пользователя.
     * @async
     * @function resetPassword
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если токен недействителен или истек.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод сбрасывает пароль пользователя, используя токен сброса.
     */
    static async resetPassword(req, res) {
        try {
            const {token} = req.params; // Извлечение токена из параметров запроса
            const {password} = req.body; // Извлечение нового пароля из тела запроса

            // Поиск пользователя по токену сброса пароля
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: {$gt: Date.now()} // Проверка, что токен не истек
            });

            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'Неверный или просроченный токен' // Ошибка: токен недействителен
                });
            }

            // Обновление пароля пользователя
            user.password = password;
            user.resetPasswordToken = undefined; // Удаление токена
            user.resetPasswordExpires = undefined; // Удаление времени истечения
            await user.save();

            // Успешный ответ с сообщением
            res.json({
                success: true,
                message: 'Пароль успешно изменен'
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Повторно отправляет письмо для подтверждения email.
     * @async
     * @function resendVerificationEmail
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 404, если пользователь не найден.
     * @throws Возвращает 400, если email уже подтвержден.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод отправляет повторное письмо для подтверждения email пользователя.
     */
    static async resendVerificationEmail(req, res) {
        try {
            const {email} = req.body; // Извлечение email из тела запроса

            // Поиск пользователя по email
            const user = await User.findOne({email});

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'Пользователь не найден' // Ошибка: пользователь с таким email не найден
                });
            }

            if (user.isEmailVerified) {
                return res.status(400).json({
                    success: false,
                    error: 'Email уже подтвержден' // Ошибка: email уже подтвержден
                });
            }

            // Генерация нового токена для подтверждения email
            const verificationToken = crypto.randomBytes(20).toString('hex');
            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // Токен действителен 24 часа
            await user.save();

            // Отправка email с новым токеном подтверждения
            await emailService.sendVerificationEmail(user._id, verificationToken);

            // Успешный ответ с сообщением
            res.json({
                success: true,
                message: 'Письмо с подтверждением отправлено повторно'
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    /**
     * Проверяет токен аутентификации.
     * @async
     * @function verifyToken
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @param {Function} next - Функция следующего промежуточного обработчика.
     * @throws Возвращает 401, если токен отсутствует или недействителен.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод проверяет токен аутентификации пользователя.
     */
    static async verifyToken(req, res, next) {
        try {
            const token = req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', ''); // Извлечение токена из cookie или заголовка

            if (!token) {
                return res.status(401).json({
                    success: false,
                    error: 'Требуется аутентификация' // Ошибка: токен отсутствует
                });
            }

            // Проверка токена с использованием JWT
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            // Поиск пользователя по ID из токена
            const user = await User.findOne({_id: decoded.userId});

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Пользователь не найден' // Ошибка: пользователь не найден
                });
            }

            req.user = user; // Добавление пользователя в объект запроса
            next(); // Переход к следующему промежуточному обработчику
        } catch (error) {
            // Обработка ошибки токена
            res.status(401).json({
                success: false,
                error: 'Недействительный токен'
            });
        }
    }

    /**
     * Обновляет предпочтения пользователя.
     * @async
     * @function updatePreferences
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае внутренней ошибки сервера.
     * @description Этот метод обновляет предпочтения пользователя, такие как язык и тема.
     */
    static async updatePreferences(req, res) {
        try {
            const {language, theme} = req.body; // Извлечение предпочтений из тела запроса

            // Обновление предпочтений пользователя в базе данных
            const user = await User.findByIdAndUpdate(
                req.user._id,
                {
                    $set: {
                        'preferences.language': language, // Обновление языка
                        'preferences.theme': theme // Обновление темы
                    }
                },
                {new: true} // Возврат обновленного документа
            );

            // Установка cookie с новыми предпочтениями
            res.cookie('lang', language, {maxAge: 365 * 24 * 60 * 60 * 1000});
            res.cookie('theme', theme, {maxAge: 365 * 24 * 60 * 60 * 1000});

            // Успешный ответ с обновленными предпочтениями
            res.json({
                success: true,
                preferences: user.preferences
            });
        } catch (error) {
            // Обработка ошибки сервера
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = AuthController; // Экспорт класса для использования в маршрутах
