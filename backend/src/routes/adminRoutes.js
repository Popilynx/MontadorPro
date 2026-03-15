const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { enviarNotificacao, broadcast } = require('../services/pushService');
const { sendVerificationEmail } = require('../services/emailService');
const { calcularDistancia } = require('../utils/geoUtils');
const { hashPassword, comparePassword, generateAccessToken, verifyToken } = require('../utils/auth');

// Middleware admin: aceita x-admin-secret (legado) ou JWT com role admin
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (secret && secret === process.env.ADMIN_SECRET) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET);
    if (decoded && decoded.role === 'admin') {
      req.adminId = decoded.id;
      return next();
    }
  }

  return res.status(403).json({ error: 'Acesso negado. Requer privilegios de administrador.' });
};

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

const selectMontadorList = {
  id: true,
  nome: true,
  telefone: true,
  status: true,
  cidade: true,
  nivelExperiencia: true,
  fotoUrl: true,
  role: true,
  createdAt: true,
  aprovadoEm: true,
  lat: true,
  lng: true,
  anosExperiencia: true
};

const selectMontadorMap = {
  id: true,
  nome: true,
  status: true,
  lat: true,
  lng: true
};

const selectMontadorDocs = {
  id: true,
  nome: true,
  fotoUrl: true,
  docRg: true,
  docCpf: true,
  docComprovante: true,
  docFoto: true,
  docAntecedente: true,
  docPortfolio: true
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

router.post('/login', async (req, res) => {
  const { email, telefone, password, credencial } = req.body || {};
  
  if (!password || (!email && !telefone && !credencial)) {
    return res.status(400).json({ error: 'E-mail/telefone e senha sao obrigatorios.' });
  }

  try {
    const input = credencial || email || telefone;
    const isEmail = (input || '').includes('@');
    
    const where = isEmail
      ? { email: input.toLowerCase().trim() }
      : { telefone: (input || '').replace(/\D/g, '') };

    const admin = await prisma.montador.findFirst({
      where: { ...where, role: 'admin' }
    });

    if (!admin) {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const senhaValida = await comparePassword(password, admin.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais invalidas.' });
    }

    const accessToken = generateAccessToken(admin.id, 'admin');
    return res.json({
      accessToken,
      montador: {
        id: admin.id,
        nome: admin.nome,
        telefone: admin.telefone,
        role: 'admin',
        status: admin.status
      }
    });
  } catch (err) {
    console.error('Erro no login admin:', err);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// GET /api/v1/admin/stats
router.get('/stats', adminAuth, async (req, res) => {
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
});

// GET /api/v1/admin/montadores
router.get('/montadores', adminAuth, async (req, res) => {
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
    const select =
      viewMode === 'map' ? selectMontadorMap : selectMontadorList;

    const montadores = await prisma.montador.findMany({
      where,
      orderBy: { nome: 'asc' },
      select
    });

    if (viewMode === 'map') {
      return res.json(montadores);
    }
    res.json(montadores.map(mapMontadorList));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar montadores' });
  }
});

// GET /api/v1/admin/montadores/:id
router.get('/montadores/:id', adminAuth, async (req, res) => {
  try {
    const viewMode = (req.query.view || 'list').toString().toLowerCase();
    const select =
      viewMode === 'docs' ? selectMontadorDocs : selectMontadorList;

    const montador = await prisma.montador.findUnique({
      where: { id: parseInt(req.params.id) },
      select
    });

    if (!montador) return res.status(404).json({ error: 'Montador nao encontrado' });

    if (viewMode === 'docs') {
      return res.json(mapMontadorDocs(montador));
    }

    res.json(mapMontadorList(montador));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar montador' });
  }
});

// POST /api/v1/admin/montadores - cria montador
router.post('/montadores', adminAuth, async (req, res) => {
  const { nome, telefone, email, senha, pixChave } = req.body;
  try {
    const senhaHash = await hashPassword(senha);
    const montador = await prisma.montador.create({
      data: {
        nome,
        telefone,
        email,
        senhaHash,
        pixChave,
        codigoVerificacao: Math.floor(100000 + Math.random() * 900000).toString(),
        status: 'pendente'
      }
    });

    if (email) {
      await sendVerificationEmail(montador.email, montador.nome, montador.codigoVerificacao);
    }

    res.status(201).json(mapMontadorList(montador));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar montador' });
  }
});

// PATCH /api/v1/admin/montadores/:id
router.patch('/montadores/:id', adminAuth, async (req, res) => {
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
});

// POST /api/v1/admin/aprovar-montador
router.post('/aprovar-montador', adminAuth, async (req, res) => {
  const { montador_id } = req.body;
  try {
    await prisma.montador.update({
      where: { id: parseInt(montador_id) },
      data: { status: 'aprovado', aprovadoEm: new Date() }
    });
    res.json({ sucesso: true });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao aprovar' });
  }
});

// POST /api/v1/admin/rejeitar-montador
router.post('/rejeitar-montador', adminAuth, async (req, res) => {
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
});

// GET /api/v1/admin/ordens
router.get('/ordens', adminAuth, async (req, res) => {
  const { status, limit } = req.query;
  try {
    const ordens = await prisma.ordemServico.findMany({
      where: status ? { status } : {},
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
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: Number(limit) } : {})
    });
    res.json(ordens.map(mapOs));
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ordens' });
  }
});

// Handler compartilhado para criar OS
const handleCriarOS = async (req, res) => {
  const {
    clienteId,
    cliente_nome,
    clienteNome,
    cliente_contato,
    clienteContato,
    descricao,
    endereco,
    endereco_instalacao,
    lat,
    lng,
    valorBruto,
    valor,
    dataInstalacao,
    data_agendamento,
    raioKm,
    raio_busca,
    tipoProjeto,
    tipo_projeto,
    observacoes,
    cidade,
    estado
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
          data: {
            nome: nomeCliente,
            telefone: contatoCliente || '000000000'
          }
        });
      }
      resolvedClienteId = cliente.id;
    }

    if (!resolvedClienteId) {
      return res.status(400).json({ error: 'clienteId ou cliente_nome sao obrigatorios.' });
    }

    let finalLat = parseFloat(lat) || 0;
    let finalLng = parseFloat(lng) || 0;
    let aviso = null;

    const enderecoFinal = endereco || endereco_instalacao;
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
        console.error('Falha no Nominatim (adminRoutes):', err.message);
        aviso = 'Falha ao buscar coordenadas do endereco.';
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

    let convitesPayload = [];
    const raioFinal = parseFloat(raioKm || raio_busca) || 100;
    if (finalLat !== 0 && finalLng !== 0) {
      const montadores = await prisma.montador.findMany({
        where: {
          status: { in: ['disponivel', 'aprovado'] },
          lat: { not: null },
          lng: { not: null }
        }
      });

      const proximos = montadores
        .map((m) => ({ ...m, distancia: calcularDistancia(finalLat, finalLng, m.lat, m.lng) }))
        .filter((m) => m.distancia <= raioFinal)
        .sort((a, b) => a.distancia - b.distancia)
        .slice(0, 3);

      if (proximos.length === 0) {
        aviso = `Nenhum montador disponivel encontrado num raio de ${raioFinal}km desta localizacao.`;
      }

      const baseUrlFrontend = process.env.CORS_ORIGIN || 'http://localhost:5173';
      const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

      for (const m of proximos) {
        const novoConvite = await prisma.convite.create({
          data: {
            ordemId: os.id,
            montadorId: m.id,
            expiresAt,
            status: 'enviado'
          }
        });

        if (m.deviceId) {
          enviarNotificacao(m.id, { title: 'Novo Convite', body: `${os.descricao}`, data: { url: '/app/convites' } });
        }

        const linkPush = `${baseUrlFrontend}/convite/${novoConvite.id}`;
        const foneLimpo = (m.telefone || '').replace(/\D/g, '');
        const zapMsg = `Ola *${m.nome.split(' ')[0]}*! \nA MontadorPro tem um novo servico proximo a voce!\n\nValor: R$ ${Number(os.valorBruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\nVoce tem 20 minutos para aceitar no link abaixo:\n${linkPush}`;

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
      os: mapOs(os),
      convitesEnviados: convitesPayload.length,
      convites: convitesPayload,
      aviso
    });
  } catch (err) {
    console.error('Erro ao criar OS:', err);
    res.status(500).json({ error: 'Erro ao criar OS', detail: err.message });
  }
};

