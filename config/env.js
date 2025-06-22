/**
 * @module config/env
 * @description Модуль для проверки и валидации переменных окружения.
 */

/**
 * Проверяет наличие всех необходимых переменных окружения.
 * Завершает процесс с кодом 1, если какие-либо переменные отсутствуют.
 * @function validateEnv
 */

const logger = require('./logger');
const { error } = require('winston');

const validateEnv = () => {
    const requiredVars = [
        'MONGODB_URI',
        'JWT_ACCESS_SECRET',
        'JWT_REFRESH_SECRET',
        'EMAIL_HOST',
        'EMAIL_PORT',
        'EMAIL_USER',
        'EMAIL_PASS'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        // Логируем отсутствующие переменные окружения.
        logger.error(`Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }


    if (process.env.NODE_ENV === 'production') {
        if (process.env.EMAIL_SECURE !== 'true') {
            // Предупреждаем, если EMAIL_SECURE не установлен в true в режиме production.
            logger.warn('EMAIL_SECURE is not set to true in production mode');
        }
    }

    logger.info('Environment variables validated successfully');
};

module.exports = validateEnv;