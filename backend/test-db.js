const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ordens = await prisma.ordemServico.findMany({
    include: {
      convites: true,
      cliente: true
    }
  });
  console.log('--- ORDENS ---');
  console.log(JSON.stringify(ordens, null, 2));

  const montadores = await prisma.montador.findMany();
  console.log('--- MONTADORES ---');
  console.log(JSON.stringify(montadores, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
