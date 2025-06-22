/**
 * @module models/Newsletter
 * @description Модель для управления подписками на рассылку.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB
const validator = require('validator'); // Импорт библиотеки validator для проверки email

/**
 * Схема подписки на рассылку.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о подписчике, включая email, пользователя, дату подписки и статус активности.
 */
const newsletterSchema = new mongoose.Schema({
    /**
     * Email подписчика.
     * @type {String}
     * @description Обязательное поле, уникальное для каждого подписчика. Проверяется на корректность формата.
     */
    email: {
        type: String,
        required: true, // Поле обязательно для заполнения
        unique: true, // Email должен быть уникальным
        trim: true, // Удаление пробелов в начале и конце строки
        lowercase: true, // Преобразование email в нижний регистр
        validate(value) {
            // Проверка корректности email с использованием библиотеки validator
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid'); // Ошибка: некорректный email
            }
        }
    },
    /**
     * Ссылка на пользователя.
     * @type {mongoose.Schema.Types.ObjectId}
     * @description Указывает на пользователя, связанного с подпиской.
     */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Ссылка на модель User
    },
    /**
     * Дата подписки.
     * @type {Date}
     * @description Указывает дату и время подписки. По умолчанию - текущая дата.
     */
    subscribedAt: {
        type: Date,
        default: Date.now // Значение по умолчанию - текущая дата
    },
    /**
     * Статус активности подписки.
     * @type {Boolean}
     * @description Указывает, активна ли подписка. По умолчанию - true.
     */
    isActive: {
        type: Boolean,
        default: true // Значение по умолчанию - активная подписка
    }
});

module.exports = mongoose.model('Newsletter', newsletterSchema); // Экспорт модели подписки для использования в других модулях