// POST /api/v1/admin/ordens
router.post('/ordens', adminAuth, handleCriarOS);

// POST /api/v1/admin/criar-os
router.post('/criar-os', adminAuth, handleCriarOS);

// POST /api/v1/admin/convites - Envia convite manual
router.post('/convites', adminAuth, async (req, res) => {
  const { ordemId, montadorId } = req.body;
  try {
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    const convite = await prisma.convite.create({
      data: { ordemId: parseInt(ordemId), montadorId: parseInt(montadorId), expiresAt }
    });
    res.json(convite);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar convite manual' });
  }
});

// GET /api/v1/admin/execucoes
router.get('/execucoes', adminAuth, async (req, res) => {
  try {
    const execucoes = await prisma.execucao.findMany({
      select: {
        id: true,
        ordemId: true,
        montadorId: true,
        status: true,
        chegadaAt: true,
        latChegada: true,
        lngChegada: true,
        conclusaoAt: true,
        createdAt: true,
        fotos: true,
        ordem: {
          select: {
            id: true,
            numero: true,
            descricao: true,
            clienteNome: true,
            clienteContato: true,
            endereco: true,
            valorBruto: true,
            status: true,
            dataInstalacao: true
          }
        },
        montador: {
          select: {
            id: true,
            nome: true,
            telefone: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(execucoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar execucoes' });
  }
});

// POST /api/v1/admin/avaliacoes
router.post('/avaliacoes', adminAuth, async (req, res) => {
  const { ordemId, montadorId, nota, comentario } = req.body;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.avaliacao.create({
        data: { ordemId, montadorId, nota: parseFloat(nota), comentario }
      });

      const avg = await tx.avaliacao.aggregate({
        _avg: { nota: true },
        where: { montadorId }
      });

      await tx.montador.update({
        where: { id: parseInt(montadorId) },
        data: { notaMedia: avg._avg.nota || 5.0 }
      });
    });
    res.json({ message: 'Avaliacao registrada.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar avaliacao' });
  }
});

// POST /api/v1/admin/push/broadcast
router.post('/push/broadcast', adminAuth, async (req, res) => {
  const { title, body } = req.body;
  await broadcast({ title, body });
  res.json({ message: 'Broadcast enviado com sucesso.' });
});

// POST /api/v1/admin/concluir-os
router.post('/concluir-os', adminAuth, async (req, res) => {
  try {
    const { os_id } = req.body;
    if (!os_id) return res.status(400).json({ erro: 'ID nao enviado' });

    /* 
    const execucao = await prisma.execucao.findFirst({
      where: { ordemId: parseInt(os_id) },
      include: { _count: { select: { fotos: true } } }
    });

    if (!execucao || execucao._count.fotos < 4) {
      return res.status(400).json({ erro: 'Fotos do movel obrigatorias (minimo 4).' });
    }
    */

    const result = await prisma.ordemServico.update({
      where: { id: parseInt(os_id) },
      data: { status: 'concluida' }
    });

    res.json({ sucesso: true, os: mapOs(result) });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao concluir OS' });
  }
});

// GET /api/v1/admin/historico - Faturamento global por mes
router.get('/historico', adminAuth, async (req, res) => {
  const { ano } = req.query;
  const targetYear = parseInt(ano || new Date().getFullYear());

  try {
    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    const [ordens, avgRating] = await Promise.all([
      prisma.ordemServico.findMany({
        where: {
          status: 'concluida',
          dataInstalacao: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        select: {
          valorBruto: true,
          dataInstalacao: true
        }
      }),
      prisma.montador.aggregate({
        _avg: { notaMedia: true }
      })
    ]);

    const MESES_NOMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const mesesMap = MESES_NOMES.map((label, i) => ({
      label,
      mes: i + 1,
      valor: 0,
      ordens: 0
    }));

    let totalAnual = 0;
    ordens.forEach(os => {
      const mes = new Date(os.dataInstalacao).getMonth();
      mesesMap[mes].valor += Number(os.valorBruto);
      mesesMap[mes].ordens += 1;
      totalAnual += Number(os.valorBruto);
    });

    res.json({
      meses: mesesMap,
      totalAnual,
      ordensTotal: ordens.length,
      rating: avgRating._avg.notaMedia || 0
    });
  } catch (err) {
    console.error('Erro ao buscar historico administrativo:', err);
    res.status(500).json({ error: 'Erro ao buscar historico de faturamento' });
  }
});

module.exports = router;
