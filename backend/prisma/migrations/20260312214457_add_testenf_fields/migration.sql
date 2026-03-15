-- CreateTable
CREATE TABLE "montador" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "password" TEXT,
    "pixChave" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "status" TEXT DEFAULT 'disponivel',
    "cpf" TEXT,
    "cidade" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "email" TEXT,
    "rg" TEXT,
    "nascimento" TIMESTAMP(3),
    "cep" TEXT,
    "endereco" TEXT,
    "estado" TEXT DEFAULT 'GO',
    "ip_origem" TEXT,
    "localizacao_confirmada" BOOLEAN DEFAULT false,
    "nivel_experiencia" TEXT,
    "anos_experiencia" TEXT,
    "cnpj_status" TEXT,
    "cnpj" TEXT,
    "especialidades" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ferramentas" TEXT,
    "referencias" TEXT,
    "disponibilidade" TEXT,
    "origem" TEXT,
    "observacao_rejeicao" TEXT,
    "doc_rg" TEXT,
    "doc_cpf" TEXT,
    "doc_comprovante" TEXT,
    "doc_foto" TEXT,
    "doc_antecedente" TEXT,
    "doc_portfolio" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "role" TEXT NOT NULL DEFAULT 'montador',
    "foto_url" TEXT,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "aprovado_em" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "montador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "montadorId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" SERIAL NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "montadorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" SERIAL NOT NULL,
    "numero" TEXT,
    "descricao" TEXT NOT NULL,
    "cliente_nome" TEXT,
    "cliente_contato" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "tipo_projeto" TEXT,
    "observacoes" TEXT,
    "endereco" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "valorBruto" DOUBLE PRECISION NOT NULL,
    "status" TEXT DEFAULT 'pendente',
    "dataInstalacao" TIMESTAMP(3) NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "montadorId" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convites" (
    "id" SERIAL NOT NULL,
    "ordemId" INTEGER NOT NULL,
    "montadorId" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'pendente',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondidoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "execucoes" (
    "id" SERIAL NOT NULL,
    "ordemId" INTEGER NOT NULL,
    "montadorId" INTEGER NOT NULL,
    "status" TEXT DEFAULT 'em_andamento',
    "chegadaAt" TIMESTAMP(3),
    "latChegada" DOUBLE PRECISION,
    "lngChegada" DOUBLE PRECISION,
    "conclusaoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "execucoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos" (
    "id" SERIAL NOT NULL,
    "execucaoId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" SERIAL NOT NULL,
    "ordemId" INTEGER NOT NULL,
    "montadorId" INTEGER NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "montador_telefone_key" ON "montador"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_montadorId_idx" ON "refresh_tokens"("montadorId");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_montadorId_idx" ON "push_subscriptions"("montadorId");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- CreateIndex
CREATE INDEX "ordens_servico_clienteId_idx" ON "ordens_servico"("clienteId");

-- CreateIndex
CREATE INDEX "ordens_servico_montadorId_idx" ON "ordens_servico"("montadorId");

-- CreateIndex
CREATE INDEX "convites_ordemId_idx" ON "convites"("ordemId");

-- CreateIndex
CREATE INDEX "convites_montadorId_idx" ON "convites"("montadorId");

-- CreateIndex
CREATE INDEX "execucoes_ordemId_idx" ON "execucoes"("ordemId");

-- CreateIndex
CREATE INDEX "execucoes_montadorId_idx" ON "execucoes"("montadorId");

-- CreateIndex
CREATE INDEX "fotos_execucaoId_idx" ON "fotos"("execucaoId");

-- CreateIndex
CREATE INDEX "avaliacoes_ordemId_idx" ON "avaliacoes"("ordemId");

-- CreateIndex
CREATE INDEX "avaliacoes_montadorId_idx" ON "avaliacoes"("montadorId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites" ADD CONSTRAINT "convites_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convites" ADD CONSTRAINT "convites_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes" ADD CONSTRAINT "execucoes_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "execucoes" ADD CONSTRAINT "execucoes_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fotos" ADD CONSTRAINT "fotos_execucaoId_fkey" FOREIGN KEY ("execucaoId") REFERENCES "execucoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_montadorId_fkey" FOREIGN KEY ("montadorId") REFERENCES "montador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
