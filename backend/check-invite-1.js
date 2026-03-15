const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.convite.findFirst({
    where: { id: 1 },
    include: { montador: true, ordem: true }
  });
  
  if (c) {
    console.log('--- INVITE CHECK ---');
    console.log('ID:', c.id);
    console.log('Status:', c.status);
    console.log('Montador:', c.montador.nome);
    console.log('Expira em:', c.expiresAt.toLocaleString());
    console.log('Agora:', new Date().toLocaleString());
    console.log('Expirou?', c.expiresAt < new Date());
  } else {
    console.log('Convite ID 1 não encontrado.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
