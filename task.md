# Tasks do Projeto: Montador Pro

Este documento gerencia o escopo contidos tarefas e etapas de desenvolvimento do aplicativo Montador Pro. Ele aborda de forma cirúrgica e rigorosamente fragmentada todo o esquema de trabalho dividido por **Módulos**, indo da Infraestrutura aos Testes E2E (End-to-End).

---

## Módulo 1: Esqueleto e Infraestrutura
Nesta fase ativamos e estruturamos as bases físicas, contêineres e variáveis.

- [x] **TSK-1.1:** Inicializar e conferir estrutura de pastas do Repositório (`frontend`, `backend`, `prisma`).
- [x] **TSK-1.2:** Estruturar o projeto para Deploy SaaS no **Railway** (script `start`, variáveis de ambiente). O próprio servidor Node servirá de "Monolito" encaminhando estáticos do frontend.
- [x] **TSK-1.3:** Configurar as variáveis de ambiente base para autenticação (JWT) e conectar a Connection String do **Supabase** (PostgreSQL gerencial) no arquivo `.env`.
- [x] **TSK-1.4:** Gerar as chaves VAPID (`VAPID_PUBLIC_KEY` e `PRIVATE_KEY`) e configurar as env-variables essenciais para envios de Notificações Push via *web-push*.
- [x] **TSK-1.5:** Criar os Buckets no **Supabase Storage** para armazenar de modo definitivo e escalável as fotos efetuadas pelo montador, abandonando a dependência do node `multer` local.

---

## Módulo 2: Core do Backend & Autenticação [CONCLUÍDO]
- [x] TSK-2.1: Estruturar servidor Express e middlewares básicos (Helmet, CORS, Morgan).
- [x] TSK-2.2: Implementar Autenticação Nativa (pg.Pool) e Login.
- [x] TSK-2.3: Implementar Refresh Token e Logout via Cookies.
- [x] TSK-2.4: Criar Middleware de Autenticação JWT para Proteção de Rotas.
---

## Módulo Extra: Refatoração Cinematográfica (Design System 1:1) [CONCLUÍDO]
- [x] TSK-E.1: Coletar parâmetros do Design System (Marca, Estética, Features).
- [x] TSK-E.2: Estruturar a nova arquitetura do App.jsx (GSAP + Tailwind + Noise).
- [x] TSK-E.3: Desenvolver a Landing Page Cinematográfica (Hero, Shuffler, Manifesto, Stacking).
- [x] TSK-E.4: Refatorar Telas Internas (Login, Dashboard, Listagens, Ordens) para a nova tipografia e paleta.

---
## Módulo 3: Funcionalidades Avançadas & UX [ESTIMATIVA: 2 DIAS]
- [x] TSK-3.1: Dashboard com mapa de montadores em tempo real.
- [x] TSK-3.2: Implementar Sistema de Convite do Montador:
  - Projetar um Timer SVG *Animated Count-Down Arc* para a contagem de aceitação.
  - Grid modular limpa para o upload e preview visual massivo interativo de Fotos.
- [x] Criar Modais de Gestão (Nova Ordem e Detalhes)
- [x] Integrar Modais na página de Ordens de Serviço
- [x] Validar interatividade e design Midnight Luxe via Browser.
- [x] TSK-3.3: Histórico de Ganhos e Performance (Gráficos Midnight Luxe).
- [x] TSK-3.4: Validação e Revisão da Responsividade em *Mobile First*.

---

## Módulo 4: Refatoração, Lógica e Análise Completa [CONCLUÍDO]
Manutenções preventivas, desacoplamento seguro de scripts limpos e blindagens de segurança do Back/Front.

