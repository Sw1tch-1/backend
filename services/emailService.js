/**
 * @module services/emailService
 * @description Сервис для отправки email-сообщений, включая сброс пароля, рассылку новостей и приветственные письма.
 */

const nodemailer = require('nodemailer');
const pug = require('pug');
const path = require('path');
const { convert } = require('html-to-text');
const User = require('../models/User');
const Newsletter = require('../models/Newsletter');

/**
 * @class EmailService
 * @description Класс, предоставляющий методы для работы с email-сообщениями.
 */
class EmailService {
    /**
     * @constructor
     * @description Инициализирует транспорт для отправки email с использованием конфигурации из переменных окружения.
     */
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST, // Хост SMTP-сервера.
            port: process.env.EMAIL_PORT, // Порт SMTP-сервера.
            secure: process.env.EMAIL_SECURE === 'true', // Использовать ли защищенное соединение.
            auth: {
                user: process.env.EMAIL_USER, // Имя пользователя для аутентификации.
                pass: process.env.EMAIL_PASS  // Пароль для аутентификации.
            }
        });
    }

    /**
     * @method sendEmail
     * @description Отправляет email-сообщение с использованием указанного шаблона и контекста.
     * @param {string} to - Адрес получателя.
     * @param {string} subject - Тема письма.
     * @param {string} template - Название шаблона письма (без расширения).
     * @param {Object} context - Контекст для рендеринга шаблона.
     * @returns {Promise<void>} Ничего не возвращает.
     * @throws {Error} Если отправка email завершилась ошибкой.
     */
    async sendEmail(to, subject, template, context) {
        try {
            // Рендеринг HTML-контента письма с использованием Pug-шаблона.
            const html = pug.renderFile(
                path.join(__dirname, `../views/emails/templates/${template}.pug`),
                {
                    ...context, // Передача контекста в шаблон.
                    baseUrl: process.env.FRONTEND_URL // Базовый URL для ссылок в письме.
                }
            );

            // Отправка email через SMTP-транспорт.
            await this.transporter.sendMail({
                from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`, // Отправитель.
                to, // Получатель.
                subject, // Тема письма.
                html, // HTML-контент письма.
                text: convert(html) // Текстовая версия письма, сгенерированная из HTML.
            });
        } catch (error) {
            // Проброс ошибки для обработки на уровне вызова.
            throw error;
        }
    }

    /**
     * @method sendWelcomeEmail
     * @description Отправляет приветственное письмо новому пользователю.
     * @param {string} userId - Идентификатор пользователя.
     * @returns {Promise<void>} Ничего не возвращает.
     * @throws {Error} Если пользователь не найден или отправка письма завершилась ошибкой.
     */
    async sendWelcomeEmail(userId) {
        // Поиск пользователя в базе данных по его идентификатору.
        const user = await User.findById(userId);

        // Если пользователь не найден, выбрасывается ошибка.
        if (!user) throw new Error('User not found');

        // Отправка приветственного письма с использованием метода sendEmail.
        await this.sendEmail(
            user.email, // Email получателя.
            'Добро пожаловать!', // Тема письма.
            'verification', // Шаблон письма.
            {
                name: user.firstName, // Имя пользователя для персонализации.
                email: user.email // Email пользователя для отображения в письме.
            }
        );
    }

    /**
     * @method sendVerificationEmail
     * @description Отправляет письмо для подтверждения email-адреса пользователя.
     * @param {string} userId - Идентификатор пользователя.
     * @param {string} token - Токен для подтверждения email.
     * @returns {Promise<void>} Ничего не возвращает.
     * @throws {Error} Если пользователь не найден или отправка письма завершилась ошибкой.
     */
    async sendVerificationEmail(userId, token) {
        try {
            // Логирование попытки отправки письма для подтверждения email.
            console.log(`Attempting to send verification email to user: ${userId}`);

            // Поиск пользователя в базе данных по его идентификатору.
            const user = await User.findById(userId);

            // Если пользователь не найден, выбрасывается ошибка.
            if (!user) {
                console.error('User not found for verification email');
                throw new Error('User not found');
            }

            // Формирование URL для подтверждения email с использованием токена.
            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
            console.log(`Verification URL: ${verificationUrl}`);

            // Отправка письма для подтверждения email с использованием метода sendEmail.
            await this.sendEmail(
                user.email, // Email получателя.
                'Подтвердите ваш email', // Тема письма.
                'verification', // Шаблон письма.
                {
                    name: user.firstName, // Имя пользователя для персонализации.
                    verifyUrl: verificationUrl, // Ссылка для подтверждения email.
                    expiresIn: '24 часа' // Время действия ссылки.
                }
            );

            // Логирование успешной отправки письма.
            console.log('Verification email sent successfully');
        } catch (error) {
            // Логирование ошибки при отправке письма.
            console.error('Error in sendVerificationEmail:', error);
            throw error;
        }
    }

    /**
     * @method sendPasswordResetEmail
     * @description Отправляет письмо для сброса пароля пользователю.
     * @param {string} userId - Идентификатор пользователя.
     * @param {string} resetToken - Токен для сброса пароля.
     * @returns {Promise<void>} Ничего не возвращает.
     * @throws {Error} Если пользователь не найден или отправка письма завершилась ошибкой.
     */
    async sendPasswordResetEmail(userId, resetToken) {
        // Поиск пользователя в базе данных по его идентификатору.
        const user = await User.findById(userId);

        // Если пользователь не найден, выбрасывается ошибка.
        if (!user) throw new Error('User not found');

        // Формирование URL для сброса пароля с использованием токена.
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        // Отправка письма для сброса пароля с использованием метода sendEmail.
        await this.sendEmail(
            user.email, // Email получателя.
            'Сброс пароля', // Тема письма.
            'reset', // Шаблон письма.
            {
                name: user.firstName, // Имя пользователя для персонализации.
                resetUrl: resetUrl, // Ссылка для сброса пароля.
                expiresIn: '1 час' // Время действия ссылки.
            }
        );
    }

    /**
     * @method sendNewsletter
     * @description Отправляет рассылку новостей подписчику.
     * @param {string} subscriberId - Идентификатор подписчика.
     * @param {string} content - Контент рассылки.
     * @returns {Promise<void>} Ничего не возвращает.
     * @throws {Error} Если подписчик не найден или отправка письма завершилась ошибкой.
     */
    async sendNewsletter(subscriberId, content) {
        // Поиск подписчика в базе данных с использованием его идентификатора.
        const subscriber = await Newsletter.findById(subscriberId).populate('user');

        // Если подписчик не найден, выбрасывается ошибка.
        if (!subscriber) {
            throw new Error('Subscriber not found');
        }

        // Отправка email с использованием метода sendEmail.
        await this.sendEmail(
            subscriber.email, // Email получателя.
            'Новости от Елены Мелякиной', // Тема письма.
            'newsletter', // Шаблон письма.
            {
                name: subscriber.user?.firstName || 'друг', // Имя подписчика или "друг" по умолчанию.
                content: content // Контент рассылки.
            }
        );
    }
}

module.exports = new EmailService();