/**
 * @file app.js
 * @description Основной файл приложения, содержащий настройку middleware, маршрутов и обработчиков ошибок.
 */

require('dotenv').config(); // Загрузка переменных окружения из файла .env.

const express = require('express'); // Подключение Express для создания сервера.
const helmet = require('helmet'); // Подключение Helmet для обеспечения безопасности HTTP-заголовков.
const morgan = require('morgan'); // Подключение Morgan для логирования HTTP-запросов.
const cors = require('cors'); // Подключение CORS для управления политиками доступа.
const cookieParser = require('cookie-parser'); // Подключение для работы с cookie.
const rateLimit = require('express-rate-limit'); // Подключение для ограничения частоты запросов.
const path = require('path'); // Подключение модуля path для работы с файловыми путями.

// Подключение пользовательских middleware и маршрутов.
const errorHandler = require('./middleware/errorHandler'); // Обработчик ошибок.
const authRoutes = require('./routes/authRoutes'); // Маршруты для аутентификации.
const productRoutes = require('./routes/productRoutes'); // Маршруты для управления продуктами.
const cartRoutes = require('./routes/cartRoutes'); // Маршруты для управления корзиной.
const favoriteRoutes = require('./routes/favoriteRoutes'); // Маршруты для управления избранным.
const newsletterRoutes = require('./routes/newsletterRoutes'); // Маршруты для рассылок.
const settingsRoutes = require('./routes/settingsRoutes'); // Маршруты для настроек пользователя.
const discountRoutes = require('./routes/discountRoutes'); // Маршруты для управления скидками.
const languageMiddleware = require('./middleware/languageMiddleware'); // Middleware для обработки языка.
const themeMiddleware = require('./middleware/themeMiddleware'); // Middleware для обработки темы.

const app = express(); // Создание экземпляра приложения Express.

// Middleware для обеспечения безопасности HTTP-заголовков.
app.use(helmet());

// Middleware для настройки CORS.
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*', // Разрешённые источники.
    credentials: true // Разрешение передачи cookie.
}));

// Middleware для предоставления статических файлов из папки public.
app.use('/public', express.static(path.join(__dirname, 'public')));

// Middleware для парсинга JSON и URL-кодированных данных.
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Middleware для работы с cookie.
app.use(cookieParser());

// Подключение пользовательских middleware для обработки языка и темы.
app.use(languageMiddleware);
app.use(themeMiddleware);

// Логирование HTTP-запросов в режиме разработки.
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Ограничение частоты запросов.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: process.env.RATE_LIMIT_MAX || 100, // Максимальное количество запросов
    standardHeaders: true, // Отправка информации об ограничении в заголовках ответов
    legacyHeaders: false, // Отключение устаревших заголовков
    handler: (req, res) => {
        res.status(429).json({
            error: 'Слишком много запросов, пожалуйста, попробуйте снова позже'
        });
    }
});
app.use(limiter);

// Настройка маршрутов приложения.
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/discounts', discountRoutes);

// Маршрут для проверки работоспособности сервера.
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date(),
        environment: process.env.NODE_ENV,
        cookies: req.cookies
    });
});

// Обработка несуществующих маршрутов.
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Подключение обработчика ошибок.
app.use(errorHandler);

module.exports = app;