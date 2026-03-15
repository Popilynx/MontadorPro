const prisma = require('../config/db');

// Roda a cada 1 minuto (60000 ms)
const startCronJobs = () => {
    setInterval(async () => {
        try {
            // 1. Limpar convites pendentes/enviados ha mais de 20 minutos
            const vinteMinutosAtras = new Date(Date.now() - 20 * 60 * 1000);

            const convitesExpirados = await prisma.convite.updateMany({
                where: {
                    status: { in: ['pendente', 'enviado'] },
                    createdAt: {
                        lt: vinteMinutosAtras
                    }
                },
                data: {
                    status: 'expirado'
                }
            });

            if (convitesExpirados.count > 0) {
                console.log(`[CRON] ${convitesExpirados.count} convites expirados limpos.`);
            }

            // 2. Limpar OS pendentes antigas (se ninguem aceitou dentro do tempo)
            const osAntigas = await prisma.ordemServico.deleteMany({
                where: {
                    status: 'pendente',
                    createdAt: {
                        lt: vinteMinutosAtras
                    }
                }
            });

            if (osAntigas.count > 0) {
                console.log(`[CRON] ${osAntigas.count} OS pendentes antigas removidas.`);
            }
        } catch (error) {
            console.error('[CRON Error] Erro ao rodar jobs em background:', error);
        }
    }, 60000);

    console.log('[CRON] Jobs em background iniciados (verificacao a cada 1 minuto).');
};

module.exports = { startCronJobs };
