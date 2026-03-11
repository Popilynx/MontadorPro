const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const { comparePassword, hashPassword } = require('../utils/auth');

// GET /api/v1/montadores/me — Perfil completo do montador autenticado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const montador = await prisma.montador.findUnique({
            where: { id: parseInt(req.montadorId) },
            select: {
                id: true,
                nome: true,
                telefone: true,
                pixChave: true,
                notaMedia: true,
                status: true,
                lat: true,
                lng: true,
                email: true,
                role: true,
                fotoUrl: true,
                emailVerificado: true,
                createdAt: true
            }
        });

        if (!montador) {
            return res.status(404).json({ error: 'Montador não encontrado' });
        }

        const { fotoUrl, ...rest } = montador;
        res.json({ ...rest, foto_url: fotoUrl });
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do perfil' });
    }
});

// GET /api/v1/montadores/me/stats — Ganhos do mês, total de OS e nota média
router.get('/me/stats', authMiddleware, async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [totalConcluidas, ganhosMes, montador] = await Promise.all([
            prisma.ordemServico.count({
                where: {
                    montadorId: parseInt(req.montadorId),
                    status: 'concluida'
                }
            }),
            prisma.ordemServico.aggregate({
                _sum: { valorBruto: true },
                where: {
                    montadorId: parseInt(req.montadorId),
                    status: 'concluida',
                    dataInstalacao: { gte: startOfMonth }
                }
            }),
            prisma.montador.findUnique({
                where: { id: parseInt(req.montadorId) },
                select: { notaMedia: true }
            })
        ]);

        res.json({
            totalOS: totalConcluidas,
            ganhosMes: ganhosMes._sum.valorBruto || 0,
            notaMedia: montador?.notaMedia || 5.0
        });
    } catch (err) {
        console.error('Erro ao buscar stats:', err);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// PATCH /api/v1/montadores/me — Atualiza perfil do próprio montador
router.patch('/me', authMiddleware, async (req, res) => {
    const { nome, telefone, cidade, foto_url } = req.body;
    
    try {
        const updated = await prisma.montador.update({
            where: { id: parseInt(req.montadorId) },
            data: {
                nome,
                telefone,
                cidade,
                fotoUrl: foto_url,
                updatedAt: new Date()
            },
            select: {
                id: true,
                nome: true,
                telefone: true,
                pixChave: true,
                notaMedia: true,
                status: true,
                lat: true,
                lng: true,
                email: true,
                role: true,
                fotoUrl: true,
                emailVerificado: true,
                createdAt: true
            }
        });

        const { fotoUrl, ...rest } = updated;
        res.json({ ...rest, foto_url: fotoUrl });
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Este telefone já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar dados do perfil' });
    }
});

// PATCH /api/v1/montadores/me/status — Altera disponibilidade (disponivel / indisponivel)
router.patch('/me/status', authMiddleware, async (req, res) => {
    const { status } = req.body;
    if (!['disponivel', 'indisponivel'].includes(status)) {
        return res.status(400).json({ error: 'Status inválido. Use disponivel ou indisponivel.' });
    }

    try {
        const updated = await prisma.montador.update({
            where: { id: parseInt(req.montadorId) },
            data: { status }
        });
        res.json({ status: updated.status });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// PATCH /api/v1/montadores/location — Atualiza coordenadas GPS (Compatibilidade Frontend)
router.patch('/location', authMiddleware, async (req, res) => {
    // Aceita tanto lat/lng quanto latitude/longitude
    const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
    const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;

    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    try {
        await prisma.montador.update({
            where: { id: parseInt(req.montadorId) },
            data: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                status: 'disponivel'
            }
        });
        res.json({ message: 'Localização atualizada com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar localização' });
    }
});

// PATCH /api/v1/montadores/me/localizacao — Atualiza coordenadas GPS (Legacy)
router.patch('/me/localizacao', authMiddleware, async (req, res) => {
    const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
    const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;

    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    try {
        await prisma.montador.update({
            where: { id: parseInt(req.montadorId) },
            data: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                status: 'disponivel'
            }
        });
        res.json({ message: 'Localização atualizada com sucesso.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar localização' });
    }
});

// GET /api/v1/montadores/me/historico — Lista paginada de serviços concluídos
router.get('/me/historico', authMiddleware, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    try {
        const servicos = await prisma.ordemServico.findMany({
            where: {
                montadorId: parseInt(req.montadorId),
                status: 'concluida'
            },
            orderBy: { dataInstalacao: 'desc' },
            take: Number(limit),
            skip
        });

        res.json(servicos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});

// POST /api/v1/montadores/verificar — Verifica código de e-mail
router.post('/verificar', async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
    }

    try {
        const montador = await prisma.montador.findFirst({
            where: { email, codigoVerificacao: code }
        });

        if (!montador) {
            return res.status(400).json({ error: 'Código inválido ou e-mail incorreto.' });
        }

        await prisma.montador.update({
            where: { id: montador.id },
            data: {
                emailVerificado: true,
                codigoVerificacao: null,
                status: 'disponivel' // Ativa automaticamente ao verificar
            }
        });

        res.json({ message: 'E-mail verificado com sucesso! Sua conta está ativa.' });
    } catch (err) {
        console.error('Erro na verificação:', err);
        res.status(500).json({ error: 'Erro interno ao verificar e-mail' });
    }
});

module.exports = router;
