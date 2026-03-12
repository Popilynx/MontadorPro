const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/authRoutes');
const montadorRoutes = require('./routes/montadorRoutes');
const osRoutes = require('./routes/osRoutes');
const conviteRoutes = require('./routes/conviteRoutes');
const adminRoutes = require('./routes/adminRoutes');
const execucaoRoutes = require('./routes/execucaoRoutes');
const notificationRoutes = require('./routes/notificationRoutes');


const app = express();

// Middlewares de segurança
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            connectSrc: ["'self'", "https://*.googleapis.com", "https://*.gstatic.com", "https://api.dicebear.com"],
            fontSrc: ["'self'", "https://*.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "blob:", "https://*.unsplash.com", "https://api.dicebear.com", "https://images.unsplash.com", "https://*.tile.openstreetmap.org", "https://raw.githubusercontent.com", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://*.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:"],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rotas API v1
app.get('/health', (req, res) => res.json({ status: 'OK', version: '1.0.0', timestamp: new Date() }));
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/montadores', montadorRoutes);
app.use('/api/v1/os', osRoutes);
app.use('/api/v1/convites', conviteRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/execucao', execucaoRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Servir fotos enviadas (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// Servir arquivos estáticos do Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Rota catch-all para SPA (React Router)
// Importante: deve vir DEPOIS das rotas de API
app.use((req, res, next) => {
    // Se a requisição começar com /api, não serve o index.html (já deveria ter sido tratada e retornado 404)
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Tratamento de erros global
app.use((err, req, res, next) => {
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
