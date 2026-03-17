const express = require('express');
const router = express.Router();
const execucaoController = require('../controllers/execucaoController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Rotas de Execução
router.get('/ativa', authMiddleware, execucaoController.getAtiva);
router.post('/chegada', authMiddleware, execucaoController.iniciarChegada);
router.post('/:id/fotos', authMiddleware, upload.array('fotos', 10), execucaoController.uploadFotos);
router.post('/:id/finalizar', authMiddleware, execucaoController.finalizarExecucao);

module.exports = router;
