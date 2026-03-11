const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

// ─── GET /api/v1/convites/ativo — Retorna convite pendente atual ────────
router.get('/ativo', authMiddleware, async (req, res) => {
    try {
        const convite = await prisma.convite.findFirst({
            where: {
                montadorId: parseInt(req.montadorId),
                status: 'pendente',
                expiresAt: { gt: new Date() }
            },
            include: { ordem: { include: { cliente: true } } },
            orderBy: { createdAt: 'desc' }
        });

        if (!convite) return res.json(null);

        res.json({
            id: convite.id,
            ordemId: convite.ordemId,
            cliente_nome: convite.ordem.cliente?.nome,
            endereco: convite.ordem.endereco,
            valor: convite.ordem.valorBruto,
            descricao: convite.ordem.descricao,
            expiracaoAt: convite.expiresAt
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar convite ativo' });
    }
});

// ─── POST /api/v1/convites/:id/aceitar ───────────────────────────────────
router.post('/:id/aceitar', authMiddleware, async (req, res) => {
    try {
        const convite = await prisma.convite.findUnique({
            where: { id: parseInt(req.params.id) }
        });

        if (!convite || convite.montadorId !== parseInt(req.montadorId)) {
            return res.status(404).json({ error: 'Convite não encontrado' });
        }

        await prisma.$transaction(async (tx) => {
             // Marcar convite como aceito
             await tx.convite.update({
                 where: { id: parseInt(req.params.id) },
                 data: { status: 'aceito', respondidoAt: new Date() }
             });

             // Bloquear OS
             const os = await tx.ordemServico.findUnique({ where: { id: convite.ordemId } });
             if (os.status !== 'pendente') throw new Error('OS_ALREADY_TAKEN');

             await tx.ordemServico.update({
                 where: { id: convite.ordemId },
                 data: { status: 'aceita', montadorId: parseInt(req.montadorId) }
             });

             // Criar Execução
             await tx.execucao.create({
                 data: {
                     ordemId: convite.ordemId,
                     montadorId: parseInt(req.montadorId),
                     status: 'em_andamento'
                 }
             });
        });

        res.json({ message: 'Serviço aceito com sucesso!' });
    } catch (err) {
        if (err.message === 'OS_ALREADY_TAKEN') return res.status(400).json({ error: 'Já aceito por outro.' });
        res.status(500).json({ error: 'Erro ao aceitar convite' });
    }
});

// ─── POST /api/v1/convites/:id/recusar ───────────────────────────────────
router.post('/:id/recusar', authMiddleware, async (req, res) => {
    try {
        await prisma.convite.update({
            where: { id: parseInt(req.params.id), montadorId: parseInt(req.montadorId) },
            data: { status: 'recusado', respondidoAt: new Date() }
        });
        res.json({ message: 'Convite recusado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao recusar convite' });
    }
});


// ─── POST /api/convites/:id/finalizar ───────────────────────────────────
router.post('/:id/finalizar', authMiddleware, async (req, res) => {
    // Isso deve idealmente ir para o execução route, mas mantendo a compatibilidade do frontend
    const { nota, observacao } = req.body;
    try {
        const convite = await prisma.convite.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
        ordem: { include: { cliente: true } },
        fotos: true
      }
        });
        
        if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });

        await prisma.$transaction(async (tx) => {
             await tx.ordemServico.update({
                 where: { id: convite.ordemId },
                 data: {
                     status: 'concluida'
                 }
             });

             await tx.execucao.updateMany({
                 where: { ordemId: convite.ordemId, montadorId: parseInt(req.montadorId) },
                 data: {
                     status: 'concluida',
                     conclusaoAt: new Date()
                 }
             });

             if (nota) {
                 await tx.avaliacao.create({
                     data: {
                         ordemId: convite.ordemId,
                         montadorId: parseInt(req.montadorId),
                         nota: Number(nota),
                         comentario: observacao
                     }
                 });
             }
        });

        logger.info(`[Transação Crítica] Serviço FINALIZADO | OS:${convite.ordemId} | Montador:${req.montadorId} | Nota:${nota}`);
        res.json({ message: 'OS finalizada com sucesso!', valor: convite.ordem.valorBruto });
    } catch (err) {
        logger.error(`[Transação Crítica] Erro ao finalizar OS ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Erro ao finalizar OS' });
    }
});

module.exports = router;
