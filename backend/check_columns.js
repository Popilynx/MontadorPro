require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ 
    connectionString: process.env.POSTGRES_POOL_URL || process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        const tables = ['ordens_servico', 'montadores', 'convites'];
        for (const table of tables) {
            const res = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            console.log(`\nColumns in ${table}:`);
            res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
        }
    } catch (err) {
        console.error('Error checking schema:', err.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
