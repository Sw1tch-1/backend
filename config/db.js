/**
 * @module config/db
 * @description Модуль для подключения к базе данных MongoDB.
 */

/**
 * Подключается к базе данных MongoDB с использованием mongoose.
 * @async
 * @function connectDB
 * @returns {Promise<mongoose.Connection>} Возвращает объект подключения.
 * @throws Завершает процесс с кодом 1, если подключение не удалось.
 */

const mongoose = require('mongoose');
const logger = require('./logger');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Используем новый парсер URL для подключения.
            useNewUrlParser: true,
            // Включаем поддержку нового механизма управления соединениями.
            useUnifiedTopology: true,
            // Автоматическое создание индексов только в режиме разработки.
            autoIndex: process.env.NODE_ENV === 'development',
            // Максимальное количество соединений в пуле.
            maxPoolSize: 10,
            // Таймаут выбора сервера.
            serverSelectionTimeoutMS: 5000,
            // Таймаут сокета.
            socketTimeoutMS: 45000
        });

        logger.info(`MongoDB connected: ${conn.connection.host}`);

        mongoose.connection.on('error', err => {
            // Логируем ошибки подключения к MongoDB.
            logger.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            // Логируем событие отключения от MongoDB.
            logger.warn('MongoDB disconnected');
        });

        return conn;
    } catch (err) {
        logger.error(`MongoDB connection error: ${err}`);
        process.exit(1);
    }
};

module.exports = connectDB;