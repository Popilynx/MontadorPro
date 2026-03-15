const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const { z } = require('zod');
const { calcularDistancia } = require('../utils/geoUtils');

const STATUS_VALIDOS = ['pendente', 'aceita', 'em_andamento', 'concluida', 'cancelada', 'agendada'];

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

const generateNumeroOS = () => {
    const ano = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(10 + Math.random() * 89);
    return `OS-${ano}-${timestamp}${random}`;
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
        valor: os.valorBruto
    };
};

const criarOSSchema = z.object({
    cliente_nome: z.string().min(2).optional(),
    clienteNome: z.string().min(2).optional(),
    cliente_contato: z.string().optional(),
    clienteContato: z.string().optional(),
    clienteId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().optional()),
    endereco: z.string().min(5).optional(),
    endereco_instalacao: z.string().min(5).optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    valor: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().positive().optional()),
    valorBruto: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().positive().optional()),
    data_agendamento: z.string().optional(),
    dataInstalacao: z.string().optional(),
    descricao: z.string().optional(),
    tipo_projeto: z.string().optional(),
    tipoProjeto: z.string().optional(),
    observacoes: z.string().optional(),
    lat: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    lng: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    raioKm: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional()),
    raio_busca: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional())
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
};

// GET /api/os - Listar OS
router.get('/', authMiddleware, async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    try {
        const whereClause = status ? { status: normalizeStatus(status) } : {};
        
        // Se não for admin, vê apenas as ordens atribuídas a ele
        if (req.role !== 'admin') {
            whereClause.montadorId = req.montadorId;
        }

        const ordens = await prisma.ordemServico.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: offset,
            select: {
                id: true,
                numero: true,
                descricao: true,
                clienteNome: true,
                clienteContato: true,
                tipoProjeto: true,
                observacoes: true,
                endereco: true,
                lat: true,
                lng: true,
                valorBruto: true,
                status: true,
                dataInstalacao: true,
                createdAt: true,
                updatedAt: true,
                cliente: { select: { id: true, nome: true, telefone: true } },
                montador: { select: { id: true, nome: true, telefone: true, status: true } }
            }
        });

        const total = await prisma.ordemServico.count({ where: whereClause });

        res.json({ ordens: ordens.map(mapOsResponse), total, page: Number(page) });
    } catch (err) {
        console.error('Erro ao listar OS:', err.message);
        res.status(500).json({ error: 'Erro ao buscar ordens' });
    }
});

// POST /api/os - Criar OS e roteamento para montadores proximos
router.post('/', authMiddleware, validate(criarOSSchema), async (req, res) => {
    const {
        cliente_nome,
        clienteNome,
        cliente_contato,
        clienteContato,
        clienteId,
        endereco,
        endereco_instalacao,
        cidade,
        estado,
        valor,
        valorBruto,
        data_agendamento,
        dataInstalacao,
        descricao,
        tipo_projeto,
        tipoProjeto,
        observacoes,
        lat,
        lng,
        raioKm,
        raio_busca
    } = req.body;

    try {
        const nomeCliente = cliente_nome || clienteNome;
        const contatoCliente = cliente_contato || clienteContato;
        const enderecoFinal = endereco || endereco_instalacao;

        let resolvedClienteId = clienteId ? Number(clienteId) : null;
        if (!resolvedClienteId && nomeCliente) {
            let cliente = await prisma.cliente.findFirst({
                where: { nome: { equals: nomeCliente, mode: 'insensitive' } }
            });
            if (!cliente) {
                cliente = await prisma.cliente.create({
                    data: { nome: nomeCliente, telefone: contatoCliente || '000000000' }
                });
            }
            resolvedClienteId = cliente.id;
        }

        if (!resolvedClienteId) {
            return res.status(400).json({ error: 'clienteId ou cliente_nome sao obrigatorios.' });
        }

        let finalLat = lat || 0;
        let finalLng = lng || 0;
        let aviso = null;

        if (finalLat === 0 && finalLng === 0 && enderecoFinal) {
            try {
                const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoFinal + ', Brasil')}&limit=1`;
                const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'MontadorPro/1.0' } });
                const geoData = await geoRes.json();
                if (geoData && geoData.length > 0) {
                    finalLat = parseFloat(geoData[0].lat);
                    finalLng = parseFloat(geoData[0].lon);
                } else {
                    aviso = 'Endereco nao localizado para geocoding.';
                }
            } catch (err) {
                console.error('Falha no Nominatim (OS):', err.message);
                aviso = 'Falha ao buscar coordenadas do endereco.';
            }
        }

        const numeroOS = generateNumeroOS();
        const novaOS = await prisma.ordemServico.create({
            data: {
                numero: numeroOS,
                descricao: descricao || (nomeCliente ? `Instalacao para ${nomeCliente}` : 'Ordem de Servico'),
                clienteNome: nomeCliente,
                clienteContato: contatoCliente,
                tipoProjeto: tipoProjeto || tipo_projeto,
                observacoes,
                endereco: enderecoFinal || 'Endereco nao informado',
                lat: finalLat,
                lng: finalLng,
                valorBruto: valorBruto || valor || 0,
                dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : (data_agendamento ? new Date(data_agendamento) : new Date()),
                status: 'pendente',
                clienteId: resolvedClienteId
            }
        });

        let convitesPayload = [];
        const raioFinal = raioKm || raio_busca || 100;
        if (finalLat !== 0 && finalLng !== 0) {
            const montadoresValidos = await prisma.montador.findMany({
                where: {
                    status: { in: ['disponivel', 'aprovado'] },
                    lat: { not: null },
                    lng: { not: null }
                }
            });

            const proximos = montadoresValidos
                .map((m) => ({
                    ...m,
                    distancia: calcularDistancia(finalLat, finalLng, m.lat, m.lng)
                }))
                .filter((m) => m.distancia <= raioFinal)
                .sort((a, b) => a.distancia - b.distancia)
                .slice(0, 3);

            if (proximos.length === 0) {
                aviso = `Nenhum montador disponivel encontrado num raio de ${raioFinal}km.`;
            }

            const baseUrlFrontend = process.env.CORS_ORIGIN || 'http://localhost:5173';
            const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

            for (const m of proximos) {
                const novoConvite = await prisma.convite.create({
                    data: {
                        ordemId: novaOS.id,
                        montadorId: m.id,
                        expiresAt,
                        status: 'enviado'
                    }
                });

                const linkPush = `${baseUrlFrontend}/convite/${novoConvite.id}`;
                const foneLimpo = (m.telefone || '').replace(/\D/g, '');
                const zapMsg = `Ola *${m.nome.split(' ')[0]}*! \nA MontadorPro tem um novo servico proximo a voce!\n\nValor: R$ ${Number(novaOS.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nVoce tem 20 minutos para aceitar no link abaixo:\n${linkPush}`;

                convitesPayload.push({
                    montador_id: m.id,
                    montador_nome: m.nome,
                    distancia_km: m.distancia.toFixed(1),
                    link_convite: linkPush,
                    whatsapp_link: foneLimpo ? `https://wa.me/55${foneLimpo}?text=${encodeURIComponent(zapMsg)}` : null
                });
            }
        } else {
            aviso = 'Nao foi possivel calcular convites pois a OS nao possui coordenadas validas.';
        }

        res.status(201).json({
            os: mapOsResponse(novaOS),
            convites: convitesPayload,
            convitesEnviados: convitesPayload.length,
            aviso
        });
    } catch (err) {
        console.error('Erro ao criar OS:', err);
        res.status(500).json({ error: 'Erro ao criar ordem de servico' });
    }
});

