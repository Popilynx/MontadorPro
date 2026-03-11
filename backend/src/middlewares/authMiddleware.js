const { verifyToken } = require('../utils/auth');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    if (!decoded) {
        return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }

    req.montadorId = parseInt(decoded.id);
    req.role = decoded.role;
    next();
};

module.exports = authMiddleware;
