const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
const authRoutes = require('./routes/authRoutes');
const montadorRoutes = require('./routes/montadorRoutes');
const osRoutes = require('./routes/osRoutes');
const conviteRoutes = require('./routes/conviteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const execucaoRoutes = require('./routes/execucaoRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startCronJobs } = require('./jobs/cronManager');

const app = express();
app.set('trust proxy', 1);
startCronJobs();

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://*.googleapis.com", "https://*.gstatic.com", "https://api.dicebear.com", "https://*.unsplash.com", "https://images.unsplash.com", "https://*.openstreetmap.org"],
            fontSrc: ["'self'", "https://*.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.unsplash.com", "https://api.dicebear.com", "https://images.unsplash.com", "https://*.openstreetmap.org", "https://raw.githubusercontent.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://*.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || 'http://localhost:5173')
            .split(',')
            .map(o => o.trim())
            .filter(Boolean);
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS bloqueado'));
    },
    credentials: true
}));
app.use(morgan('dev'));
const bodyLimitMb = parseInt(process.env.MAX_BODY_MB || '25', 10);
const bodyLimit = `${Number.isFinite(bodyLimitMb) ? bodyLimitMb : 25}mb`;
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(cookieParser());

// Rate limit global da API (valores seguros e conservadores)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '300', 10),
    message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Sanitização simples de strings (body e query)
const shouldSkipSanitize = (key, value) => {
    if (typeof value !== 'string') return false;
    const lowerKey = (key || '').toLowerCase();
    if (value.startsWith('data:')) return true;
    if (lowerKey.includes('doc') || lowerKey.includes('foto') || lowerKey.includes('image') || lowerKey.includes('base64')) {
        return true;
    }
    return false;
};

const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((key) => {
        const value = obj[key];
        if (typeof value === 'string') {
            if (!shouldSkipSanitize(key, value)) {
                obj[key] = validator.escape(value.trim());
            }
        } else if (Array.isArray(value)) {
            obj[key] = value.map((v) => {
                if (typeof v === 'string' && !shouldSkipSanitize(key, v)) {
                    return validator.escape(v.trim());
                }
                return v;
            });
        } else if (typeof value === 'object') {
            sanitizeObject(value);
        }
    });
};

app.use((req, res, next) => {
    sanitizeObject(req.body);
    sanitizeObject(req.query);
    next();
});

// Rotas API v1
app.get('/health', (req, res) => res.json({ status: 'OK', version: '1.0.0', timestamp: new Date() }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/montadores', montadorRoutes);
app.use('/api/v1/os', osRoutes);
app.use('/api/v1/convites', conviteRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/execucao', execucaoRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Rotas Públicas (Convites de Balcão e Hooks externos)
const publicRoutes = require('./routes/publicRoutes');
app.use('/api/v1/public', publicRoutes);

// Servir fotos enviadas (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Servir arquivos estáticos do Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendPath)) {
    console.log(`✅ Frontend dist encontrado em: ${frontendPath}`);
    app.use(express.static(frontendPath));
} else {
    console.warn(`⚠️ Frontend dist NÃO ENCONTRADO em: ${frontendPath}`);
}

// Rota catch-all para SPA (React Router)
// Importante: deve vir DEPOIS das rotas de API
app.use((req, res, next) => {
    // Se a requisição começar com /api, não serve o index.html
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(503).json({
            error: 'Frontend não disponível',
            message: 'O frontend ainda não foi buildado ou o diretório dist está ausente.'
        });
    }
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Arquivos muito grandes. Envie fotos menores e tente novamente.' });
    }
    console.error('❌ Error:', err.message);
    
    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: err.flatten().fieldErrors });
    }

    // Prisma specific errors
    if (err.code === 'P2002') {
        const field = err.meta?.target?.[0] || 'campo';
        return res.status(400).json({ error: `Já existe um registro com este ${field}.` });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Registro não encontrado para atualização.' });
    }

    res.status(err.status || 500).json({ error: err.message || 'Algo deu errado no servidor!' });
});

module.exports = app;
