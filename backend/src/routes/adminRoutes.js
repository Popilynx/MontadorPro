const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const { enviarNotificacao, broadcast } = require('../services/pushService');
const { emailConvite } = require('../utils/email');
const { sendVerificationEmail } = require('../services/emailService');
const { calcularDistancia } = require('../utils/geoUtils');
const { hashPassword } = require('../utils/auth');

const { verifyToken } = require('../utils/auth');

// Middleware que aceita ou x-admin-secret ou Token JWT com role 'admin'
const adminAuth = (req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  
  // 1. Se tiver o segredo correto, passa direto
  if (secret === process.env.ADMIN_SECRET) {
    return next();
  }

  // 2. Se não tiver segredo, tenta validar via Token JWT
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);
    
    if (decoded && decoded.role === 'admin') {
      req.montadorId = parseInt(decoded.id);
      req.role = decoded.role;
      return next();
    }
  }

  return res.status(403).json({ error: 'Acesso negado. Requer privilégios de administrador ou secret válido.' });
};

// GET /api/v1/admin/stats — Dashboard stats
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

// GET /api/v1/admin/montadores — Lista montadores
router.get('/montadores', adminAuth, async (req, res) => {
  try {
    const montadores = await prisma.montador.findMany({
      orderBy: { nome: 'asc' }
    });
    // Map fotoUrl to foto_url for frontend compatibility
    const mapped = montadores.map(m => {
      const { fotoUrl, ...rest } = m;
      return { ...rest, foto_url: fotoUrl };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar montadores' });
  }
});

// POST /api/v1/admin/montadores — Cria montador
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

    res.status(201).json(montador);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar montador' });
  }
});

// PATCH /api/v1/admin/montadores/:id — Aprova/Rejeita/Ativa/Desativa
router.patch('/montadores/:id', adminAuth, async (req, res) => {
  const { status } = req.body;
  try {
    const montador = await prisma.montador.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });

    if (status === 'disponivel') {
      // Opcional: Enviar email avisando que a conta foi ativada (se já verificou email)
      // ou redirecionar para fluxo de verificação se necessário.
    }

    res.json(montador);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar montador' });
  }
});

// GET /api/v1/admin/ordens — Lista OS com filtro
router.get('/ordens', adminAuth, async (req, res) => {
  const { status } = req.query;
  try {
    const ordens = await prisma.ordemServico.findMany({
      where: status ? { status } : {},
      include: { cliente: true, montador: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(ordens);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ordens' });
  }
});

// POST /api/v1/admin/ordens — Cria OS e envia convites automáticos
router.post('/ordens', adminAuth, async (req, res) => {
  const { clienteId, descricao, endereco, lat, lng, valorBruto, dataInstalacao, raioKm = 20 } = req.body;
  try {
    const os = await prisma.ordemServico.create({
      data: {
        numero: `OS-${Date.now().toString().slice(-6)}`,
        descricao,
        endereco,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        valorBruto: parseFloat(valorBruto),
        dataInstalacao: new Date(dataInstalacao),
        clienteId,
        status: 'pendente'
      }
    });

    const montadores = await prisma.montador.findMany({ where: { status: 'disponivel' } });
    const proximos = montadores
      .map(m => ({ ...m, distancia: calcularDistancia(lat, lng, m.lat, m.lng) }))
      .filter(m => m.distancia <= raioKm)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, 3);

    const expiresAt = new Date(Date.now() + 20 * 60 * 1000); 
    for (const m of proximos) {
      await prisma.convite.create({ data: { ordemId: os.id, montadorId: m.id, expiresAt } });
      enviarNotificacao(m.id, { title: 'Novo Convite', body: `${os.descricao}`, data: { url: '/app/convites' } });
      if (m.email) emailConvite({ para: m.email, nomeMontador: m.nome, descricao: os.descricao, endereco: os.endereco, data: os.dataInstalacao.toLocaleDateString('pt-BR'), valor: os.valorBruto, linkApp: process.env.APP_URL || '' });
    }

    res.status(201).json({ os, convitesEnviados: proximos.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar OS' });
  }
});

// POST /api/v1/admin/convites — Envia convite manual
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

// GET /api/v1/admin/execucoes — Lista execuções com fotos
router.get('/execucoes', adminAuth, async (req, res) => {
  try {
    const execucoes = await prisma.execucao.findMany({
      include: { ordem: true, montador: true, fotos: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(execucoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar execuções' });
  }
});

// POST /api/v1/admin/avaliacoes — Avalia serviço e recalcula nota
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
    res.json({ message: 'Avaliação registrada.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar avaliação' });
  }
});

// POST /api/v1/admin/push/broadcast
router.post('/push/broadcast', adminAuth, async (req, res) => {
  const { title, body } = req.body;
  await broadcast({ title, body });
  res.json({ message: 'Broadcast enviado com sucesso.' });
});


// GET /api/v1/admin/historico — Faturamento global por mês e métricas anuais
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

    // Agrupar por mês
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
    console.error('Erro ao buscar histórico administrativo:', err);
    res.status(500).json({ error: 'Erro ao buscar histórico de faturamento' });
  }
});

module.exports = router;
