const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const conviteController = require('../controllers/conviteController');
const { verifyToken } = require('../utils/auth');

// Middleware admin
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

// Rotas Admin
router.get('/stats', adminAuth, adminController.getStats);
router.get('/montadores', adminAuth, adminController.listMontadores);
router.get('/montadores/:id', adminAuth, adminController.getMontadorById);
router.post('/montadores', adminAuth, adminController.updateMontador); // Reaproveitando para criação/update
router.patch('/montadores/:id', adminAuth, adminController.updateMontador);
router.post('/aprovar-montador', adminAuth, adminController.aprovarMontador);
router.post('/rejeitar-montador', adminAuth, adminController.rejeitarMontador);

router.get('/ordens', adminAuth, adminController.listOrdens);
router.post('/ordens', adminAuth, adminController.criarOrdemServico);
router.post('/criar-os', adminAuth, adminController.criarOrdemServico);
router.post('/concluir-os', adminAuth, adminController.concluirOS);

router.post('/push/broadcast', adminAuth, adminController.broadcast);
router.post('/convites', adminAuth, conviteController.criarConviteAdmin); 
router.get('/historico', adminAuth, adminController.getHistorico);

module.exports = router;
