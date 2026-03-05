# Montador Pro - Guia de Desenvolvimento

Este documento descreve o escopo completo e o guia de desenvolvimento do sistema **Montador Pro**, uma plataforma digital para gestão de montadores de móveis e ordens de serviço, estabelecendo a base para manutenções estruturais e refatoração premium.

## 1. Visão Geral do Sistema

O Montador Pro é uma plataforma digital completa para gestão de montadores de móveis e ordens de serviço. O sistema conecta montadores autônomos à marcenaria, gerenciando todo o ciclo de vida de uma ordem de serviço — desde a criação e o envio do convite até a conclusão do serviço e avaliação do profissional.

### Objetivo Principal
Digitalizar e automatizar o fluxo de trabalho de montadores de móveis, reduzindo a fricção operacional, garantindo a rastreabilidade dos serviços e fornecendo métricas em tempo real para gestores e montadores.

### Componentes do Sistema
| Componente | Tecnologia | Função |
| :--- | :--- | :--- |
| **Frontend PWA** | HTML5 / CSS3 / JavaScript | Aplicativo mobile instalável para montadores |
| **Backend API** | Node.js + Express | API REST (auth, upload, push) |
| **Banco de Dados** | PostgreSQL (Supabase) + Prisma | Persistência (usuários, OS, avaliações) |
| **Service Worker** | Web Push API + Cache API | Notificações em background e app offline |
| **Admin API** | Express | Painel de gestão (criar OS, gerir convites) |

## 2. Fluxo Principal do Usuário
1. Gestor cria uma OS via API administrativa.
2. Administrador envia um convite para um montador (notificação push no celular).
3. Montador tem 10 minutos (tempo limite configurável) para avaliar o convite pelo PWA.
4. Ao aceitar o convite, o status atualiza a OS para 'em serviço'. É disparada a execução com acompanhamento em GPS (coordenadas).
5. O profissional realiza o check-in na localidade, finaliza, envia fotos multi-part (progresso/conclusão) pelo app.
6. A OS é dada como entregue. O backend consolida e registra métricas (+ avaliação e pagamento logístico fora da plataforma).

## 3. Arquitetura do Projeto

**Backend:**
- Stack: `Node.js` e `Express`.
- Database: `PostgreSQL` orquestrado com `Prisma ORM`.
- Camadas vitais: Controllers de rotas de autorização (login com Auth `JWT` via refresh-tokens seguros rotativos e senhas `Bcryptjs`), gerenciamento de fotos `Multer`, limites e CORS `Express-rate-limit`, Validações input `Zod` e Segurança da Header `Helmet`.

**Frontend PWA (Vanilla/Premium):**
- Arquitetura "Vanilla/SPA": Contido integralmente em `<index.html>` para isolamento de requisição pesada, rodando um Service Worker próprio em `sw.js`.
- Premium Design System: Focado em layouts minimalistas, limpos, animações, tipografia Google Fonts fluída e acessível.

**Infraestrutura e Deploy (Railway + Supabase):**
- Plataforma Nuvem: Hospedagem da aplicação (Backend Node + Frontend estático Vanilla) focada no modelo SaaS utilizando o **Railway.app**.
- Banco e Storage: O Banco de Dados PostgreSQL e o armazenamento de arquivos de mídia (fotos) serão provisionados no **Supabase** (BaaS), descentralizando o armazenamento e garantindo uma persistência externa altamente tolerante a reinicializações. O Express rodará como monolito conectado ao Supabase.

## 4. Diretrizes de Desenvolvimento Premium
* Modificação rigorosamente orientada ao desenvolvimento **Premium** da UI/UX no aplicativo PWA.
* Desenvolvimento visual com *Glassmorphism*, gradientes orgânicos, inputs float e botões modernos animados, sem depender de pacotes grandes de layout como *Tailwind* por padrão (foco em HTML/CSS Puro com extrema customização visual e paleta dark/clean em CSS Variables).
* Segurança atrelada ao fluxo da API. Preocupação redobrada em transações unificadas e rotas admin restritas (`X-Admin-Token`).