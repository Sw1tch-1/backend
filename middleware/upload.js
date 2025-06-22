/**
 * @module middleware/upload
 * @description Middleware для обработки загрузки файлов с использованием multer.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');


require('events').EventEmitter.defaultMaxListeners = 20; // Увеличение лимита слушателей событий для предотвращения утечек памяти

/**
 * Директория для сохранения загружаемых файлов.
 * @constant
 * @type {string}
 */
const uploadDir = path.join(process.cwd(), 'public', 'uploads');

/**
 * Проверка существования директории для загрузок.
 * Если директория не существует, она создаётся рекурсивно.
 */
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Конфигурация хранилища для multer.
 * @constant
 * @type {Object}
 */
const storage = multer.diskStorage({
    /**
     * Устанавливает директорию для сохранения файлов.
     * @function
     * @param {Object} req - Объект запроса Express.
     * @param {Object} file - Объект файла, переданного через форму.
     * @param {Function} cb - Callback для передачи пути сохранения.
     */
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Установка директории для сохранения файлов
    },
    /**
     * Устанавливает имя файла.
     * @function
     * @param {Object} req - Объект запроса Express.
     * @param {Object} file - Объект файла, переданного через форму.
     * @param {Function} cb - Callback для передачи имени файла.
     */
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase(); // Извлечение расширения файла
        cb(null, `${uuidv4()}${ext}`); // Генерация уникального имени файла
    }
});

/**
 * Фильтр для проверки типа файла.
 * @function
 * @param {Object} req - Объект запроса Express.
 * @param {Object} file - Объект файла, переданного через форму.
 * @param {Function} cb - Callback для передачи результата проверки.
 * @description Разрешены только файлы с типами image/jpeg, image/png и image/webp.
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']; // Список разрешённых типов файлов
    cb(null, allowedTypes.includes(file.mimetype)); // Проверка типа файла
};

/**
 * Конфигурация multer для обработки загрузки файлов.
 * @constant
 * @type {Object}
 */
const upload = multer({
    storage, // Использование настроенного хранилища
    fileFilter, // Использование фильтра для проверки типа файла
    limits: { fileSize: 5 * 1024 * 1024 } // Ограничение размера файла (5 МБ)
});

module.exports = upload; // Экспорт middleware для использования в маршрутах