// GET /api/os/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const os = await prisma.ordemServico.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                numero: true,
                descricao: true,
                clienteNome: true,
                clienteContato: true,
                tipoProjeto: true,
                observacoes: true,
                endereco: true,
                lat: true,
                lng: true,
                valorBruto: true,
                status: true,
                dataInstalacao: true,
                createdAt: true,
                updatedAt: true,
                cliente: { select: { id: true, nome: true, telefone: true } },
                montador: { select: { id: true, nome: true, telefone: true, status: true } }
            }
        });

        if (!os) return res.status(404).json({ error: 'OS nao encontrada' });

        res.json(mapOsResponse(os));
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar OS' });
    }
});

// PATCH /api/os/:id/status
router.patch('/:id/status', authMiddleware, async (req, res) => {
    const { status, montador_id } = req.body;
    const newStatus = normalizeStatus(status);

    if (!newStatus || !STATUS_VALIDOS.includes(newStatus)) {
        return res.status(400).json({ error: `Status invalido. Use: ${STATUS_VALIDOS.join(', ')}` });
    }
    try {
        const dataToUpdate = { status: newStatus };
        if (montador_id) {
            dataToUpdate.montadorId = parseInt(montador_id);
        }

        const updatedOS = await prisma.$transaction(async (tx) => {
            const os = await tx.ordemServico.update({
                where: { id: parseInt(req.params.id) },
                data: dataToUpdate
            });

            if (newStatus === 'aceita' || newStatus === 'em_andamento') {
                const mid = montador_id ? parseInt(montador_id) : os.montadorId;
                if (mid) {
                    const execExistente = await tx.execucao.findFirst({
                        where: { ordemId: os.id, montadorId: mid }
                    });

                    if (!execExistente) {
                        await tx.execucao.create({
                            data: {
                                ordemId: os.id,
                                montadorId: mid,
                                status: 'em_andamento'
                            }
                        });
                    }
                }
            }

            return os;
        });

        res.json(mapOsResponse(updatedOS));
    } catch (err) {
        console.error('Erro ao atualizar status', err);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// GET /api/os/stats/dashboard
router.get('/stats/dashboard', authMiddleware, async (req, res) => {
    try {
        const concluidas = await prisma.ordemServico.count({
            where: { status: 'concluida' }
        });

        const ativos = await prisma.montador.count({
            where: { status: 'disponivel' }
        });

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
        console.error('Erro de agg', err);
        res.status(500).json({ error: 'Erro ao buscar stats' });
    }
});

module.exports = router;
