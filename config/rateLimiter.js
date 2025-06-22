/**
 * @module config/rateLimiter
 * @description Конфигурация ограничения запросов с использованием express-rate-limit.
 */

const rateLimit = require('express-rate-limit');
const logger = require('./logger');

/**
 * Лимитер для API запросов.
 * @type {rateLimit.RateLimit}
 */
const limiter = rateLimit({
    // Временное окно для подсчета запросов (15 минут).
    windowMs: 15 * 60 * 1000,
    // Максимальное количество запросов за временное окно.
    max: process.env.RATE_LIMIT_MAX || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        // Логируем превышение лимита запросов.
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json({
            error: 'Too many requests, please try again later'
        });
    }
});

/**
 * Лимитер для аутентификационных запросов.
 * @type {rateLimit.RateLimit}
 */
const authLimiter = rateLimit({
    // Временное окно для подсчета запросов (1 час).
    windowMs: 60 * 60 * 1000,
    // Максимальное количество запросов за временное окно.
    max: process.env.AUTH_RATE_LIMIT_MAX || 5,
    message: 'Too many login attempts, please try again after an hour'
});

module.exports = {
    apiLimiter: limiter,
    authLimiter
};