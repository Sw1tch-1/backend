/**
 * @module config/logger
 * @description Конфигурация логгера с использованием библиотеки Winston.
 */

const winston = require('winston');
const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Форматирует лог-сообщения.
 * @function logFormat
 * @param {Object} param0 - Объект с данными лога.
 * @param {string} param0.level - Уровень лога.
 * @param {string} param0.message - Сообщение лога.
 * @param {string} param0.timestamp - Время лога.
 * @param {string} [param0.stack] - Стек ошибки (если есть).
 * @returns {string} Отформатированное сообщение лога.
 */
const logFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

/**
 * Конфигурация логгера.
 * @type {winston.Logger}
 */
const logger = winston.createLogger({
    // Уровень логирования по умолчанию.
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production' ? json() : combine(colorize(), logFormat)
    ),
    transports: [
        // Логирование в консоль.
        new winston.transports.Console(),
        // Логирование ошибок в файл.
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024
        }),
        // Логирование всех сообщений в файл.
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10 * 1024 * 1024
        })
    ],
    exceptionHandlers: [
        // Логирование необработанных исключений.
        new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
        // Логирование необработанных отклонений промисов.
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
});

if (process.env.NODE_ENV === 'test') {
    // Отключаем логирование в тестовом режиме.
    logger.transports.forEach(transport => {
        transport.silent = true;
    });
}

module.exports = logger;