const express = require('express');
const router = express.Router();
const conviteController = require('../controllers/conviteController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas de Convite (Autenticado)
router.get('/ativo', authMiddleware, conviteController.getMeusConvites);
router.post('/:id/aceitar', authMiddleware, conviteController.aceitarConvite);
router.post('/:id/recusar', authMiddleware, conviteController.recusarConvite);
router.post('/:id/finalizar', authMiddleware, conviteController.finalizarLegacy); // Legado compatibilidade

module.exports = router;
