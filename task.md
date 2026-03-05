# Tasks do Projeto: Montador Pro

Este documento gerencia o escopo contidos tarefas e etapas de desenvolvimento do aplicativo Montador Pro. Ele aborda de forma cirúrgica e rigorosamente fragmentada todo o esquema de trabalho dividido por **Módulos**, indo da Infraestrutura aos Testes E2E (End-to-End).

---

## Módulo 1: Esqueleto e Infraestrutura
Nesta fase ativamos e estruturamos as bases físicas, contêineres e variáveis.

- [ ] **TSK-1.1:** Inicializar e conferir estrutura de pastas do Repositório (`frontend`, `backend`, `prisma`).
- [ ] **TSK-1.2:** Estruturar o projeto para Deploy SaaS no **Railway** (script `start`, variáveis de ambiente). O próprio servidor Node servirá de "Monolito" encaminhando estáticos do frontend.
- [ ] **TSK-1.3:** Configurar as variáveis de ambiente base para autenticação (JWT) e conectar a Connection String do **Supabase** (PostgreSQL gerencial) no arquivo `.env`.
- [ ] **TSK-1.4:** Gerar as chaves VAPID (`VAPID_PUBLIC_KEY` e `PRIVATE_KEY`) e configurar as env-variables essenciais para envios de Notificações Push via *web-push*.
- [ ] **TSK-1.5:** Criar os Buckets no **Supabase Storage** para armazenar de modo definitivo e escalável as fotos efetuadas pelo montador, abandonando a dependência do node `multer` local.

---

## Módulo 2: Funcionalidades e Backend (Node + Prisma)
O núcleo sistêmico da aplicação, transacionando entre o app e DB.

- [ ] **TSK-2.1:** Configurar Schema do Prisma (`schema.prisma`), incluindo Entidades completas (Montador, Cliente, OS, Execução, Avaliação) construindo suas relações e rodar as Migrations.
- [ ] **TSK-2.2:** Desenvolver e rodar rotina Seed (`seed.js`) gerando um pool mockado inicial de montadores, clientes de teste e tokens admin.
- [ ] **TSK-2.3:** Implementar / Validar a API de Auth: Login *Timing-safe* rotativo (access-token > refresh-token) + injeção bcrypt para hash de senhas de novo usuário.
- [ ] **TSK-2.4:** Implementar / Validar a API de Convites: Polling/Notificação de convite pendente, aceite 100% *Transacional Automático via Prisma* (múltiplas chaves atualizam), e sistema de recusa/expiração.
- [ ] **TSK-2.5:** Implementar / Validar a API de Execução e Fotos: Atualização e recebimento de geolocalização (*high-accuracy*) durante check-in, refatorar o upload para stream/pipe direto pro **Supabase Storage** via cliente nativo.
- [ ] **TSK-2.6:** Integrar lib de web-push e testar Handshake/Registration das chaves VAPID fornecidas pelo front PWA até o banco de subscriptions e triggers de push a cada ação gerencial.
- [ ] **TSK-2.7:** Construção da API Restritiva Admin (`/api/v1/admin`) protegida por `X-Admin-Token` fixo, visando listagem e interações em OS e métricas.

---

## Módulo 3: Visual e Estética (Premium UI/UX Frontend)
Refatoração HTML/CSS orientada para que o software obtenha o patamar estético Visual Premium/Estonteante, moderno e vivo, priorizando animações e feedback visual.

- [ ] **TSK-3.1:** Analisar todo o DOM Tree atual (`index.html`); planejar hierarquia de *sections* (Pages em SPA PWA Vanilla).
- [ ] **TSK-3.2:** Re-construir a folha de estilos (*Vanilla CSS*) implementando um **Design System Premium**, sem bibliotecas pesadas de fora:
  - Adição e calibração de paleta moderna usando CSS Custom properties de Dark-Theme agradável.
  - Tipografia moderna via Google Fonts (recomendado: *Inter*, *Outfit* ou *Plus Jakarta Sans*).
  - Micro-interações, hover-states nativos e feedbacks responsivos dinâmicos.
  - Implementações sutis de *Glassmorphism* (efeitos de desfoque de fundo) para headers e tooltips.
- [ ] **TSK-3.3:** Refazer Tela de Login: Implementação estonteante utilizando orbs interativos ou blobs visuais no fundo.
- [ ] **TSK-3.4:** Refazer Dashboard & Painel: Modelar cartões e listas (*cards de estatísticas e OS*) focando numa hierarquia de informação clean usando proporções áureas de padding (`clamp()` e media-queries), exibindo lucros, reviews.
- [ ] **TSK-3.5:** Refazer Funcionalidade Foco (O Convite do Montador): Projetar um Timer SVG *Animated Count-Down Arc* para a contagem de aceitação e uma grid modular limpa para o upload e preview visual massivo interativo de Fotos.
- [ ] **TSK-3.6:** Validação e Revisão da Responsividade em *Mobile First*, garantindo que *touch targets* atendam diretrizes (min 48px de área interagível por dedo).

---

## Módulo 4: Refatoração, Lógica e Análise Completa
Manutenções preventivas, desacoplamento seguro de scripts limpos e blindagens de segurança do Back/Front.

- [ ] **TSK-4.1:** Consolidar lógica nativa Front-end JS do arquivo `index.html`. Refatorar *fetch requests* para tratarem os Token-Rotations unificados (status 401 revalida e refaz automático).
- [ ] **TSK-4.2:** Re-aprimorar Service Worker (`sw.js`) garantindo Cache network-first para requisições, armazenamento de imagens locais e Interceptação em Background sólida para EventListener `push` no dispositivo móvel.
- [ ] **TSK-4.3:** Fechar Blindagens de segurança nativa/API: Implementar globalmente *Helmet.js* para proteção de Headers de Browser. Inserir proteção extensiva global garantindo Inputs Seguros testados pelo Parser Zod (Types/Schema Validations da API express).
- [ ] **TSK-4.4:** Inserir Logging detalhado (`Winston` logger) focado nas integrações da "Transação Crítica (Aceitar Convite)", garantido depurabilidade eficiente de arquivos para a produção, salvando num log volumo.

---

## Módulo 5: Testes Integrados (QA & Funcionais)
Garantir o fluxo e o comportamento de carga por todo o ciclo de vida do Front (Mobile) e do Backend (DB).

- [ ] **TSK-5.1:** Validar Setup Mock: Ligar Front-end em *"Modo Demo"* isolado, bypassando requisições REST pela simulação nativa visual confirmando usabilidade de transição de telas sem banco.
- [ ] **TSK-5.2:** Testes de Sanidade Back-end API: Validar endpoints chaves (/Admin -> OS, Convites, Histórico) com envio JSON puramente por CLI cURL e retornos puros 200 OK e falhas intencionais (4xx/5xx).
- [ ] **TSK-5.3:** E2E PWA Test (End-to-End Caminho Feliz Completo): Logar Demo123 -> Dashboard Carrega GPS Base -> Recebe Push -> PWA Abre o Convite Ativo Pop-Up -> Cliques de Aceite Timer Valendo -> Botao Finaliza OS Envia Foto via formData -> Receber Nota Admin -> Atualizado Perfil Ganhos.
- [ ] **TSK-5.4:** Teste Offline (Resiliência do Service Worker): Desativar a rede através do Application Tab > Offline, abrir PWA e comprovar recarga a partir do cache HTML5 sem white screens e o armazenamento em espera de payloads visando *graceful degradation*.
- [ ] **TSK-5.5:** Teste de Push Completo do Backend até o PWA final simulando Payload de servidor fora do PWA Context de UI local.
