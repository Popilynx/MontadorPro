const prisma = require('../config/db');

exports.getMeusConvites = async (req, res) => {
    try {
        const mid = req.montadorId;
        const convites = await prisma.convite.findMany({
            where: { 
                montadorId: mid, 
                status: 'enviado',
                expiresAt: { gt: new Date() }
            },
            include: {
                ordem: {
                    include: { cliente: { select: { nome: true, telefone: true } } }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Achatando o resultado para o frontend
        const result = convites.map(c => ({
            id: c.id,
            os_id: c.ordemId,
            cliente_nome: c.ordem.cliente?.nome || c.ordem.clienteNome || 'Cliente',
            endereco: c.ordem.endereco,
            valor: c.ordem.valorBruto || c.ordem.valor,
            descricao: c.ordem.descricao,
            status: c.status,
            expira_em: c.expiresAt,
            data_agendamento: c.ordem.dataAgendamento
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar convites' });
    }
};

exports.aceitarConvite = async (req, res) => {
    const { id } = req.params;
    const mid = req.montadorId;

    try {
        const convite = await prisma.convite.findUnique({
            where: { id: parseInt(id) },
            include: { ordem: true }
        });

        if (!convite || convite.montadorId !== mid) {
            return res.status(404).json({ error: 'Convite nao encontrado' });
        }

        if (convite.status !== 'enviado' || convite.expiresAt < new Date()) {
            return res.status(400).json({ error: 'Convite expirado ou ja processado' });
        }

        // Transação para aceitar: atualiza convite, vincula OS ao montador, cria execucao e muda status do montador
        await prisma.$transaction([
            prisma.convite.update({
                where: { id: convite.id },
                data: { status: 'aceito', respondidoAt: new Date() }
            }),
            prisma.ordemServico.update({
                where: { id: convite.ordemId },
                data: { 
                    status: 'aceita',
                    montadorId: mid
                }
            }),
            prisma.execucao.create({
                data: {
                    ordemId: convite.ordemId,
                    montadorId: mid,
                    status: 'em_andamento'
                }
            }),
            prisma.montador.update({
                where: { id: mid },
                data: { status: 'em_servico' }
            })
        ]);

        res.json({ sucesso: true, mensagem: 'Convite aceito com sucesso!' });
    } catch (err) {
        console.error('Erro ao aceitar convite:', err);
        res.status(500).json({ error: 'Erro ao aceitar convite' });
    }
};

exports.recusarConvite = async (req, res) => {
    const { id } = req.params;
    const mid = req.montadorId;

    try {
        await prisma.convite.update({
            where: { id: parseInt(id), montadorId: mid },
            data: { status: 'recusado', respondidoAt: new Date() }
        });
        res.json({ sucesso: true });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao recusar convite' });
    }
};

exports.finalizarLegacy = async (req, res) => {
    // Redireciona logicamente ou atua como ponte para execucaoController
    // Como é um legado de rotas antigas, vamos retornar que foi movido ou realizar a ação básica
    res.status(400).json({ error: 'Endpoint descontinuado. Use /api/v1/execucao/:id/finalizar' });
};

// Admin: Criar convite manual

exports.criarConviteAdmin = async (req, res) => {
    const { ordemId, montadorId, expiresMinutos = 20 } = req.body;
    try {
        if (!ordemId || !montadorId) {
            return res.status(400).json({ error: 'ordemId e montadorId sao obrigatorios.' });
        }

        const expiresAt = new Date(Date.now() + expiresMinutos * 60 * 1000);
        const convite = await prisma.convite.create({
            data: {
                ordemId: parseInt(ordemId),
                montadorId: parseInt(montadorId),
                expiresAt,
                status: 'enviado'
            }
        });

        res.status(201).json(convite);
    } catch (err) {
        console.error('Erro ao criar convite admin:', err);
        res.status(500).json({ error: 'Erro ao criar convite.' });
    }
};
