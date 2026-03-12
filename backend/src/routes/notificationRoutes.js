const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/subscribe', authMiddleware, notificationController.subscribe);
router.post('/unsubscribe', authMiddleware, notificationController.unsubscribe);
router.get('/vapid-public-key', notificationController.getPublicKey);

module.exports = router;
