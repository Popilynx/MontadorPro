require('dotenv').config();
const app = require('./app');

// Tratamento de exceções globais para evitar crash silencioso no Railway
process.on('uncaughtException', (err) => {
    console.error('❌ FATAL: Uncaught Exception:', err.message);
    console.error(err.stack);
    // Dar tempo para os logs serem enviados antes de encerrar
    setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ FATAL: Unhandled Rejection:', reason);
    // Não encerra o processo para rejeições — apenas loga
});

const PORT = parseInt(process.env.PORT, 10) || 8080;

console.log(`⏳ Iniciando servidor na porta ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('=========================================');
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🏠 Host: 0.0.0.0`);
    console.log(`🌍 NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`💾 Memória: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB RSS`);
    console.log('=========================================');
});

// Timeout generoso para conexões longas (uploads de fotos, etc.)
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Shutdown graceful — Railway envia SIGTERM antes de matar o container
const gracefulShutdown = (signal) => {
    console.log(`🔌 ${signal} recebido. Encerrando servidor gracefully...`);
    server.close(() => {
        console.log('✅ Servidor encerrado.');
        process.exit(0);
    });
    // Forçar encerramento após 10s se não fechar a tempo
    setTimeout(() => {
        console.error('⚠️ Forçando encerramento após timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

