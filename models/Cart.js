/**
 * @module models/Cart
 * @description Модель корзины для хранения товаров, добавленных пользователем.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB

/**
 * Схема элемента корзины.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о товаре, количестве и времени добавления.
 */
const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId, // Ссылка на модель Product
        ref: 'Product',
        required: true // Поле обязательно для заполнения
    },
    quantity: {
        type: Number, // Количество товара
        required: true, // Поле обязательно для заполнения
        min: 1, // Минимальное значение - 1
        default: 1 // Значение по умолчанию - 1
    },
    addedAt: {
        type: Date, // Дата добавления товара в корзину
        default: Date.now // Значение по умолчанию - текущая дата
    }
});

/**
 * Схема корзины пользователя.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о пользователе, элементах корзины и времени обновления.
 */
const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Ссылка на модель User
        ref: 'User',
        required: true, // Поле обязательно для заполнения
        unique: true // Уникальная корзина для каждого пользователя
    },
    items: [cartItemSchema], // Массив элементов корзины
    updatedAt: {
        type: Date, // Дата последнего обновления корзины
        default: Date.now // Значение по умолчанию - текущая дата
    }
});

/**
 * Middleware для обновления времени последнего изменения корзины перед сохранением.
 * @function
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @description Устанавливает поле updatedAt в текущую дату перед сохранением документа.
 */
cartSchema.pre('save', function (next) {
    this.updatedAt = Date.now(); // Установка текущей даты в поле updatedAt
    next(); // Передача управления следующему middleware
});

module.exports = mongoose.model('Cart', cartSchema);