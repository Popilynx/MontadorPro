const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const { z } = require('zod');

// ─── Schemas ────────────────────────────────────────────────────────────────
const criarOSSchema = z.object({
    cliente_nome: z.string().min(2, 'Nome do cliente obrigatório'),
    endereco: z.string().min(5, 'Endereço obrigatório'),
    valor: z.number().positive('Valor deve ser positivo'),
    data_agendamento: z.string().optional(),
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
};

const STATUS_VALIDOS = ['DISPONIVEL', 'CONVITE_ENVIADO', 'ACEITA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'];

// ─── GET /api/os — Listar OS ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    try {
        let query = 'SELECT * FROM ordens_servico';
        const params = [];
        if (status) { query += ' WHERE status = $1'; params.push(status); }
        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(Number(limit), offset);

        const result = await db.query(query, params);
        const totalRes = await db.query(
            'SELECT COUNT(*) FROM ordens_servico' + (status ? ' WHERE status = $1' : ''),
            status ? [status] : []
        );
        res.json({ ordens: result.rows, total: Number(totalRes.rows[0].count), page: Number(page) });
    } catch (err) {
        console.error('Erro ao listar OS:', err.message);
        res.status(500).json({ error: 'Erro ao buscar ordens' });
    }
});

// ─── POST /api/os — Criar OS ────────────────────────────────────────────────
router.post('/', authMiddleware, validate(criarOSSchema), async (req, res) => {
    const { cliente_nome, endereco, valor, data_agendamento } = req.body;
    try {
        const result = await db.query(
            `INSERT INTO ordens_servico (cliente_nome, endereco, valor, data_agendamento, status, montador_id)
             VALUES ($1, $2, $3, $4, 'DISPONIVEL', NULL) RETURNING *`,
            [cliente_nome, endereco, valor, data_agendamento || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Erro ao criar OS:', err.message);
        res.status(500).json({ error: 'Erro ao criar ordem' });
    }
});

// ─── GET /api/os/:id ────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ordens_servico WHERE id = $1', [req.params.id]);
        if (!result.rows[0]) return res.status(404).json({ error: 'OS não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar OS' });
    }
});

// ─── PATCH /api/os/:id/status ───────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const { status, montador_id } = req.body;
    if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({ error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });
    }
    try {
        let query;
        let params;
        if (montador_id) {
            query = 'UPDATE ordens_servico SET status = $1, montador_id = $3 WHERE id = $2 RETURNING *';
            params = [status, req.params.id, montador_id];
        } else {
            query = 'UPDATE ordens_servico SET status = $1 WHERE id = $2 RETURNING *';
            params = [status, req.params.id];
        }
        const result = await db.query(query, params);
        if (!result.rows[0]) return res.status(404).json({ error: 'OS não encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ─── GET /api/os/stats/dashboard ───────────────────────────────────────────
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
    try {
        const [concluidas, ativos, faturamento] = await Promise.all([
            db.query("SELECT COUNT(*) FROM ordens_servico WHERE status = 'CONCLUIDA'"),
            db.query("SELECT COUNT(*) FROM montadores WHERE status = 'online'"),
            db.query("SELECT COALESCE(SUM(valor),0) AS total FROM ordens_servico WHERE status = 'CONCLUIDA'"),
        ]);
        res.json({
            concluidas: Number(concluidas.rows[0].count),
            montadoresAtivos: Number(ativos.rows[0].count),
            faturamento: Number(faturamento.rows[0].total),
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
});

module.exports = router;
