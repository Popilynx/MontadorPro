const axios = require('axios');

async function checkApi() {
    try {
        const response = await axios.get('http://localhost:3000/api/v1/admin/montadores', {
            headers: {
                'x-admin-secret': 'sua-chave-secreta-aqui' // I need to know the actual secret from .env
            }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Erro na API:', err.message);
    }
}

// I'll read .env first to get the secret
const fs = require('fs');
const path = require('path');
const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const secretMatch = env.match(/ADMIN_SECRET="?([^"\s]+)"?/);
const secret = secretMatch ? secretMatch[1] : '';

async function run() {
    try {
        const response = await axios.get('http://localhost:3000/api/v1/admin/montadores', {
            headers: {
                'x-admin-secret': secret
            }
        });
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Erro na API:', err.response ? err.response.data : err.message);
    }
}

run();
