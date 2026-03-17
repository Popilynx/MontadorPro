const prisma = require('../config/db');
const axios = require('axios');

// Mappers internos
const mapMontadorResponse = (m) => {
    if (!m) return m;
    const { fotoUrl, ...rest } = m;
    return { ...rest, foto_url: fotoUrl };
};

// Controllers
exports.getMe = async (req, res) => {
    try {
        const montador = await prisma.montador.findUnique({
            where: { id: req.montadorId },
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

        if (!montador) return res.status(404).json({ error: 'Montador nao encontrado' });
        res.json(mapMontadorResponse(montador));
    } catch (err) {
        console.error('Erro ao buscar perfil:', err);
        res.status(500).json({ error: 'Erro ao buscar dados do perfil' });
    }
};

exports.getMeStats = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const [totalConcluidas, ganhosMes, montador] = await Promise.all([
            prisma.ordemServico.count({
                where: { montadorId: req.montadorId, status: 'concluida' }
            }),
            prisma.ordemServico.aggregate({
                _sum: { valorBruto: true },
                where: {
                    montadorId: req.montadorId,
                    status: 'concluida',
                    dataInstalacao: { gte: startOfMonth }
                }
            }),
            prisma.montador.findUnique({
                where: { id: req.montadorId },
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
        res.status(500).json({ error: 'Erro ao buscar estatisticas' });
    }
};

exports.updateMe = async (req, res) => {
    const { nome, telefone, cidade, foto_url } = req.body;
    try {
        const updated = await prisma.montador.update({
            where: { id: req.montadorId },
            data: {
                nome,
                telefone,
                cidade,
                fotoUrl: foto_url,
                updatedAt: new Date()
            }
        });
        res.json(mapMontadorResponse(updated));
    } catch (err) {
        console.error('Erro ao atualizar perfil:', err);
        if (err.code === 'P2002') return res.status(400).json({ error: 'Este telefone ja esta em uso.' });
        res.status(500).json({ error: 'Erro ao atualizar dados do perfil' });
    }
};

exports.updateStatus = async (req, res) => {
    const { status } = req.body;
    if (!['disponivel', 'indisponivel'].includes(status)) {
        return res.status(400).json({ error: 'Status invalido.' });
    }
    try {
        const updated = await prisma.montador.update({
            where: { id: req.montadorId },
            data: { status }
        });
        res.json({ status: updated.status });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};

exports.updateLocation = async (req, res) => {
    const lat = req.body.lat !== undefined ? req.body.lat : req.body.latitude;
    const lng = req.body.lng !== undefined ? req.body.lng : req.body.longitude;

    if (lat === undefined || lng === undefined) {
        return res.status(400).json({ error: 'Latitude e longitude sao obrigatorias.' });
    }

    try {
        let cidade = null;
        let estado = null;

        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'MontadorPro/1.0' } });
            if (response.data && response.data.address) {
                const addr = response.data.address;
                cidade = addr.city || addr.town || addr.village || addr.municipality || addr.suburb;
                estado = addr.state;
            }
        } catch (geoErr) {
            console.error('Erro no geocoding reverso:', geoErr.message);
        }

        await prisma.montador.update({
            where: { id: req.montadorId },
            data: {
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                status: 'disponivel',
                ...(cidade && { cidade }),
                ...(estado && { estado })
            }
        });
        res.json({ message: 'Localizacao atualizada com sucesso.', cidade, estado });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar localizacao' });
    }
};

exports.getHistorico = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    try {
        const servicos = await prisma.ordemServico.findMany({
            where: { montadorId: req.montadorId, status: 'concluida' },
            orderBy: { dataInstalacao: 'desc' },
            take: Number(limit),
            skip
        });
        res.json(servicos);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar historico' });
    }
};

exports.verificarEmail = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'E-mail e codigo sao obrigatorios.' });
    try {
        const montador = await prisma.montador.findFirst({
            where: { email, codigoVerificacao: code }
        });
        if (!montador) return res.status(400).json({ error: 'Codigo invalido ou e-mail incorreto.' });

        await prisma.montador.update({
            where: { id: montador.id },
            data: { emailVerificado: true, codigoVerificacao: null, status: 'disponivel' }
        });
        res.json({ message: 'E-mail verificado com sucesso!' });
    } catch (err) {
        res.status(500).json({ error: 'Erro interno ao verificar e-mail' });
    }
};
