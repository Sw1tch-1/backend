/**
 * @file server.js
 * @description Основной файл для запуска сервера. Содержит настройку подключения к базе данных, конфигурацию приложения и обработку завершения работы сервера.
 */

require('dotenv').config(); // Загрузка переменных окружения из файла .env.

const app = require('./app'); // Подключение основного приложения Express.
const connectDB = require('./config/db'); // Функция для подключения к базе данных MongoDB.
const validateEnv = require('./config/env'); // Функция для проверки наличия необходимых переменных окружения.
const logger = require('./config/logger'); // Логгер для записи информации о работе приложения.
const {apiLimiter, authLimiter} = require('./config/rateLimiter'); // Ограничители частоты запросов для API и аутентификации.
const jwtConfig = require('./config/jwt'); // Конфигурация JWT токенов.
require('events').EventEmitter.defaultMaxListeners = 20; // Увеличение лимита слушателей событий для предотвращения утечек памяти.
process.setMaxListeners(20); // Установка глобального лимита слушателей событий.

// Проверка переменных окружения перед запуском приложения.
validateEnv();

// Подключение к базе данных.
connectDB()
    .then(() => {
        logger.info('Database connection established'); // Логирование успешного подключения к базе данных.

        // Применение ограничителя частоты запросов для всех маршрутов API.
        app.use(apiLimiter);

        // Применение отдельного ограничителя для маршрутов аутентификации.
        app.use('/api/auth', authLimiter);

        // Проверка наличия секрета для JWT токенов.
        if (!jwtConfig.accessToken.secret) {
            throw new Error('JWT access token secret not configured'); // Генерация ошибки, если секрет не настроен.
        }

        // Установка порта для запуска сервера.
        const PORT = process.env.PORT || 5001;

        // Запуск сервера и логирование информации о режиме работы.
        const server = app.listen(PORT, () => {
            logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
            logger.debug(`JWT config: ${JSON.stringify(jwtConfig, null, 2)}`); // Логирование конфигурации JWT для отладки.
        });

        /**
         * @function shutdown
         * @description Обрабатывает завершение работы сервера при получении сигнала завершения.
         * @param {string} signal - Сигнал завершения (например, SIGINT или SIGTERM).
         */
        const shutdown = async (signal) => {
            // Логирование получения сигнала завершения.
            logger.warn(`${signal} signal received: closing server`);

            try {
                // Закрытие подключения к базе данных.
                await mongoose.connection.close();
                logger.info('Database connection closed');

                // Закрытие сервера.
                server.close(() => {
                    logger.info('Server closed');
                    process.exit(0); // Завершение процесса с кодом 0.
                });

                // Установка таймера для принудительного завершения процесса.
                setTimeout(() => {
                    logger.error('Forcing shutdown after timeout');
                    process.exit(1); // Завершение процесса с кодом 1.
                }, 5000);

            } catch (err) {
                // Логирование ошибки при завершении работы.
                logger.error('Shutdown error:', err);
                process.exit(1); // Завершение процесса с кодом 1 в случае ошибки.
            }
        };

        // Обработка сигналов завершения работы.
        process.on('SIGINT', () => shutdown('SIGINT')); // Обработка сигнала SIGINT (Ctrl+C).
        process.on('SIGTERM', () => shutdown('SIGTERM')); // Обработка сигнала SIGTERM (завершение процесса).

        // Обработка необработанных исключений.
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err); // Логирование необработанного исключения.
            shutdown('uncaughtException'); // Завершение работы сервера.
        });

        // Обработка необработанных отклонений промисов.
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason); // Логирование отклонения.
        });


        /**
         * @route GET /health
         * @description Проверяет состояние сервера и базы данных.
         * @returns {Object} JSON-объект с информацией о состоянии сервера, времени работы, состоянии базы данных и использовании памяти.
         */
        app.get('/health', (req, res) => {
            // Формирование объекта состояния сервера.
            const health = {
                status: 'UP', // Статус сервера.
                timestamp: new Date(), // Текущая дата и время.
                dbState: mongoose.connection.readyState, // Состояние подключения к базе данных.
                uptime: process.uptime(), // Время работы сервера в секундах.
                memoryUsage: process.memoryUsage() // Использование памяти процессом.
            };

            // Отправка ответа с кодом 200 и объектом состояния.
            res.status(200).json(health);
        });

    })
    .catch((err) => {
        logger.error(`Database connection error: ${err.message}`); // Логирование ошибки подключения к базе данных.
        process.exit(1); // Завершение процесса с кодом 1 в случае ошибки.
    });