const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const ordenCount = await prisma.ordemServico.count();
    const renatoOrdens = await prisma.ordemServico.findMany({
        where: { montadorId: 1 }
    });
    console.log('Total Ordens:', ordenCount);
    console.log('Ordens de Renato (ID 1):', JSON.stringify(renatoOrdens, null, 2));
    process.exit(0);
}

check();
