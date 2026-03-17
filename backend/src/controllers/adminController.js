const prisma = require('../config/db');
const { hashPassword, comparePassword, generateAccessToken } = require('../utils/auth');
const { sendVerificationEmail } = require('../services/emailService');
const { calcularDistancia } = require('../utils/geoUtils');
const { enviarNotificacao, broadcast } = require('../services/pushService');

// Mappers internos
const mapMontadorList = (m) => {
  if (!m) return m;
  const { senhaHash, refreshTokens, ...rest } = m;
  return {
    ...rest,
    foto_url: m.fotoUrl,
    anos_exp: m.anosExperiencia,
    criado_em: m.createdAt,
    aprovado_em: m.aprovadoEm
  };
};

const mapMontadorDocs = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    nome: m.nome,
    foto_url: m.fotoUrl,
    foto_perfil: m.fotoUrl || m.docFoto,
    doc_frente: m.docRg,
    doc_verso: m.docCpf,
    comprovante_residencia: m.docComprovante,
    doc_antecedente: m.docAntecedente,
    doc_portfolio: m.docPortfolio || []
  };
};

const mapOs = (os) => {
  if (!os) return os;
  return {
    ...os,
    numero_os: os.numero,
    cliente_nome: os.clienteNome || os.cliente?.nome,
    cliente_contato: os.clienteContato || os.cliente?.telefone,
    tipo_projeto: os.tipoProjeto,
    endereco_instalacao: os.endereco,
    data_agendamento: os.dataInstalacao,
    valor: os.valorBruto,
    montador_nome: os.montador?.nome,
    montador_telefone: os.montador?.telefone
  };
};

const generateNumeroOS = () => {
  const ano = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(10 + Math.random() * 89);
  return `OS-${ano}-${timestamp}${random}`;
};

// Controllers
exports.getStats = async (req, res) => {
  try {
    const [totalMontadores, totalOS, faturamento] = await Promise.all([
      prisma.montador.count(),
      prisma.ordemServico.count(),
      prisma.ordemServico.aggregate({
        _sum: { valorBruto: true },
        where: { status: 'concluida' }
      })
    ]);

    res.json({
      totalMontadores,
      totalOS,
      faturamento: faturamento._sum.valorBruto || 0
    });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar stats' });
  }
};

exports.listMontadores = async (req, res) => {
  try {
    const { status, view } = req.query;
    const statusMap = {
      pendentes: 'pendente',
      aprovados: 'aprovado',
      rejeitados: 'rejeitado'
    };
    const normalizedStatus = statusMap[status] || status;
    const where = normalizedStatus ? { status: normalizedStatus } : {};

    const viewMode = (view || 'list').toString().toLowerCase();
    const select = viewMode === 'map' 
      ? { id: true, nome: true, status: true, lat: true, lng: true }
      : { id: true, nome: true, telefone: true, status: true, cidade: true, nivelExperiencia: true, fotoUrl: true, role: true, createdAt: true, aprovadoEm: true, lat: true, lng: true, anosExperiencia: true };

    const montadores = await prisma.montador.findMany({
      where,
      orderBy: { nome: 'asc' },
      select
    });

    if (viewMode === 'map') return res.json(montadores);
    res.json(montadores.map(mapMontadorList));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar montadores' });
  }
};

exports.getMontadorById = async (req, res) => {
  try {
    const viewMode = (req.query.view || 'list').toString().toLowerCase();
    const select = viewMode === 'docs' 
      ? { id: true, nome: true, fotoUrl: true, docRg: true, docCpf: true, docComprovante: true, docFoto: true, docAntecedente: true, docPortfolio: true }
      : { id: true, nome: true, telefone: true, status: true, cidade: true, nivelExperiencia: true, fotoUrl: true, role: true, createdAt: true, aprovadoEm: true, lat: true, lng: true, anosExperiencia: true };

    const montador = await prisma.montador.findUnique({
      where: { id: parseInt(req.params.id) },
      select
    });

    if (!montador) return res.status(404).json({ error: 'Montador nao encontrado' });
    if (viewMode === 'docs') return res.json(mapMontadorDocs(montador));
    res.json(mapMontadorList(montador));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar montador' });
  }
};

exports.updateMontador = async (req, res) => {
  const { status, nome, telefone, email, role, cidade, foto_url, observacaoRejeicao } = req.body || {};
  try {
    const data = {
      ...(status && { status }),
      ...(nome && { nome }),
      ...(telefone && { telefone }),
      ...(email && { email }),
      ...(role && { role }),
      ...(cidade && { cidade }),
      ...(foto_url && { fotoUrl: foto_url }),
      ...(observacaoRejeicao && { observacaoRejeicao })
    };

    if (status === 'aprovado' || status === 'disponivel') {
      data.aprovadoEm = new Date();
    }

    const montador = await prisma.montador.update({
      where: { id: parseInt(req.params.id) },
      data
    });

    res.json(mapMontadorList(montador));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar montador' });
  }
};