- [x] **TSK-4.1:** Consolidar lógica nativa Front-end JS do arquivo `index.html`. Refatorar *fetch requests* para tratarem os Token-Rotations unificados (status 401 revalida e refaz automático).
- [x] **TSK-4.2:** Re-aprimorar Service Worker (`sw.js`) garantindo Cache network-first para requisições, armazenamento de imagens locais e Interceptação em Background sólida para EventListener `push` no dispositivo móvel.
- [x] **TSK-4.3:** Fechar Blindagens de segurança nativa/API: Implementar globalmente *Helmet.js* para proteção de Headers de Browser. Inserir proteção extensiva global garantindo Inputs Seguros testados pelo Parser Zod (Types/Schema Validations da API express).
- [x] **TSK-4.4:** Inserir Logging detalhado (`Winston` logger) focado nas integrações da "Transação Crítica (Aceitar Convite)", garantido depurabilidade eficiente de arquivos para a produção, salvando num log volumo.

---

## Módulo 5: Testes Integrados (QA & Funcionais) [CONCLUÍDO]
Garantir o fluxo e o comportamento de carga por todo o ciclo de vida do Front (Mobile) e do Backend (DB).

- [x] **TSK-5.1:** Validar Setup Mock: Ligar Front-end em *"Modo Demo"* isolado, bypassando requisições REST pela simulação nativa visual confirmando usabilidade de transição de telas sem banco.
- [x] **TSK-5.2:** Testes de Sanidade Back-end API: Validar endpoints chaves (/Admin -> OS, Convites, Histórico) com envio JSON puramente por CLI cURL e retornos puros 200 OK e falhas intencionais (4xx/5xx).
- [x] **TSK-5.3:** E2E PWA Test (End-to-End Caminho Feliz Completo): Logar Demo123 -> Dashboard Carrega GPS Base -> Recebe Push -> PWA Abre o Convite Ativo Pop-Up -> Cliques de Aceite Timer Valendo -> Botao Finaliza OS Envia Foto via formData -> Receber Nota Admin -> Atualizado Perfil Ganhos.
- [x] **TSK-5.4:** Teste Offline (Resiliência do Service Worker): Desativar a rede através do Application Tab > Offline, abrir PWA e comprovar recarga a partir do cache HTML5 sem white screens e o armazenamento em espera de payloads visando *graceful degradation*.
- [x] **TSK-5.5:** Teste de Push Completo do Backend até o PWA final simulando Payload de servidor fora do PWA Context de UI local.

---

## Módulo 6: Identidade Visual & Perfil do Usuário [CONCLUÍDO]
- [x] **TSK-6.1:** Criar e configurar Favicon Premium corporativo.
- [x] **TSK-6.2:** Depurar e corrigir visualização de montadores no mapa (coordenadas reais).
- [x] **TSK-6.3:** Implementar Página de Perfil (`Profile.jsx`) com:
  - [x] Upload de foto funcional (Correção de conflito de rotas e tipo de ID).
  - [x] **Verification**
    - [x] Test profile update without wiping other fields
    - [x] Verify photo persistence
    - [x] Verify metrics display real data

- [x] **Assembler Team Sync & Dossier**
    - [x] Update backend `GET /api/montadores` to include `foto_url` and `os_ativas`
    - [x] Update backend `GET /api/montadores/:id` to include performance metrics
    - [x] Add `/montadores/:id` route in `App.jsx`
    - [x] Adapt `Profile.jsx` to view other assemblers via ID
    - [x] Update `MontadoresList.jsx` to use real data and navigate to Dossier
  - [x] Alteração de dados cadastrais.
  - [x] Registros individuais de montagens reais.
- [x] **TSK-6.4:** Adicionar Widget de Usuário (Foto, Nome, Role) no Layout com link para Perfil.

---

## Módulo 7: Configurações Especializadas & Preferências [CONCLUÍDO]
- [x] **TSK-7.1:** Desenvolver a interface `Settings.jsx` com estética Midnight Luxe.
- [x] **TSK-7.2:** Implementar controles de Notificações Push (Web-Push Integration).
- [x] **TSK-7.3:** Adicionar seções de Segurança (Troca de Senha) e Informações do App.
- [x] **TSK-7.4:** Integrar ações globais (Logout, Limpeza de Cache local).
- [x] **TSK-7.5:** Validar persistência de preferências do usuário no localStorage/DB.
- [x] **TSK-7.6:** Ajustar contraste e legibilidade global (Modo Dark e Inputs).
