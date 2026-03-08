const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.POSTGRES_POOL_URL,
});

// Helper para facilitar queries
const query = (text, params) => pool.query(text, params);

module.exports = {
    query,
    pool
};
