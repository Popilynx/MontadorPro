const prisma = require('../config/db');
const {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} = require('../utils/auth');

const login = async (req, res) => {
    const { telefone, password } = req.body;

    if (!telefone || !password) {
        return res.status(400).json({ error: 'Telefone e password são obrigatórios.' });
    }

    try {
        const montador = await prisma.montador.findUnique({
            where: { telefone }
        });

        // "Timing-safe" approach: return generic error to prevent enumeration
        if (!montador) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const senhaValida = await comparePassword(password, montador.senhaHash);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        // Gerar tokens
        const accessToken = generateAccessToken(montador.id, montador.role);
        const refreshToken = generateRefreshToken(montador.id, montador.role);

        // Salvar refreshToken no banco
        const expiracao = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.refreshToken.create({
            data: {
                token: refreshToken,
                montadorId: parseInt(montador.id),
                expiresAt: expiracao
            }
        });

        // Enviar refreshToken via cookie HTTP-only
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        return res.json({
            accessToken,
            montador: {
                id: montador.id,
                nome: montador.nome,
                telefone: montador.telefone,
                role: montador.role,
                status: montador.status
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const refresh = async (req, res) => {
    const refreshToken = (req.cookies && req.cookies.refreshToken) || req.body.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Nenhum token fornecido.' });
    }

    try {
        const tokenDb = await prisma.refreshToken.findFirst({
            where: {
                token: refreshToken,
                revokedAt: null,
                expiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!tokenDb) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        if (!decoded) {
             return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }
        
        const newAccessToken = generateAccessToken(decoded.id, decoded.role);

        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Erro no refresh:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (refreshToken) {
        await prisma.refreshToken.updateMany({
            where: { token: refreshToken },
            data: { revokedAt: new Date() }
        });
    }
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logout realizado com sucesso.' });
};

module.exports = {
    login,
    refresh,
    logout
};
