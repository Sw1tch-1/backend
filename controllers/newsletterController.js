/**
 * @module controllers/newsletterController
 * @description Контроллер для управления подписками на рассылку.
 */
const Newsletter = require('../models/Newsletter'); // Модель для работы с подписками на рассылку
const User = require('../models/User'); // Модель для работы с пользователями
const emailService = require('../services/emailService'); // Сервис для отправки email
const validator = require('validator'); // Библиотека для валидации данных, например email

/**
 * @class NewsletterController
 * @description Класс для управления подписками на рассылку.
 */
class NewsletterController {
    /**
     * Отписывает пользователя от рассылки.
     * @async
     * @function unsubscribe
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если email невалиден.
     * @throws Возвращает 404, если email не найден в базе подписчиков.
     * @throws Возвращает 500 в случае ошибки отписки.
     */
    static async unsubscribe(req, res) {
        try {
            const { email } = req.body; // Извлечение email из тела запроса

            // Проверка валидности email
            if (!validator.isEmail(email)) {
                return res.status(400).json({ error: 'Invalid email' }); // Ошибка: email невалиден
            }

            // Удаление подписчика из базы данных
            const result = await Newsletter.deleteOne({ email });

            // Проверка, был ли удален email
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Email not found in subscribers' }); // Ошибка: email не найден
            }

            res.json({ success: true }); // Успешный ответ
        } catch (error) {
            res.status(500).json({ error: error.message }); // Ошибка сервера
        }
    }

    /**
     * Получает список подписчиков.
     * @async
     * @function getSubscribers
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки получения подписчиков.
     */
    static async getSubscribers(req, res) {
        try {
            // Получение всех подписчиков из базы данных
            const subscribers = await Newsletter.find({});
            res.json(subscribers); // Отправка списка подписчиков в ответе
        } catch (error) {
            res.status(500).json({ error: error.message }); // Ошибка сервера
        }
    }

    /**
     * Подписывает пользователя на рассылку.
     * @async
     * @function subscribe
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 400, если email невалиден.
     * @throws Возвращает 400, если email уже подписан.
     * @throws Возвращает 500 в случае ошибки подписки.
     */
    static async subscribe(req, res) {
        try {
            const { email } = req.body; // Извлечение email из тела запроса

            // Проверка валидности email
            if (!validator.isEmail(email)) {
                return res.status(400).json({ error: 'Invalid email' }); // Ошибка: email невалиден
            }

            // Проверка, существует ли пользователь и подписчик
            const user = await User.findOne({ email });
            const existingSubscriber = await Newsletter.findOne({ email });

            if (existingSubscriber) {
                return res.status(400).json({ error: 'Email already subscribed' }); // Ошибка: email уже подписан
            }

            // Создание нового подписчика
            const subscriber = new Newsletter({
                email,
                user: user?._id
            });

            await subscriber.save(); // Сохранение подписчика в базе данных
            res.json({ success: true }); // Успешный ответ
        } catch (error) {
            res.status(500).json({ error: error.message }); // Ошибка сервера
        }
    }

    /**
     * Отправляет обновления подписчикам.
     * @async
     * @function sendUpdates
     * @param {Object} req - Объект запроса Express.
     * @param {Object} res - Объект ответа Express.
     * @throws Возвращает 500 в случае ошибки отправки обновлений.
     */
    static async sendUpdates(req, res) {
        try {
            const { content } = req.body; // Извлечение контента из тела запроса

            // Проверка доступности модели Newsletter
            if (!Newsletter) console.log('Newsletter model is not available');

            // Получение активных подписчиков с данными пользователя
            const subscribers = await Newsletter.find({ isActive: true })
                .populate({
                    path: 'user',
                    select: 'firstName' // Выбор только имени пользователя
                });

            // Отправка обновлений всем подписчикам
            await Promise.all(
                subscribers.map(sub =>
                    emailService.sendNewsletter(sub._id, content) // Использование emailService для отправки
                )
            );

            res.json({
                success: true,
                sentTo: subscribers.length // Количество подписчиков, которым отправлено
            });
        } catch (error) {
            res.status(500).json({ error: error.message }); // Ошибка сервера
        }
    }
}

module.exports = NewsletterController; // Экспорт класса для использования в других модулях
