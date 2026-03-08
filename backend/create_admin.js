require('dotenv').config();
const { Pool } = require('pg');
const { hashPassword } = require('./src/utils/auth');

// Database connection
const pool = new Pool({
    connectionString: process.env.POSTGRES_DIRECT_URL,
    ssl: { rejectUnauthorized: false }
});

const criarAdmin = async () => {
    try {
        console.log("Conectando ao banco de dados...");
        const client = await pool.connect();
        
        const telefone = '48984544096';
        const rawPassword = 'admin1234';
        
        console.log("\nGerando hash da senha...");
        const hashedPassword = await hashPassword(rawPassword);
        
        console.log(`Verificando se o usuário ${telefone} já existe...`);
        const checkUser = await client.query('SELECT * FROM montadores WHERE telefone = $1', [telefone]);
        
        if (checkUser.rows.length > 0) {
            console.log("\nUsuário já existe! Atualizando a senha...");
            await client.query(
                'UPDATE montadores SET password = $1 WHERE id = $2',
                [hashedPassword, checkUser.rows[0].id]
            );
            console.log("✅ Senha atualizada com sucesso.");
        } else {
            console.log("\nCriando novo usuário administrador...");
            const newUser = await client.query(`
                INSERT INTO montadores (nome, telefone, password, status) 
                VALUES ($1, $2, $3, $4) 
                RETURNING id, nome, telefone
            `, ['Renato Rocha Jr', telefone, hashedPassword, 'ATIVO']);
            
            console.log(`✅ Administrativo criado com sucesso! ID: ${newUser.rows[0].id}`);
        }
        
        client.release();
    } catch (err) {
        console.error("❌ Erro ao criar/atualizar usuário:", err);
    } finally {
        pool.end();
        process.exit();
    }
};

criarAdmin();
