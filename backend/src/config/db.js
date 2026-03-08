const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_POOL_URL || process.env.DATABASE_URL,
    ssl: (process.env.POSTGRES_POOL_URL || process.env.DATABASE_URL)?.includes('supabase.co') 
        ? { rejectUnauthorized: false } 
        : false
});

if (!process.env.POSTGRES_POOL_URL && !process.env.DATABASE_URL) {
    console.error('CRITICAL ERROR: No database connection string found in environment variables (POSTGRES_POOL_URL or DATABASE_URL).');
}

// Log para debug de conexão (apenas em produção se houver erro)
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Helper para facilitar queries
const query = (text, params) => pool.query(text, params);

module.exports = {
    query,
    pool
};
