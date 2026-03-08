const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_POOL_URL || process.env.DATABASE_URL,
});

if (!process.env.POSTGRES_POOL_URL && !process.env.DATABASE_URL) {
    console.error('CRITICAL ERROR: No database connection string found in environment variables (POSTGRES_POOL_URL or DATABASE_URL).');
}

// Helper para facilitar queries
const query = (text, params) => pool.query(text, params);

module.exports = {
    query,
    pool
};
