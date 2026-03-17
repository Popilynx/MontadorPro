const prisma = require('../config/db');
const { calcularDistancia } = require('../utils/geoUtils');

// Mappers internos
const normalizeStatus = (status) => {
    if (!status) return null;
    const s = status
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');
    if (s === 'disponivel') return 'pendente';
    if (s === 'aceito') return 'aceita';
    if (s === 'concluida') return 'concluida';
    return s;
};

const mapOsResponse = (os) => {
    if (!os) return os;
    const numero = os.numero || os.numero_os;
    return {
        ...os,
        numero_os: numero,
        cliente_nome: os.clienteNome || os.cliente_nome || os.cliente?.nome,
        cliente_contato: os.clienteContato || os.cliente_contato || os.cliente?.telefone,
        tipo_projeto: os.tipoProjeto || os.tipo_projeto,
        endereco_instalacao: os.endereco,
        data_agendamento: os.dataInstalacao,
        valor: os.valorBruto,
        montador_nome: os.montador?.nome,
        montador_telefone: os.montador?.telefone
    };
};

const generateNumeroOS = async () => {
    const count = await prisma.ordemServico.count();
    const numero = `OS-${String(count + 1).padStart(5, '0')}`; // Formato OS-00001
    return numero;
};

// Controllers
exports.listOS = async (req, res) => {
    // ... (mantido igual)
};

exports.getOSById = async (req, res) => {
    try {
        const os = await prisma.ordemServico.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                cliente: { select: { id: true, nome: true, telefone: true } },
                montador: { select: { id: true, nome: true, telefone: true, status: true } }
            }
        });

        if (!os) return res.status(404).json({ error: 'OS nao encontrada' });
        res.json(mapOsResponse(os));
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar OS' });
    }
};


exports.updateOSStatus = async (req, res) => {
    const { status, montador_id } = req.body;
    const newStatus = normalizeStatus(status);
    const STATUS_VALIDOS = ['pendente', 'aceita', 'em_andamento', 'concluida', 'cancelada', 'agendada'];

    if (!newStatus || !STATUS_VALIDOS.includes(newStatus)) {
        return res.status(400).json({ error: 'Status invalido.' });
    }

    try {
        const dataToUpdate = { status: newStatus };
        if (montador_id) dataToUpdate.montadorId = parseInt(montador_id);

        const updatedOS = await prisma.$transaction(async (tx) => {
            const osBeforeUpdate = await tx.ordemServico.findUnique({
                where: { id: parseInt(req.params.id) }
            });

            if (!osBeforeUpdate) throw new Error('OS nao encontrada');

            const os = await tx.ordemServico.update({
                where: { id: parseInt(req.params.id) },
                data: dataToUpdate
            });

            // Se aceita ou em andamento, garante que existe registro de execução E atualiza status do montador
            if (newStatus === 'aceita' || newStatus === 'em_andamento') {
                const mid = montador_id ? parseInt(montador_id) : os.montadorId;
                if (mid) {
                    await tx.montador.update({
                        where: { id: mid },
                        data: { status: 'em_servico' }
                    });

                    const execExistente = await tx.execucao.findFirst({
                        where: { ordemId: os.id, montadorId: mid }
                    });
                    if (!execExistente) {
                        await tx.execucao.create({ data: { ordemId: os.id, montadorId: mid, status: 'em_andamento' } });
                    }
                }
            }
            return os;
        });

        res.json(mapOsResponse(updatedOS));
    } catch (err) {
        console.error('Erro ao atualizar status OS:', err);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const concluidas = await prisma.ordemServico.count({ where: { status: 'concluida' } });
        const ativos = await prisma.montador.count({ where: { status: 'disponivel' } });
        const faturamentoAgg = await prisma.ordemServico.aggregate({
            _sum: { valorBruto: true },
            where: { status: 'concluida' }
        });

        res.json({
            concluidas,
            montadoresAtivos: ativos,
            faturamento: faturamentoAgg._sum.valorBruto || 0
        });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
};

// ...


exports.criarOS = async (req, res) => {
    const { 
        cliente_nome, clienteNome, cliente_contato, clienteContato, clienteId, 
        endereco, endereco_instalacao, valor, valorBruto, data_agendamento, 
        dataInstalacao, descricao, tipo_projeto, tipoProjeto, lat, lng 
    } = req.body;
    
    try {
        const numeroOS = await generateNumeroOS();
        const os = await prisma.ordemServico.create({
            data: {
                numero: numeroOS,
                descricao: descricao || 'Nova OS',
                clienteNome: cliente_nome || clienteNome,
                clienteContato: cliente_contato || clienteContato,
                tipoProjeto: tipo_projeto || tipoProjeto,
                endereco: endereco || endereco_instalacao || 'Nao informado',
                lat: parseFloat(lat) || 0,
                lng: parseFloat(lng) || 0,
                valorBruto: parseFloat(valorBruto || valor) || 0,
                dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : (data_agendamento ? new Date(data_agendamento) : new Date()),
                status: 'pendente',
                clienteId: clienteId ? parseInt(clienteId) : undefined
            }
        });
        res.status(201).json(mapOsResponse(os));
    } catch (err) {
        console.error('Erro ao criar OS:', err);
        res.status(500).json({ error: 'Erro ao criar OS' });
    }
};
