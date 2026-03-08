const { Client } = require('pg');
require('dotenv').config();
const bcrypt = require('bcrypt');

const connectionString = process.env.POSTGRES_DIRECT_URL;
const client = new Client({ connectionString });

async function seed() {
    try {
        console.log('Iniciando inclusao de dados de teste (Seed)...');
        await client.connect();

        const senhaHash = await bcrypt.hash('123456', 10);
        const agora = new Date();

        // 1. Inserir Cliente de Teste
        const clienteId = '754f762a-8d69-450f-963a-6944e05b583f';
        const queryCliente = 'INSERT INTO "clientes" (id, nome, telefone, cpf, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $5) ON CONFLICT (id) DO NOTHING';
        await client.query(queryCliente, [clienteId, 'N&L Móveis Planejados', '11999999999', '12345678900', agora]);

        // 2. Inserir Montador de Teste
        const montadorId = '9676eab8-3e42-4f6c-85a0-006ec7891234';
        const queryMontador = 'INSERT INTO "montadores" (id, nome, telefone, cpf, "senhaHash", status, "notaMedia", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) ON CONFLICT (id) DO NOTHING';
        await client.query(queryMontador, [montadorId, 'Montador de Teste', '11888888888', '98765432100', senhaHash, 'DISPONIVEL', 5.0, agora]);

        console.log('DADOS DE TESTE INSERIDOS COM SUCESSO!');
        await client.end();
    } catch (err) {
        console.error('ERRO NO SEED:', err.message);
        process.exit(1);
    }
}

seed();
