/**
 * @module config/jwt
 * @description Конфигурация для работы с JWT токенами.
 */

/**
 * Конфигурация JWT токенов.
 * @typedef {Object} JwtConfig
 * @property {Object} accessToken - Конфигурация для access токена.
 * @property {string} accessToken.secret - Секретный ключ для access токена.
 * @property {string} accessToken.expiresIn - Время жизни access токена.
 * @property {Object} refreshToken - Конфигурация для refresh токена.
 * @property {string} refreshToken.secret - Секретный ключ для refresh токена.
 * @property {string} refreshToken.expiresIn - Время жизни refresh токена.
 */

/**
 * @type {JwtConfig}
 */
const jwtConfig = {
    // Конфигурация access токена.
    accessToken: {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m'
    },
    // Конфигурация refresh токена.
    refreshToken: {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    }
};

if (!jwtConfig.accessToken.secret || !jwtConfig.refreshToken.secret) {
    // Логируем ошибку, если конфигурация JWT некорректна.
    logger.error('JWT configuration is invalid');
    process.exit(1);
}

module.exports = jwtConfig;