exports.aprovarMontador = async (req, res) => {
  const { montador_id } = req.body;
  try {
    const id = parseInt(montador_id);
    const updated = await prisma.montador.update({
      where: { id },
      data: { status: 'aprovado', aprovadoEm: new Date() }
    });

    // Gerar link do PWA para o montador (Baseado na referência do desktop)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const pwaLink = `${baseUrl}?token=${Buffer.from(`${id}:${updated.telefone}`).toString('base64')}`;
    const whatsappLink = `https://wa.me/55${(updated.telefone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${updated.nome.split(' ')[0]}! ✅ Seu cadastro na Montador Pro foi *aprovado*!\n\nInstale o app pelo link:\n${pwaLink}`)}`;

    res.json({ 
      sucesso: true, 
      montador: { id: updated.id, nome: updated.nome, status: updated.status },
      pwaLink,
      whatsappLink
    });
  } catch (err) {
    console.error('Erro ao aprovar montador:', err);
    res.status(500).json({ erro: 'Erro ao aprovar' });
  }
};

exports.rejeitarMontador = async (req, res) => {
  const { montador_id, motivo } = req.body;
  try {
    await prisma.montador.update({
      where: { id: parseInt(montador_id) },
      data: { status: 'rejeitado', observacaoRejeicao: motivo || null }
    });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao rejeitar' });
  }
};

exports.listOrdens = async (req, res) => {
  const { status, limit } = req.query;
  try {
    const ordens = await prisma.ordemServico.findMany({
      where: status ? { status } : {},
      include: {
        cliente: { select: { id: true, nome: true, telefone: true } },
        montador: { select: { id: true, nome: true, telefone: true, status: true } }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: Number(limit) } : {})
    });
    res.json(ordens.map(mapOs));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ordens' });
  }
};

exports.criarOrdemServico = async (req, res) => {
  const {
    clienteId, cliente_nome, clienteNome, cliente_contato, clienteContato,
    descricao, endereco, endereco_instalacao, lat, lng, valorBruto, valor,
    dataInstalacao, data_agendamento, raioKm, raio_busca, tipoProjeto, tipo_projeto,
    observacoes
  } = req.body;

  try {
    let resolvedClienteId = clienteId ? parseInt(clienteId) : null;
    const nomeCliente = clienteNome || cliente_nome;
    const contatoCliente = clienteContato || cliente_contato;

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

    if (!resolvedClienteId) return res.status(400).json({ error: 'clienteId ou cliente_nome sao obrigatorios.' });

    let finalLat = parseFloat(lat) || 0;
    let finalLng = parseFloat(lng) || 0;
    const enderecoFinal = endereco || endereco_instalacao;

    if (finalLat === 0 && finalLng === 0 && enderecoFinal) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(enderecoFinal + ', Brasil')}&limit=1`;
        const geoRes = await fetch(geoUrl, { headers: { 'User-Agent': 'MontadorPro/1.0' } });
        const geoData = await geoRes.json();
        if (geoData && geoData.length > 0) {
          finalLat = parseFloat(geoData[0].lat);
          finalLng = parseFloat(geoData[0].lon);
        }
      } catch (err) {
        console.error('Falha no geocoding:', err.message);
      }
    }

    const numeroOS = generateNumeroOS();
    const os = await prisma.ordemServico.create({
      data: {
        numero: numeroOS,
        descricao: descricao || (nomeCliente ? `Servico para ${nomeCliente}` : 'Ordem de Servico'),
        clienteNome: nomeCliente,
        clienteContato: contatoCliente,
        tipoProjeto: tipoProjeto || tipo_projeto,
        observacoes,
        endereco: enderecoFinal || 'Endereco nao informado',
        lat: finalLat,
        lng: finalLng,
        valorBruto: parseFloat(valorBruto || valor) || 0,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : (data_agendamento ? new Date(data_agendamento) : new Date()),
        clienteId: resolvedClienteId,
        status: 'pendente'
      }
    });

    const raioFinal = parseFloat(raioKm || raio_busca) || 100;
    let convitesPayload = [];
    if (finalLat !== 0 && finalLng !== 0) {
      const montadores = await prisma.montador.findMany({
        where: { status: { in: ['disponivel', 'aprovado'] }, lat: { not: null }, lng: { not: null } }
      });

      const proximos = montadores
        .map((m) => ({ ...m, distancia: calcularDistancia(finalLat, finalLng, m.lat, m.lng) }))
        .filter((m) => m.distancia <= raioFinal)
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, 3);

      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
      for (const m of proximos) {
        await prisma.convite.create({
          data: { ordemId: os.id, montadorId: m.id, expiresAt, status: 'enviado' }
        });
        
        if (m.deviceId) {
          enviarNotificacao(m.id, { title: 'Novo Convite', body: `${os.descricao}`, data: { url: '/app/convites' } });
        }
        
        convitesPayload.push({
          montador_id: m.id,
          montador_nome: m.nome,
          distancia_km: m.distancia.toFixed(1)
        });
      }
    }

    res.status(201).json({ os: mapOs(os), convites: convitesPayload });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar OS', detail: err.message });
  }
};

exports.concluirOS = async (req, res) => {
  try {
    const { os_id } = req.body;
    if (!os_id) return res.status(400).json({ erro: 'ID nao enviado' });

    const result = await prisma.ordemServico.update({
      where: { id: parseInt(os_id) },
      data: { status: 'concluida' }
    });

    res.json({ sucesso: true, os: mapOs(result) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao concluir OS' });
  }
};

exports.broadcast = async (req, res) => {
  const { title, body } = req.body;
  await broadcast({ title, body });
  res.json({ message: 'Broadcast enviado com sucesso.' });
};
