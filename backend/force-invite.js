const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const os = await prisma.ordemServico.findFirst({
    where: { numero: { contains: '00001' } }
  });
  
  const m = await prisma.montador.findFirst({
    where: { nome: { contains: 'Renato' } }
  });

  if (os && m) {
    // 1. Forçar coordenadas da OS para perto do montador (aprox 2km)
    // Coordenadas do montador injetadas anteriormente: -27.5969, -48.5495
    const forcedLat = -27.6000; 
    const forcedLng = -48.5500;

    await prisma.ordemServico.update({
      where: { id: os.id },
      data: {
        lat: forcedLat,
        lng: forcedLng
      }
    });

    // 2. Criar o convite manualmente para garantir visibilidade
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const convite = await prisma.convite.create({
      data: {
        ordemId: os.id,
        montadorId: m.id,
        expiresAt: expiresAt,
        status: 'enviado'
      }
    });

    console.log('--- SUCESSO ---');
    console.log(`OS #${os.numero} atualizada para Florianópolis.`);
    console.log(`Convite ID ${convite.id} criado para ${m.nome}.`);
    console.log(`Expira em: ${expiresAt.toLocaleString()}`);
  } else {
    console.log('OS ou Montador não encontrados');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
