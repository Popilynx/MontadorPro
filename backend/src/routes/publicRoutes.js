const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Rotas Públicas de Convite
router.get('/convites/:id/detalhes', publicController.getConviteDetalhes);
router.post('/convites/:id/aceitar', publicController.aceitarConvite);
router.post('/convites/:id/recusar', publicController.recusarConvite);

module.exports = router;
