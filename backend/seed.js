require('dotenv').config();
const { pool } = require('./src/config/db');

async function seed() {
    try {
        console.log('🌱 Iniciando seed de montadores...');

        // Testar conexão
        const test = await pool.query('SELECT NOW()');
        console.log('✅ Conexão com banco OK:', test.rows[0].now);

        // Deletar existentes para evitar duplicatas nos IDs ou nomes no protótipo
        await pool.query("DELETE FROM montadores WHERE nome LIKE '%Seed'");

        const query = `
      INSERT INTO montadores (nome, telefone, cpf, rating, status, cidade)
      VALUES 
      ('João da Silva Seed', '(11) 99999-0001', '12345678901', 4.8, 'online', 'São Paulo - SP'),
      ('Ricardo Santos Seed', '(11) 99999-0002', '12345678902', 4.9, 'ocupado', 'Campinas - SP'),
      ('Anderson Lima Seed', '(11) 99999-0003', '12345678903', 5.0, 'online', 'São Bernardo - SP')
      RETURNING id;
    `;

        const res = await pool.query(query);
        console.log(`✅ Seed concluído! ${res.rowCount} montadores inseridos.`);

    } catch (err) {
        console.error('❌ Erro no seed:', err);
    } finally {
        process.exit();
    }
}

seed();
