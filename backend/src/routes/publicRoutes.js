const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// GET /api/v1/public/convites/:id/detalhes
router.get('/convites/:id/detalhes', async (req, res) => {
    try {
        const conviteId = parseInt(req.params.id);
        if (isNaN(conviteId)) return res.status(400).json({ error: 'ID invalido' });

        const convite = await prisma.convite.findUnique({
            where: { id: conviteId },
            include: {
                ordem: { include: { cliente: true } },
                montador: true
            }
        });

        if (!convite) {
            return res.status(404).json({ error: 'Convite nao encontrado' });
        }

        const agora = new Date();
        if (convite.status === 'enviado' || convite.status === 'pendente') {
            if (agora > convite.expiresAt) {
                await prisma.convite.update({
                    where: { id: convite.id },
                    data: { status: 'expirado' }
                });
                return res.status(400).json({ error: 'Este convite expirou o tempo limite de 20 minutos.' });
            }
        } else if (convite.status !== 'aceito') {
            return res.status(400).json({ error: 'Este convite nao esta mais disponivel.' });
        }

        res.json({
            id: convite.id,
            os_id: convite.ordem.id,
            cliente_nome: convite.ordem.cliente?.nome || convite.ordem.clienteNome || 'Cliente',
            endereco: convite.ordem.endereco,
            valor: convite.ordem.valorBruto,
            descricao: convite.ordem.descricao,
            status: convite.status,
            expira_em: convite.expiresAt,
            criado_em: convite.createdAt,
            montador_nome: convite.montador?.nome
        });
    } catch (err) {
        console.error('Erro na rota publica de convite:', err);
        res.status(500).json({ error: 'Erro interno ao buscar convite' });
    }
});

// POST /api/v1/public/convites/:id/aceitar
router.post('/convites/:id/aceitar', async (req, res) => {
    try {
        const conviteId = parseInt(req.params.id);
        if (isNaN(conviteId)) return res.status(400).json({ error: 'ID invalido' });

        const convite = await prisma.convite.findUnique({ where: { id: conviteId } });
        if (!convite) return res.status(404).json({ error: 'Convite nao encontrado' });

        const agora = new Date();
        if (convite.status !== 'pendente' && convite.status !== 'enviado') {
            return res.status(400).json({ error: 'Este convite ja foi processado.' });
        }
        if (agora > convite.expiresAt) {
            return res.status(400).json({ error: 'Tempo limite de 20 minutos excedido.' });
        }

        await prisma.$transaction(async (tx) => {
            const os = await tx.ordemServico.findUnique({ where: { id: convite.ordemId } });
            if (!os || os.status !== 'pendente') {
                throw new Error('OS_ALREADY_TAKEN');
            }

            await tx.convite.update({
                where: { id: conviteId },
                data: { status: 'aceito', respondidoAt: new Date() }
            });

            await tx.convite.updateMany({
                where: {
                    ordemId: convite.ordemId,
                    id: { not: conviteId },
                    status: { in: ['pendente', 'enviado'] }
                },
                data: { status: 'recusado' }
            });

            await tx.ordemServico.update({
                where: { id: convite.ordemId },
                data: { status: 'aceita', montadorId: convite.montadorId }
            });

            await tx.execucao.create({
                data: {
                    ordemId: convite.ordemId,
                    montadorId: convite.montadorId,
                    status: 'em_andamento'
                }
            });
        });

        res.json({ success: true, message: 'Servico aceito com sucesso!' });
    } catch (err) {
        if (err.message === 'OS_ALREADY_TAKEN') {
            return res.status(400).json({ error: 'Outro montador ja aceitou este servico.' });
        }
        console.error('Erro ao aceitar convite (public):', err);
        res.status(500).json({ error: 'Erro interno ao processar aceite.' });
    }
});

// POST /api/v1/public/convites/:id/recusar
router.post('/convites/:id/recusar', async (req, res) => {
    try {
        const conviteId = parseInt(req.params.id);
        await prisma.convite.update({
            where: { id: conviteId },
            data: { status: 'recusado', respondidoAt: new Date() }
        });
        res.json({ success: true, message: 'Convite recusado.' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao recusar convite' });
    }
});

module.exports = router;
