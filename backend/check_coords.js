const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const montadores = await prisma.montador.findMany({
        select: {
            id: true,
            nome: true,
            lat: true,
            lng: true,
            status: true
        }
    });
    console.log(JSON.stringify(montadores, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
