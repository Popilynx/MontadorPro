const prisma = require('../config/db');
const {
    comparePassword,
    hashPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyToken
} = require('../utils/auth');

const register = async (req, res) => {
    const { 
        nome, telefone, cpf, email, senha, latitude, longitude,
        rg, nascimento, cep, endereco, estado, cidade, 
        nivelExperiencia, anosExperiencia, cnpjStatus, cnpj, avaliacao_cliente, 
        disponibilidade, origem,
        especialidades, ferramentas, referencias,
        docRg, docCpf, docComprovante, docFoto, docAntecedente, docPortfolio
    } = req.body;

    const ipOrigem = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!nome || !telefone || !cpf || !senha) {
        return res.status(400).json({ error: 'Nome, telefone, cpf e senha são obrigatórios.' });
    }

    const telefoneSanitizado = telefone.replace(/\D/g, '');

    try {
        const montadorExistente = await prisma.montador.findFirst({
            where: {
                OR: [
                    { telefone: telefoneSanitizado },
                    { cpf },
                    { email: email || undefined } // Se for undefined ele ignora email nas buscas com or
                ].filter(condition => Object.values(condition)[0] !== undefined)
            }
        });

        if (montadorExistente) {
            return res.status(400).json({ error: 'Telefone, CPF ou E-mail já cadastrado.' });
        }

        const senhaHash = await hashPassword(senha);
        
        let lat = latitude ? parseFloat(latitude) : null;
        let lng = longitude ? parseFloat(longitude) : null;

        // Fallback geolocalização com Nominatim se latitude/longitude forem vazias
        if ((!lat || !lng) && cidade && estado) {
            try {
                const query = encodeURIComponent(`${cidade}, ${estado}, Brasil`);
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
                    headers: { 'User-Agent': 'MontadorProApp/1.0' }
                });
                const data = await response.json();
                if (data && data.length > 0) {
                    lat = parseFloat(data[0].lat);
                    lng = parseFloat(data[0].lon);
                    console.log(`Fallback GPS Nominatim: ${cidade} -> ${lat}, ${lng}`);
                }
            } catch (err) {
                console.error('Erro na API Nominatim fallback:', err);
            }
        }

        const novoMontador = await prisma.montador.create({
            data: {
                nome,
                telefone: telefoneSanitizado,
                cpf,
                email,
                senhaHash,
                lat,
                lng,
                rg,
                nascimento: nascimento ? new Date(nascimento) : null,
                cep,
                endereco,
                estado,
                cidade,
                ipOrigem,
                nivelExperiencia,
                anosExperiencia,
                cnpjStatus,
                cnpj,
                disponibilidade,
                origem,
                especialidades: especialidades || [],
                ferramentas,
                referencias,
                docRg,
                docCpf,
                docComprovante,
                docFoto,
                docAntecedente,
                docPortfolio: docPortfolio || [],
                status: 'pendente' // Padrão é pendente para aprovação admin
            }
        });

        // Opcional: Enviar e-mail de verificação aqui
        // if (email) await sendVerificationEmail(...)

        res.status(201).json({ 
            message: 'Cadastro recebido com sucesso. Aguarde aprovação.',
            montadorId: novoMontador.id 
        });

    } catch (error) {
        console.error('Erro no cadastro:', error);
        return res.status(500).json({ error: 'Erro interno ao tentar cadastrar.' });
    }
};

const login = async (req, res) => {
    const { telefone, password } = req.body;
    const credencial = telefone;
    const isEmail = (credencial || '').includes('@');
    const valorTratado = isEmail ? credencial.toLowerCase().trim() : credencial.replace(/\D/g, '');

    if (!credencial || !password) {
        return res.status(400).json({ error: 'Credencial e password são obrigatórios.' });
    }

    try {
        const montador = await prisma.montador.findFirst({
            where: {
                OR: [
                    { telefone: isEmail ? undefined : valorTratado },
                    { email: isEmail ? valorTratado : undefined }
                ].filter(Boolean)
            }
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
    register,
    refresh,
    logout
};
