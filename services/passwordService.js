/**
 * @module services/passwordService
 * @description Сервис для работы с паролями, включая их хэширование и сравнение.
 */

const bcrypt = require('bcryptjs');

/**
 * @function hashPassword
 * @description Хэширует пароль с использованием bcrypt.
 * @param {string} password - Пароль, который нужно хэшировать.
 * @returns {Promise<string>} Возвращает хэшированный пароль.
 * @throws {Error} Если возникает ошибка при генерации соли или хэшировании.
 */
const hashPassword = async (password) => {
    // Генерация соли для хэширования пароля.
    const salt = await bcrypt.genSalt(10);

    // Хэширование пароля с использованием сгенерированной соли.
    return await bcrypt.hash(password, salt);
};

/**
 * @function comparePasswords
 * @description Сравнивает введённый пароль с хэшированным паролем.
 * @param {string} candidatePassword - Введённый пользователем пароль.
 * @param {string} hashedPassword - Хэшированный пароль из базы данных.
 * @returns {Promise<boolean>} Возвращает true, если пароли совпадают, иначе false.
 * @throws {Error} Если возникает ошибка при сравнении паролей.
 */
const comparePasswords = async (candidatePassword, hashedPassword) => {
    // Сравнение пароля с хэшированным значением.
    return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = {
    hashPassword,
    comparePasswords
};