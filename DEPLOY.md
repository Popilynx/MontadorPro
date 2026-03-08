# MontadorPro — Arquivo de Deploy Railway

## Variáveis de Ambiente Necessárias no Railway

Configure as seguintes variáveis no painel do Railway para o serviço backend:

```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://seu-frontend.up.railway.app

POSTGRES_POOL_URL=postgresql://postgres.tzeptxmiiunpqcyxmbgt:SAMEDAY%201215@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
POSTGRES_DIRECT_URL=postgresql://postgres.tzeptxmiiunpqcyxmbgt:SAMEDAY%201215@aws-1-us-east-2.pooler.supabase.com:5432/postgres

JWT_SECRET=montador_pro_jwt_secret_super_seguro_2024
JWT_REFRESH_SECRET=montador_pro_refresh_secret_super_seguro_2024
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_MAILTO=mailto:admin@montadorpro.com
```

## Deploy do Frontend

O frontend deve ser buildado e servido estaticamente. Opções:
1. **Vercel**: conecte o diretório `frontend/` e defina `VITE_API_URL=https://seu-backend.up.railway.app/api`
2. **Railway (Monolito)**: configure o backend para servir o build do frontend em produção

## Deploy em Monolito (backend serve o frontend buildado)

Para que o backend sirva os arquivos do frontend:

1. No `backend/src/server.js` ou `app.js`, adicione:
```js
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist', 'index.html'));
  });
}
```

2. No `railway.json`, altere o `startCommand` para primeiro buildar o frontend:
```json
"startCommand": "cd ../frontend && npm install && npm run build && cd ../backend && node src/server.js"
```
