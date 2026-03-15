const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.montador.findFirst({
    where: { nome: { contains: 'Renato' } }
  });

  if (m) {
    await prisma.montador.update({
      where: { id: m.id },
      data: {
        lat: -27.5969,
        lng: -48.5495,
        status: 'disponivel'
      }
    });
    console.log('--- SUCESSO ---');
    console.log('Localização injetada para:', m.nome);
    console.log('Coordenadas: -27.5969, -48.5495');
    console.log('Status: disponivel');
  } else {
    console.log('Montador não encontrado');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
