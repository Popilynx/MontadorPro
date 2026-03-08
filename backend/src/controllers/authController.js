const db = require('../config/db');
const {
    comparePassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} = require('../utils/auth');
const crypto = require('crypto');

const login = async (req, res) => {
    const { telefone, senha } = req.body;

    if (!telefone || !senha) {
        return res.status(400).json({ error: 'Telefone e senha são obrigatórios.' });
    }

    try {
        const result = await db.query(
            'SELECT * FROM "montadores" WHERE "telefone" = $1',
            [telefone]
        );

        const montador = result.rows[0];

        if (!montador) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const senhaValida = await comparePassword(senha, montador.password);
        if (!senhaValida) {
            return res.status(401).json({ error: 'Credenciais inválidas.' });
        }

        const accessToken = generateAccessToken(montador.id, montador.role);
        const refreshToken = generateRefreshToken(montador.id, montador.role);

        // Salvar refreshToken no banco
        const expiracao = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await db.query(
            'INSERT INTO "refresh_tokens" (id, token, "montadorId", "expiracaoAt") VALUES ($1, $2, $3, $4)',
            [crypto.randomUUID(), refreshToken, montador.id, expiracao]
        );

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
                status: montador.status,
                role: montador.role
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
        const result = await db.query(
            'SELECT * FROM "refresh_tokens" WHERE token = $1 AND revogado = false AND "expiracaoAt" > NOW()',
            [refreshToken]
        );

        const tokenDb = result.rows[0];

        if (!tokenDb) {
            return res.status(401).json({ error: 'Token inválido ou expirado.' });
        }

        const { id, role } = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
        const newAccessToken = generateAccessToken(id, role);

        return res.json({ accessToken: newAccessToken });
    } catch (error) {
        console.error('Erro no refresh:', error);
        return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (refreshToken) {
        await db.query(
            'UPDATE "refresh_tokens" SET revogado = true WHERE token = $1',
            [refreshToken]
        );
    }
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logout realizado com sucesso.' });
};

module.exports = {
    login,
    refresh,
    logout
};
