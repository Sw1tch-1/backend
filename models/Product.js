/**
 * @module models/Product
 * @description Модель продукта для управления товарами в системе.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB

/**
 * Схема продукта.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о продукте, включая название, описание, цену, категорию, изображение, запас и временные метки.
 */
const productSchema = new mongoose.Schema({
    /**
     * Название продукта.
     * @type {String}
     * @description Обязательное поле для указания названия продукта. Удаляются лишние пробелы.
     */
    name: {
        type: String,
        required: true,
        trim: true
    },
    /**
     * Описание продукта.
     * @type {String}
     * @description Обязательное поле для указания описания продукта.
     */
    description: {
        type: String,
        required: true
    },
    /**
     * Цена продукта.
     * @type {Number}
     * @description Обязательное поле для указания цены продукта. Минимальное значение - 0.
     */
    price: {
        type: Number,
        required: true,
        min: 0
    },
    /**
     * Категория продукта.
     * @type {String}
     * @description Обязательное поле для указания категории продукта.
     */
    category: {
        type: String,
        required: true
    },
    /**
     * URL изображения продукта.
     * @type {String}
     * @description Обязательное поле для указания URL изображения продукта.
     */
    imageUrl: {
        type: String,
        required: true
    },
    /**
     * Запас продукта.
     * @type {Number}
     * @description Обязательное поле для указания запаса продукта. Минимальное значение - 0.
     */
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    /**
     * Дата создания продукта.
     * @type {Date}
     * @description Указывает дату и время создания продукта. По умолчанию - текущая дата.
     */
    createdAt: {
        type: Date,
        default: Date.now
    },
    /**
     * Дата последнего обновления продукта.
     * @type {Date}
     * @description Указывает дату и время последнего обновления продукта.
     */
    updatedAt: {
        type: Date,
        default: Date.now
    },
    /**
     * Флаг активности продукта.
     * @type {Boolean}
     * @description Указывает, активен ли продукт. По умолчанию - true.
     */
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});


/**
 * Виртуальное поле для информации о скидке.
 * @name discountInfo
 * @memberof module:models/Product~productSchema
 * @type {Object}
 * @property {String} discountId - Идентификатор скидки.
 * @property {String} discountName - Название скидки.
 * @property {Number} discountPercentage - Процент скидки.
 * @property {Number} originalPrice - Исходная цена продукта.
 * @property {Number} discountedPrice - Цена со скидкой.
 * @property {Boolean} hasDiscount - Наличие скидки.
 * @property {String} discountType - Тип скидки.
 */
productSchema.virtual('discountInfo').get(function () {
    return this._discountInfo;
}).set(function (value) {
    this._discountInfo = value;
});


/**
 * Применяет скидку к продукту.
 * @function
 * @param {String} [userId=null] - Идентификатор пользователя, если скидка персонализированная.
 * @returns {Promise<productSchema>} Обещание с обновленным продуктом.
 * @description Вычисляет и применяет наилучшую скидку для продукта в зависимости от пользователя и типа скидки.
 */
productSchema.methods.applyDiscount = async function (userId = null) {
    const discount = await DiscountService.calculateBestDiscount(this._id, userId);

    if (discount) {

        const discountMultiplier = (100 - discount.percentage) / 100;
        const discountedPrice = Math.round(this.price * discountMultiplier * 100) / 100;

        this.discountInfo = {
            discountId: discount._id,
            discountName: discount.name,
            discountPercentage: discount.percentage,
            originalPrice: this.price,
            discountedPrice: discountedPrice,
            hasDiscount: true,
            discountType: discount.type
        };
    } else {
        this.discountInfo = {
            originalPrice: this.price,
            discountedPrice: this.price,
            hasDiscount: false
        };
    }

    return this;
};


/**
 * Middleware для обновления времени последнего изменения продукта перед сохранением.
 * @function
 * @param {Function} next - Функция следующего промежуточного обработчика.
 * @description Устанавливает поле updatedAt в текущую дату перед сохранением документа.
 */
productSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

productSchema.index({category: 1, isActive: 1, price: 1, name: 1, createdAt: -1});

module.exports = mongoose.model('Product', productSchema); // Экспорт модели продукта для использования в других модулях
