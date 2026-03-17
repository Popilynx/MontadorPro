const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Limite de 20 requisições por 15 minutos para login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' }
});

// Limite de 50 cadastros por 1 hora
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, 
    max: 50, 
    message: { error: 'Muitos cadastros a partir deste IP. Tente novamente mais tarde.' }
});

router.post('/login', loginLimiter, authController.login);
router.post('/register', registerLimiter, authController.register);
router.get('/verify', authController.verifyEmail);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);

module.exports = router;
