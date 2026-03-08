# Montador Pro — Plataforma de Gestão

O Montador Pro é um SaaS completo para gerenciamento de Ordens de Serviço (OS) e Montadores de móveis, com sistema de convites em tempo real, dashboard de ganhos e arquitetura PWA (Progressive Web App).

## 🚀 Como Rodar o Projeto Localmente

O projeto é dividido em duas partes principais: **Backend** (Node.js/Express) e **Frontend** (React/Vite). As duas devem rodar em terminais separados durante o desenvolvimento.

### 1. Configurando o Banco de Dados (Supabase/PostgreSQL)

O sistema utiliza PostgreSQL. Recomendamos criar um projeto gratuito no [Supabase](https://supabase.com/).

1. Obtenha a URL de conexão (Connection String) do seu banco Supabase.
2. Na pasta `/backend`, copie o arquivo `.env.example` para `.env` (ou crie um se não existir):
   - `POSTGRES_POOL_URL="sua-url-aqui?pgbouncer=true"`
   - `JWT_SECRET="alguma-chave-secreta"`
   - `CORS_ORIGIN="http://localhost:5173"`
3. Execute as migrações e popule o banco rodando:
   ```bash
   cd backend
   node migrate.js
   node seed.js
   ```

### 2. Rodando o Backend (API)

Abra um terminal e execute:

```bash
cd backend
npm install
npm run dev
```

*O backend iniciará na porta `3000` (`http://localhost:3000`).*

### 3. Rodando o Frontend (Painel Web e PWA)

Abra um segundo terminal e execute:

```bash
cd frontend
npm install
npm run dev
```

*O frontend iniciará na porta `5173`. Acesse `http://localhost:5173` no seu navegador.*

---

## 🔐 Acessos de Teste (Mock)

Ao rodar o `seed.js`, os seguintes usuários são criados para teste. A senha padrão para todos é `senha123`:

- **Administrador:** Não há painel admin construído neste escopo, a gestão de OS é via banco original, mas o acesso para visualização de OS é global.
- **Montador 1:** CPF: `111.111.111-11`, Senha: `senha123`
- **Montador 2:** CPF: `222.222.222-22`, Senha: `senha123`

---

## 🧪 Rodando os Testes Unitários

O backend conta com uma suíte de testes unitários para validar todos os endpoints vitais (Auth, OS, Convites e Histórico).

Para rodar os testes, vá no terminal do backend:

```bash
cd backend
npm test
```

Os testes utilizam `Jest` e `Supertest`, simulando o banco de dados (mock) para garantir execução rápida e segura sem sujar dados de produção.

---

## 📦 Deploy para Produção

O projeto está configurado para deploy imediato no **Railway** como um monolito, ou separando Front/Back na **Vercel/Railway**. Leia o arquivo `DEPLOY.md` para instruções detalhadas sobre variáveis de ambiente e comandos de build final.