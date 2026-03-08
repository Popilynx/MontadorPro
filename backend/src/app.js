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

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rotas
app.get('/health', (req, res) => res.json({ status: 'OK', version: '1.0.0', timestamp: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/montadores', montadorRoutes);
app.use('/api/os', osRoutes);
app.use('/api/convites', conviteRoutes);

// Servir arquivos estáticos do Frontend
const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

// Rota catch-all para SPA (React Router)
// Importante: deve vir DEPOIS das rotas de API
app.get('*', (req, res) => {
    // Se a requisição começar com /api, não serve o index.html (já deveria ter sido tratada acima)
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Tratamento de erros global
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Zod validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: err.flatten().fieldErrors });
    }
    res.status(err.status || 500).json({ error: err.message || 'Algo deu errado!' });
});

module.exports = app;
