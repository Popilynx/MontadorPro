const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const os = await prisma.ordemServico.findFirst({
    where: { numero: { contains: '00001' } },
    include: { convites: true }
  });
  
  const m = await prisma.montador.findFirst({
    where: { nome: { contains: 'Renato' } }
  });

  console.log('--- DEBUG INFO ---');
  console.log('OS 0001:', JSON.stringify(os, null, 2));
  console.log('Montador:', JSON.stringify(m, null, 2));
  
  if (os && m) {
      console.log('--- DISTANCE TEST ---');
      const { calcularDistancia } = require('./src/utils/geoUtils');
      const dist = calcularDistancia(os.lat, os.lng, m.lat, m.lng);
      console.log(`Distancia entre OS e Montador: ${dist.toFixed(2)} km`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
