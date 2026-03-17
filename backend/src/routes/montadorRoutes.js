const express = require('express');
const router = express.Router();
const montadorController = require('../controllers/montadorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas do Montador (Autenticado)
router.get('/me', authMiddleware, montadorController.getMe);
router.get('/me/stats', authMiddleware, montadorController.getMeStats);
router.patch('/me', authMiddleware, montadorController.updateMe);
router.patch('/me/status', authMiddleware, montadorController.updateStatus);
router.patch('/location', authMiddleware, montadorController.updateLocation);
router.patch('/me/localizacao', authMiddleware, montadorController.updateLocation); // Alias legacy
router.get('/me/historico', authMiddleware, montadorController.getHistorico);

// Rota Pública de Verificação
router.post('/verificar', montadorController.verificarEmail);

module.exports = router;
