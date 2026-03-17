require('dotenv').config();
const app = require('./app');

// Tratamento de exceções globais para evitar crash silencioso no Railway
process.on('uncaughtException', (err) => {
    console.error('❌ FATAL: Uncaught Exception:', err.message);
    console.error(err.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

const PORT = process.env.PORT || 8080;

// Escutar em 0.0.0.0 é crucial para Railway/Docker
app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🏠 Host: 0.0.0.0`);
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`📡 API URL: http://0.0.0.0:${PORT}/api`);
    console.log('=========================================');
});
