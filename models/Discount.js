/**
 * @module models/Discount
 * @description Модель скидок для управления различными типами скидок в системе.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB

/**
 * Схема скидок.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о скидке, включая название, описание, процент, тип и связанные сущности.
 */
const discountSchema = new mongoose.Schema({
    /**
     * Название скидки.
     * @type {String}
     * @description Обязательное поле для указания названия скидки.
     */
    name: {
        type: String,
        required: true
    },
    /**
     * Описание скидки.
     * @type {String}
     * @description Необязательное поле для описания скидки.
     */
    description: String,
    /**
     * Процент скидки.
     * @type {Number}
     * @description Обязательное поле для указания процента скидки (от 0 до 100).
     */
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    /**
     * Тип скидки.
     * @type {String}
     * @description Указывает, к чему применяется скидка (например, к продукту, категории, группе пользователей или общая скидка).
     */
    type: {
        type: String,
        enum: ['product', 'category', 'userGroup', 'general'],
        required: true
    },
    /**
     * Продукты, к которым применяется скидка.
     * @type {Array<mongoose.Schema.Types.ObjectId>}
     * @description Список ссылок на продукты, к которым применяется скидка.
     */
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    /**
     * Категории, к которым применяется скидка.
     * @type {Array<String>}
     * @description Список категорий, к которым применяется скидка.
     */
    categories: [String],
    /**
     * Группа пользователей, к которой применяется скидка.
     * @type {String}
     * @description Указывает группу пользователей, для которых действует скидка.
     */
    userGroup: String,
    /**
     * Дата начала действия скидки.
     * @type {Date}
     * @description Обязательное поле для указания даты начала действия скидки.
     */
    startDate: {
        type: Date,
        required: true
    },
    /**
     * Дата окончания действия скидки.
     * @type {Date}
     * @description Обязательное поле для указания даты окончания действия скидки.
     */
    endDate: {
        type: Date,
        required: true
    },
    /**
     * Статус активности скидки.
     * @type {Boolean}
     * @description Указывает, активна ли скидка. По умолчанию - true.
     */
    active: {
        type: Boolean,
        default: true
    },
    /**
     * Дата создания записи о скидке.
     * @type {Date}
     * @description Указывает дату и время создания записи о скидке. По умолчанию - текущее время.
     */
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * Middleware перед сохранением скидки.
 * @function
 * @description Устанавливает статус активности скидки на основе текущей даты и дат начала и окончания действия скидки.
 * @param {Function} next - Функция обратного вызова для перехода к следующему шагу обработки.
 */
discountSchema.pre('save', function (next) {

    const now = new Date();
    this.active = this.startDate <= now && this.endDate >= now;
    next();
});

module.exports = mongoose.model('Discount', discountSchema); // Экспорт модели скидки для использования в других модулях
