const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const { z } = require('zod');

// ─── Schemas ────────────────────────────────────────────────────────────────
const criarOSSchema = z.object({
    cliente_nome: z.string().min(2, 'Nome do cliente obrigatório'),
    endereco: z.string().min(5, 'Endereço obrigatório'),
    valor: z.number().positive('Valor deve ser positivo'),
    data_agendamento: z.string().optional(),
    cliente_telefone: z.string().optional(),
    lat: z.number().optional(),
    lng: z.number().optional()
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Dados inválidos', detalhes: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
};

const STATUS_VALIDOS = ['pendente', 'aceita', 'em_andamento', 'concluida', 'cancelada'];

// ─── GET /api/os — Listar OS ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    try {
        const whereClause = status ? { status } : {};

        const ordens = await prisma.ordemServico.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: offset,
            include: { cliente: true, montador: true }
        });

        const total = await prisma.ordemServico.count({
            where: whereClause
        });

        res.json({ ordens, total, page: Number(page) });
    } catch (err) {
        console.error('Erro ao listar OS:', err.message);
        res.status(500).json({ error: 'Erro ao buscar ordens' });
    }
});

// ─── POST /api/os — Criar OS ────────────────────────────────────────────────
router.post('/', authMiddleware, validate(criarOSSchema), async (req, res) => {
    const { cliente_nome, endereco, valor, data_agendamento, cliente_telefone, lat, lng } = req.body;
    try {
        // Find or create customer
        let cliente = await prisma.cliente.findFirst({
            where: { nome: cliente_nome }
        });

        if (!cliente) {
             cliente = await prisma.cliente.create({
                 data: { nome: cliente_nome, telefone: cliente_telefone || "000000000" }
             });
        }

        const novaOS = await prisma.ordemServico.create({
            data: {
                numero: `OS-${Date.now().toString().slice(-6)}`,
                descricao: `Instalação para ${cliente_nome}`,
                endereco: endereco,
                valorBruto: valor,
                dataInstalacao: data_agendamento ? new Date(data_agendamento) : new Date(),
                status: 'pendente',
                clienteId: cliente.id,
                lat: lat || 0,
                lng: lng || 0
            }
        });

        res.status(201).json(novaOS);
    } catch (err) {
        console.error('Erro ao criar OS:', err.message);
        res.status(500).json({ error: 'Erro ao criar ordem' });
    }
});

// ─── GET /api/os/:id ────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const os = await prisma.ordemServico.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { cliente: true, montador: true }
        });
        
        if (!os) return res.status(404).json({ error: 'OS não encontrada' });
        
        res.json(os);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar OS' });
    }
});

// ─── PATCH /api/os/:id/status ───────────────────────────────────────────────
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const { status, montador_id } = req.body;
    
    // Fallbacks from previous uppercase statuses to the lowercased ones expected by the new Prisma schema
    const newStatus = status.toLowerCase() === 'disponivel' ? 'pendente' : status.toLowerCase();

    if (!STATUS_VALIDOS.includes(newStatus)) {
        return res.status(400).json({ error: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}` });
    }
    try {
        const dataToUpdate = { status: newStatus };
        if (montador_id) {
            dataToUpdate.montadorId = parseInt(montador_id);
        }

        const updatedOS = await prisma.ordemServico.update({
            where: { id: parseInt(req.params.id) },
            data: dataToUpdate
        });

        res.json(updatedOS);
    } catch (err) {
        console.error('Erro ao atualizar status', err);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// ─── GET /api/os/stats/dashboard ───────────────────────────────────────────
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
    try {
        const concluidas = await prisma.ordemServico.count({
            where: { status: 'concluida' }
        });

        const ativos = await prisma.montador.count({
            where: { status: 'disponivel' }
        });

        const faturamentoAgg = await prisma.ordemServico.aggregate({
            _sum: {
                valorBruto: true
            },
            where: {
                status: 'concluida'
            }
        });

        res.json({
            concluidas: concluidas,
            montadoresAtivos: ativos,
            faturamento: faturamentoAgg._sum.valorBruto || 0
        });
    } catch (err) {
        console.error('Erro de agg', err);
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
});

module.exports = router;
