# NF Móveis — Montador Pro v1.0 🏠✨

Plataforma digital completa para gestão de serviços de montagem e instalação de móveis planejados. Este sistema automatiza todo o ciclo de vida das ordens de serviço (OS), desde a criação no escritório até a execução e avaliação em campo.

---

## 🏗️ Estrutura do Ecossistema

- **🌐 Landing Page (NF Móveis)**: Site institucional para clientes finais, otimizado para SEO com animações premium (GSAP).
- **📱 App do Montador (PWA)**: Aplicativo instalável para profissionais em campo com tracking GPS e fluxo de execução.
- **🔧 Painel Administrativo**: Pronta-o-usuário (Admin) para o escritório gerir OS, montadores e faturamento histórico.
- **⚙️ API Backend**: Servidor robusto em Node.js com Prisma ORM e PostgreSQL, centralizando toda a lógica e notificações.

---

## 🌟 Funcionalidades Principais

### 1. Para o Administrador (Escritório)
- **Dashboard em Tempo Real**: Mapa interativo (Leaflet) com localização dos montadores (polling de 30s).
- **Gestão de OS**:
  - Criação de OS com geocodificação automática (OpenStreetMap).
  - **Despacho Automático**: Cálculo de distância (Haversine) e envio de convites para os 3 montadores mais próximos.
- **Controle de Equipe**: Aprovação de novos cadastros, desativação de profissionais e visualização de "Dossier".
- **Histórico Financeiro Global**: Gráficos e tabelas de faturamento mensal e anual agrupado.
- **Avaliação de Qualidade**: Sistema de nota (1-5 estrelas) que recalcula a média do montador automaticamente.
- **Push Broadcast**: Envio de notificações para toda a base de montadores ativos.

### 2. Para o Montador (Campo)
- **Instalação PWA**: Funciona como um app nativo no celular, sem necessidade de loja de aplicativos.
- **Sistema de Convites**:
  - Recebimento de convites via Push e **WhatsApp**.
  - Timer de 20 minutos para aceite/recusa.
- **Fluxo de Execução**:
  - **Check-in Inteligente**: Confirmação de chegada validada via GPS (raio 200m) e Janela de Tempo (±15 min do agendado).
  - **Relatório Fotográfico**: Upload obrigatório de no mínimo 4 fotos das etapas do serviço.
  - **Check-out**: Finalização do serviço com registro de horário e liberação para pagamento.
- **Perfil & Ganhos**: Gestão de dados pessoais, chave PIX e dashboard de faturamento pessoal.

---

## 🛠️ Stack Tecnológica

- **Frontend**: React.js, Vite, TailwindCSS (ou Vanilla CSS), GSAP, Lucide React, Leaflet (Mapas).
- **Backend**: Node.js, Express.js.
- **Banco de Dados**: PostgreSQL com **Prisma ORM**.
- **Comunicação**:
  - Notificações Push: VAPID / Web-Push.
  - E-mails: **Resend**.
  - SMS/WhatsApp: Links formatados `wa.me`.
- **Infraestrutura**: Railway (Deploy), GitHub (CI/CD).

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- Banco de Dados PostgreSQL (Recomendado: Supabase)

### 1. Configurando o Backend
1. Entre na pasta `/backend`: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o arquivo `.env`:
   ```env
   DATABASE_URL="sua-url-prisma-postgresql"
   JWT_SECRET="chave-secreta"
   ADMIN_SECRET="secret-para-header-admin"
   RESEND_API_KEY="re_..."
   VAPID_PUBLIC_KEY="..."
   VAPID_PRIVATE_KEY="..."
   APP_URL="http://localhost:5173"
   ```
4. Sincronize o banco de dados: `npx prisma db push`
5. Rode o servidor: `npm run dev`

### 2. Configurando o Frontend
1. Entre na pasta `/frontend`: `cd frontend`
2. Instale as dependências: `npm install`
3. Rode o aplicativo: `npm run dev`
4. Acesse em: `http://localhost:5173`
---

© 2026 **NF Móveis Planejados** • Desenvolvido com Antigravity Intelligence.