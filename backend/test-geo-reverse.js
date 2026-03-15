const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function main() {
  const m = await prisma.montador.findFirst({
    where: { nome: { contains: 'Renato' } }
  });

  if (m) {
    const lat = -27.5969;
    const lng = -48.5495;
    
    let cidade = null;
    let estado = null;

    console.log(`Testando Geocoding para: ${lat}, ${lng}...`);
    
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'MontadorPro/1.0' }
        });

        if (response.data && response.data.address) {
            const addr = response.data.address;
            cidade = addr.city || addr.town || addr.village || addr.municipality || addr.suburb || addr.city_district;
            estado = addr.state;
            console.log('Resultado do Geocoding:', { cidade, estado });
        }
    } catch (geoErr) {
        console.error('Erro no geocoding reverso:', geoErr.message);
    }

    if (cidade && estado) {
        await prisma.montador.update({
            where: { id: m.id },
            data: {
                lat,
                lng,
                cidade,
                estado
            }
        });
        console.log('--- SUCESSO ---');
        console.log(`Montador ${m.nome} atualizado com ${cidade}, ${estado}`);
    } else {
        console.log('Falha ao obter cidade/estado');
    }
  } else {
    console.log('Montador não encontrado');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
