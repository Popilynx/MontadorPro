const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Shutdown graceful — libera conexões ao encerrar
process.on('SIGTERM', async () => {
  console.log('🔌 SIGTERM recebido, desconectando Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔌 SIGINT recebido, desconectando Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;
