const express = require('express');
const router = express.Router();
const prisma = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { estaNoRaio } = require('../utils/geoUtils');

// Configuração do Multer para Fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'os-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const maxFotoMb = parseInt(process.env.MAX_FOTO_MB || '5', 10);
const upload = multer({ 
  storage: storage,
  limits: { fileSize: maxFotoMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Formato de arquivo nao permitido.'));
    }
    cb(null, true);
  }
});

// ─── GET /api/v1/execucao/ativa — Execução ativa com dados da OS ─────────
router.get('/ativa', authMiddleware, async (req, res) => {
  try {
    const execucao = await prisma.execucao.findFirst({
      where: {
        montadorId: parseInt(req.montadorId),
        status: 'em_andamento'
      },
      include: {
        ordem: { include: { cliente: true } },
        fotos: true
      }
    });

    if (!execucao) return res.json(null);

    res.json(execucao);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar execução ativa' });
  }
});

// ─── POST /api/v1/execucao/chegada — Valida GPS e horário ──────────────────
router.post('/chegada', authMiddleware, async (req, res) => {
  const { osId, lat, lng } = req.body;
  if (!osId || !lat || !lng) return res.status(400).json({ error: 'Dados incompletos.' });

  try {
    const os = await prisma.ordemServico.findUnique({ where: { id: parseInt(osId) } });
    if (!os) return res.status(404).json({ error: 'OS não encontrada.' });

    // Validação de Janela de Tempo (±15 minutos do agendado) conforme doc_text.txt
    const agora = new Date();
    const agendado = new Date(os.dataInstalacao);
    const diffMinutos = Math.abs((agora - agendado) / 1000 / 60);
    
    if (diffMinutos > 30) {
      return res.status(403).json({ 
        error: `Fora da janela de tempo. Seu agendamento é às ${agendado.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.` 
      });
    }

    // Validação geográfica (200m)
    if (!estaNoRaio(lat, lng, os.lat, os.lng, 200)) {
      return res.status(403).json({ error: 'Distância superior a 200m do local.' });
    }

    // Atualizar execução
    await prisma.execucao.updateMany({
      where: { ordemId: parseInt(osId), montadorId: parseInt(req.montadorId), status: 'em_andamento' },
      data: { chegadaAt: new Date(), latChegada: lat, lngChegada: lng }
    });

    res.json({ message: 'Chegada confirmada.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao confirmar chegada.' });
  }
});

// ─── POST /api/v1/execucao/:id/fotos — Upload de fotos ───────────────────
router.post('/:id/fotos', authMiddleware, upload.array('fotos', 10), async (req, res) => {
  try {
    const execucao = await prisma.execucao.findFirst({
      where: { ordemId: parseInt(req.params.id), montadorId: parseInt(req.montadorId), status: 'em_andamento' }
    });

    if (!execucao) return res.status(404).json({ error: 'Execução não encontrada.' });

    const fotos = await Promise.all(req.files.map(file => {
      return prisma.foto.create({
        data: { execucaoId: execucao.id, url: `/uploads/${file.filename}`, tipo: 'instalação' }
      });
    }));

    res.json({ message: 'Fotos enviadas.', count: fotos.length });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao enviar fotos.' });
  }
});

// ─── POST /api/v1/execucao/:id/finalizar ──────────────────────────────────
router.post('/:id/finalizar', authMiddleware, async (req, res) => {
  const { nota, observacao } = req.body;

  try {
    // Validar mínimo de fotos (ex: 4 conforme doc)
    const execucao = await prisma.execucao.findFirst({
      where: { 
        ordemId: parseInt(req.params.id), 
        montadorId: parseInt(req.montadorId),
        status: 'em_andamento'
      },
      include: { _count: { select: { fotos: true } } }
    });

    if (!execucao) {
      return res.status(404).json({ error: 'Execução ativa não encontrada.' });
    }

    if (execucao._count.fotos < 4) {
      return res.status(400).json({ error: 'Mínimo de 4 fotos obrigatório.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Atualizar status da Ordem
      await tx.ordemServico.update({ 
        where: { id: parseInt(req.params.id) }, 
        data: { status: 'concluida' } 
      });

      // 2. Atualizar status da Execução
      await tx.execucao.update({
        where: { id: execucao.id },
        data: { 
          status: 'concluida', 
          conclusaoAt: new Date() 
        }
      });

      // 3. Criar Avaliação (Tratamento)
      if (nota !== undefined) {
        await tx.avaliacao.create({
          data: {
            ordemId: parseInt(req.params.id),
            montadorId: parseInt(req.montadorId),
            nota: parseInt(nota),
            comentario: observacao || ''
          }
        });
      }
    });

    res.json({ message: 'Serviço finalizado com sucesso!' });
  } catch (err) {
    console.error('Erro ao finalizar OS:', err);
    res.status(500).json({ error: 'Erro ao finalizar serviço.' });
  }
});


module.exports = router;
