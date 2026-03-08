const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const logger = require('../utils/logger');

// ─── GET /api/convites — Convites do montador logado ─────────────────────
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.id, c."ordemServicoId", c."montadorId", c.status, c."expiracaoAt",
                    o.cliente_nome, o.endereco, o.valor, o.data_agendamento
             FROM convites c
             JOIN ordens_servico o ON c."ordemServicoId"::integer = o.id
             WHERE c."montadorId"::integer = $1 AND c.status = 'PENDENTE' AND c."expiracaoAt" > NOW()
             ORDER BY c."createdAt" DESC`,
            [req.montadorId]
        );
        res.json(result.rows);
    } catch (err) {
        logger.error(`[Convites] Erro GET /: ${err.message}`);
        res.status(500).json({ error: 'Erro ao buscar convites' });
    }
});

// ─── GET /api/convites/:id ──────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT c.*, o.cliente_nome, o.endereco, o.valor, o.data_agendamento
             FROM convites c
             JOIN ordens_servico o ON c."ordemServicoId"::integer = o.id
             WHERE c.id = $1`,
            [req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Convite não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar convite' });
    }
});

// ─── POST /api/convites/:id/responder ───────────────────────────────────
router.post('/:id/responder', authMiddleware, async (req, res) => {
    const { acao } = req.body;
    if (!['ACEITAR', 'RECUSAR'].includes(acao)) {
        return res.status(400).json({ error: 'Ação inválida. Use ACEITAR ou RECUSAR.' });
    }
    try {
        const conviteRes = await db.query('SELECT * FROM convites WHERE id = $1', [req.params.id]);
        const convite = conviteRes.rows[0];
        if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });
        if (Number(convite.montadorId) !== req.montadorId) return res.status(403).json({ error: 'Sem permissão' });
        if (convite.status !== 'PENDENTE') return res.status(400).json({ error: 'Convite já respondido' });

        const novoStatus = acao === 'ACEITAR' ? 'ACEITO' : 'RECUSADO';
        await db.query('UPDATE convites SET status = $1 WHERE id = $2', [novoStatus, req.params.id]);

        if (acao === 'ACEITAR') {
            await db.query(
                "UPDATE ordens_servico SET status = 'ACEITA', montador_id = $1 WHERE id = $2",
                [req.montadorId, Number(convite.ordemServicoId)]
            );
            logger.info(`[Transação Crítica] Convite ACEITO | OS:${convite.ordemServicoId} | Montador:${req.montadorId}`);
        } else {
            logger.info(`[Transação Crítica] Convite RECUSADO | OS:${convite.ordemServicoId} | Montador:${req.montadorId}`);
        }

        res.json({ message: `Convite ${novoStatus.toLowerCase()} com sucesso.` });
    } catch (err) {
        logger.error(`[Transação Crítica] Erro ao responder convite ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Erro ao responder convite' });
    }
});

// ─── POST /api/convites/:id/finalizar ───────────────────────────────────
router.post('/:id/finalizar', authMiddleware, async (req, res) => {
    const { nota, observacao } = req.body;
    try {
        const conviteRes = await db.query('SELECT * FROM convites WHERE id = $1', [req.params.id]);
        const convite = conviteRes.rows[0];
        if (!convite) return res.status(404).json({ error: 'Convite não encontrado' });

        await db.query(
            "UPDATE ordens_servico SET status = 'CONCLUIDA', montador_id = COALESCE(montador_id, $2) WHERE id = $1",
            [Number(convite.ordemServicoId), req.montadorId]
        );

        logger.info(`[Transação Crítica] Serviço FINALIZADO | OS:${convite.ordemServicoId} | Montador:${req.montadorId} | Nota:${nota}`);
        res.json({ message: 'OS finalizada com sucesso!', valor: convite.valor });
    } catch (err) {
        logger.error(`[Transação Crítica] Erro ao finalizar OS ${req.params.id}: ${err.message}`);
        res.status(500).json({ error: 'Erro ao finalizar OS' });
    }
});

module.exports = router;
