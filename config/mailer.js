const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * @module config/mailer
 * @description Конфигурация для отправки email с использованием Nodemailer.
 */

/**
 * Транспорт для отправки email.
 * @type {nodemailer.Transporter}
 */
const transporter = nodemailer.createTransport({
    // Хост SMTP сервера.
    host: process.env.EMAIL_HOST,
    // Порт SMTP сервера.
    port: process.env.EMAIL_PORT,
    // Использование защищенного соединения.
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        // Учетные данные для аутентификации.
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        // Отклонение неавторизованных сертификатов в режиме production.
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
});

transporter.verify((error) => {
    if (error) {
        // Логируем ошибку подключения к SMTP серверу.
        logger.error('Mailer connection error:', error);
    } else {
        // Логируем успешное подключение к SMTP серверу.
        logger.info('Mailer is ready to send emails');
    }
});

module.exports = transporter;