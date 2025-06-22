/**
 * @module models/User
 * @description Модель пользователя для управления данными пользователей в системе.
 */

const mongoose = require('mongoose'); // Импорт библиотеки mongoose для работы с MongoDB
const bcrypt = require('bcryptjs'); // Импорт библиотеки bcryptjs для хэширования паролей
const validator = require('validator'); // Импорт библиотеки validator для проверки email

/**
 * Схема пользователя.
 * @constant
 * @type {mongoose.Schema}
 * @description Содержит информацию о пользователе, включая имя, фамилию, телефон, email, пароль и другие параметры.
 */
const userSchema = new mongoose.Schema({
    /**
     * Имя пользователя.
     * @type {String}
     * @description Обязательное поле для указания имени пользователя.
     */
    firstName: {type: String, required: true},
    /**
     * Фамилия пользователя.
     * @type {String}
     * @description Обязательное поле для указания фамилии пользователя.
     */
    lastName: {type: String, required: true},
    /**
     * Телефон пользователя.
     * @type {String}
     * @description Обязательное поле для указания телефона пользователя.
     */
    phone: {type: String, required: true},
    /**
     * Флаг подтверждения email.
     * @type {Boolean}
     * @description Указывает, подтвержден ли email пользователя. По умолчанию - false.
     */
    isEmailVerified: {type: Boolean, default: false},
    /**
     * Токен для подтверждения email.
     * @type {String}
     * @description Хранит токен для подтверждения email пользователя.
     */
    emailVerificationToken: String,
    /**
     * Время истечения токена подтверждения email.
     * @type {Date}
     * @description Указывает дату и время истечения токена подтверждения email.
     */
    emailVerificationExpires: Date,
    /**
     * Email пользователя.
     * @type {String}
     * @description Обязательное поле, уникальное для каждого пользователя. Проверяется на корректность формата.
     */
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        validate(value) {
            // Проверка корректности email с использованием библиотеки validator
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid'); // Ошибка: некорректный email
            }
        }
    },
    /**
     * Пароль пользователя.
     * @type {String}
     * @description Обязательное поле для указания пароля пользователя. Минимальная длина - 6 символов.
     */
    password: {
        type: String,
        required: true,
        minlength: 6,
        trim: true
    },
    /**
     * Дата создания пользователя.
     * @type {Date}
     * @description Указывает дату и время создания пользователя. По умолчанию - текущая дата.
     */
    createdAt: {
        type: Date,
        default: Date.now
    },
    /**
     * Токен для сброса пароля.
     * @type {String}
     * @description Хранит токен для сброса пароля пользователя.
     */
    resetPasswordToken: String,
    /**
     * Время истечения токена сброса пароля.
     * @type {Date}
     * @description Указывает дату и время истечения токена сброса пароля.
     */
    resetPasswordExpires: Date,
    /**
     * Группа пользователя.
     * @type {String}
     * @description Указывает группу пользователя (например, admin, user).
     */
    userGroup: {
        type: String,
        default: 'regular'
    },
    /**
     * Предпочтения пользователя.
     * @type {Object}
     * @description Содержит настройки предпочтений пользователя, такие как язык и тема оформления.
     * @property {String} language - Предпочитаемый язык пользователя. По умолчанию - 'ru'.
     * @property {String} theme - Предпочитаемая тема оформления. По умолчанию - 'light'.
     */
    preferences: {
        language: {type: String, default: 'ru'},
        theme: {type: String, default: 'light'}
    }
});

/**
 * Хук перед сохранением пользователя.
 * @function
 * @description Хэширует пароль пользователя перед сохранением в базу данных, если пароль был изменен.
 * @param {Function} next - Функция обратного вызова для передачи управления следующему хук
 */
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

/**
 * Сравнивает введенный пароль с хранимым хэшом пароля.
 * @function
 * @param {String} candidatePassword - Введенный пароль для сравнения.
 * @returns {Promise<Boolean>} - Результат сравнения паролей (true, если пароли совпадают).
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Уникальный индекс для поля email
userSchema.index({email: 1}, {unique: true});

/**
 * Модель пользователя.
 * @module models/User
 * @description Экспортирует модель пользователя для использования в других частях приложения.
 */
module.exports = mongoose.model('User', userSchema);