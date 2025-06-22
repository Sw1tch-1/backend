/**
 * @module models/Favorite
 * @description Модель избранного для хранения списка избранных товаров пользователя.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB

/**
 * Схема избранного.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о пользователе, его избранных товарах и времени обновления.
 */
const favoriteSchema = new mongoose.Schema({
    /**
     * Ссылка на пользователя.
     * @type {mongoose.Schema.Types.ObjectId}
     * @description Указывает на пользователя, которому принадлежит список избранного.
     */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Ссылка на модель User
        required: true, // Поле обязательно для заполнения
        unique: true // Уникальный список избранного для каждого пользователя
    },
    /**
     * Список избранных товаров.
     * @type {Array<mongoose.Schema.Types.ObjectId>}
     * @description Массив ссылок на товары, добавленные в избранное.
     */
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product' // Ссылка на модель Product
    }],
    /**
     * Дата последнего обновления списка избранного.
     * @type {Date}
     * @description Указывает дату и время последнего изменения списка избранного.
     */
    updatedAt: {
        type: Date,
        default: Date.now // Значение по умолчанию - текущая дата
    }
});

/**
 * Middleware для обновления времени последнего изменения списка избранного перед сохранением.
 * @function
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @description Устанавливает поле updatedAt в текущую дату перед сохранением документа.
 */
favoriteSchema.pre('save', function (next) {
    this.updatedAt = Date.now(); // Установка текущей даты в поле updatedAt
    next(); // Передача управления следующему middleware
});

module.exports = mongoose.model('Favorite', favoriteSchema); // Экспорт модели избранного для использования в других модулях
