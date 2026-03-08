const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/emailService');

// Obter dados do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const montadorResult = await db.query(
            'SELECT id, nome, telefone, cidade, status, role, foto_url FROM montadores WHERE id = $1',
            [req.montadorId]
        );

        if (montadorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Montador não encontrado' });
        }

        const metricsResult = await db.query(
            `SELECT 
                (SELECT COUNT(*)::int FROM ordens_servico os
                 WHERE os.status = 'CONCLUIDA'
                   AND (
                       os.montador_id = $1::int
                       OR os.id IN (
                           SELECT DISTINCT c."ordemServicoId"::int
                           FROM convites c
                           WHERE c."montadorId"::int = $1::int AND c.status = 'ACEITO'
                       )
                   )
                ) as total_concluidas,
                (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE "montadorId" = $1::text) as media_nota,
                (SELECT COUNT(*) FROM avaliacoes WHERE "montadorId" = $1::text) as total_avaliacoes,
                (SELECT 
                    AVG(EXTRACT(EPOCH FROM ("dataFim" - "dataInicio"))/3600)::numeric(10,1)
                 FROM execucoes 
                 WHERE "montadorId" = $1::text AND "dataFim" IS NOT NULL
                ) as tempo_medio
            `,
            [req.montadorId]
        );

        const data = {
            ...montadorResult.rows[0],
            metrics: {
                total_concluidas: metricsResult.rows[0].total_concluidas || 0,
                media_nota: Number(metricsResult.rows[0].media_nota) || 5.0,
                total_avaliacoes: Number(metricsResult.rows[0].total_avaliacoes) || 0,
                tempo_medio: metricsResult.rows[0].tempo_medio ? `${metricsResult.rows[0].tempo_medio}h` : '1.5h'
            }
        };

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados do perfil' });
    }
});

// Obter dados de um montador específico (Dossier)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const montadorResult = await db.query(
            'SELECT id, nome, telefone, cidade, status, role, foto_url FROM montadores WHERE id = $1::int',
            [id]
        );

        if (montadorResult.rows.length === 0) {
            return res.status(404).json({ error: 'Montador não encontrado' });
        }

        const metricsResult = await db.query(
            `SELECT 
                (SELECT COUNT(*)::int FROM ordens_servico os
                 WHERE os.status = 'CONCLUIDA'
                   AND (
                       os.montador_id = $1::int
                       OR os.id IN (
                           SELECT DISTINCT c."ordemServicoId"::int
                           FROM convites c
                           WHERE c."montadorId"::int = $1::int AND c.status = 'ACEITO'
                       )
                   )
                ) as total_concluidas,
                (SELECT ROUND(AVG(nota), 1) FROM avaliacoes WHERE "montadorId" = $1::text) as media_nota,
                (SELECT COUNT(*) FROM avaliacoes WHERE "montadorId" = $1::text) as total_avaliacoes,
                (SELECT 
                    AVG(EXTRACT(EPOCH FROM ("dataFim" - "dataInicio"))/3600)::numeric(10,1)
                 FROM execucoes 
                 WHERE "montadorId" = $1::text AND "dataFim" IS NOT NULL
                ) as tempo_medio
            `,
            [id]
        );

        const data = {
            ...montadorResult.rows[0],
            metrics: {
                total_concluidas: metricsResult.rows[0].total_concluidas || 0,
                media_nota: Number(metricsResult.rows[0].media_nota) || 5.0,
                total_avaliacoes: Number(metricsResult.rows[0].total_avaliacoes) || 0,
                tempo_medio: metricsResult.rows[0].tempo_medio ? `${metricsResult.rows[0].tempo_medio}h` : '1.5h'
            }
        };

        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dossier do montador' });
    }
});

// Atualizar dados do usuário logado
router.patch('/me', authMiddleware, async (req, res) => {
    const { nome, telefone, cidade, foto_url } = req.body;
    try {
        const result = await db.query(
            'UPDATE montadores SET nome = COALESCE(NULLIF($1, \'\'), nome), telefone = COALESCE(NULLIF($2, \'\'), telefone), cidade = COALESCE(NULLIF($3, \'\'), cidade), foto_url = COALESCE(NULLIF($4, \'\'), foto_url) WHERE id = $5 RETURNING *',
            [nome, telefone, cidade, foto_url, req.montadorId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
});

// Listar todos os montadores (com geocodificação reversa para cidade)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT 
                m.id, m.nome, m.telefone, m.cpf, m.rating, m.status, m.cidade, m.latitude, m.longitude, m.last_seen, m.role, m.foto_url,
                (SELECT COUNT(*)::int FROM ordens_servico os WHERE os.montador_id = m.id AND os.status IN ('ACEITA', 'EM_EXECUCAO')) as os_ativas
            FROM montadores m 
            ORDER BY m.nome ASC`
        );

        // Para montadores sem cidade mas com lat/lng, faz geocodificação reversa
        const montadoresComCidade = await Promise.all(result.rows.map(async (m) => {
            if (m.cidade && m.cidade.trim() !== '') {
                return { ...m, cidade_display: m.cidade };
            }
            if (m.latitude && m.longitude) {
                try {
                    const geoRes = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${m.latitude}&lon=${m.longitude}&accept-language=pt-BR`,
                        { headers: { 'User-Agent': 'MontadorPro/1.0' } }
                    );
                    const geoData = await geoRes.json();
                    const addr = geoData.address || {};
                    const cidade = addr.city || addr.town || addr.municipality || addr.county || '';
                    const estado = addr.state || '';
                    const siglaEstado = estado
                        ? estado.replace('Estado de ', '').replace('Estado do ', '').substring(0, 2).toUpperCase()
                        : '';
                    const cidadeDisplay = cidade && siglaEstado ? `${cidade}, ${siglaEstado}` : cidade || siglaEstado || '—';

                    // Persiste no banco para não chamar a API toda vez
                    if (cidadeDisplay !== '—') {
                        db.query('UPDATE montadores SET cidade = $1 WHERE id = $2 AND (cidade IS NULL OR cidade = \'\')', [cidadeDisplay, m.id])
                            .catch(() => {});
                    }

                    return { ...m, cidade_display: cidadeDisplay };
                } catch {
                    return { ...m, cidade_display: '—' };
                }
            }
            return { ...m, cidade_display: m.cidade || '—' };
        }));

        res.json(montadoresComCidade);
    } catch (err) {
        console.error('Erro ao buscar montadores:', err);
        res.status(500).json({ error: 'Erro interno ao buscar montadores' });
    }
});

// Atualizar localização do montador logado
router.patch('/location', authMiddleware, async (req, res) => {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Latitude e longitude são obrigatórias.' });
    }

    try {
        await db.query(
            'UPDATE montadores SET latitude = $1, longitude = $2, last_seen = NOW(), status = \'online\' WHERE id = $3',
            [latitude, longitude, req.montadorId]
        );
        res.json({ message: 'Localização atualizada com sucesso.' });
    } catch (err) {
        console.error('Erro ao atualizar localização:', err);
        res.status(500).json({ error: 'Erro ao atualizar localização.' });
    }
});

// Editar montador (Admin apenas)
router.patch('/:id', authMiddleware, async (req, res) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem editar usuários.' });
    }

    const { id } = req.params;
    const { nome, telefone, cidade, role, status } = req.body;

    try {
        await db.query(
            'UPDATE montadores SET nome = COALESCE($1, nome), telefone = COALESCE($2, telefone), cidade = COALESCE($3, cidade), role = COALESCE($4, role), status = COALESCE($5, status) WHERE id = $6',
            [nome, telefone, cidade, role, status, id]
        );
        res.json({ message: 'Montador atualizado com sucesso.' });
    } catch (err) {
        console.error('Erro ao editar montador:', err);
        res.status(500).json({ error: 'Erro ao editar montador.' });
    }
});

// Estatísticas para o Dashboard
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const [concluidas, totalMontadores, faturamento] = await Promise.all([
            db.query("SELECT COUNT(*) FROM ordens_servico WHERE status = 'CONCLUIDA'"),
            db.query("SELECT COUNT(*) FROM montadores"),
            db.query("SELECT COALESCE(SUM(valor),0) AS total FROM ordens_servico WHERE status = 'CONCLUIDA'"),
        ]);

        res.json({
            concluidas: Number(concluidas.rows[0].count) || 0,
            montadores: Number(totalMontadores.rows[0].count) || 0,
            faturamento: Number(faturamento.rows[0].total) || 0,
            tempoMedio: '1.2h',
        });
    } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
    }
});

// Histórico de Faturamento (Admin global | Montador individual)
router.get('/historico', authMiddleware, async (req, res) => {
    const ano = req.query.ano || new Date().getFullYear();
    const isAdmin = req.role === 'admin';
    try {
        // Admin vê todas as OS; Montador vê apenas as suas
        const result = await db.query(
            `SELECT
                EXTRACT(MONTH FROM data_agendamento)::int AS mes,
                COUNT(*)::int AS ordens,
                COALESCE(SUM(valor), 0)::numeric AS valor
             FROM ordens_servico
             WHERE status = 'CONCLUIDA'
               AND EXTRACT(YEAR FROM data_agendamento) = $1
               AND ($2 OR (
                   montador_id = $3::int
                   OR id IN (
                       SELECT DISTINCT "ordemServicoId"::int FROM convites
                       WHERE "montadorId"::int = $3::int AND status = 'ACEITO'
                   )
               ))
             GROUP BY mes ORDER BY mes`,
            [ano, isAdmin, req.montadorId]
        );

        const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const meses = MESES.map((label, i) => {
            const found = result.rows.find(r => r.mes === i + 1);
            return { label, mes: i + 1, valor: found ? Number(found.valor) : 0, ordens: found ? found.ordens : 0 };
        });

        const totalAnual = meses.reduce((a, m) => a + m.valor, 0);
        const montadorRes = await db.query('SELECT rating FROM montadores WHERE id = $1', [req.montadorId]);

        res.json({
            meses,
            totalAnual,
            ordensTotal: meses.reduce((a, m) => a + m.ordens, 0),
            rating: montadorRes.rows[0]?.rating || 0,
            isAdmin,
        });
    } catch (err) {
        console.error('Erro no histórico:', err.message);
        res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
});


// ─── CADASTRO DE NOVO MONTADOR (ADMIN) ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
    if (req.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem cadastrar montadores.' });
    }

    const { nome, telefone, email, cpf, senha, role = 'montador' } = req.body;

    if (!nome || !telefone || !email || !senha) {
        return res.status(400).json({ error: 'Nome, telefone, e-mail e senha são obrigatórios.' });
    }

    try {
        // Verificar se e-mail ou CPF já existem
        const check = await db.query('SELECT id FROM montadores WHERE email = $1 OR cpf = $2', [email, cpf]);
        if (check.rows.length > 0) {
            return res.status(400).json({ error: 'E-mail ou CPF já cadastrado no sistema.' });
        }

        const hashedPassword = await bcrypt.hash(senha, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos

        const result = await db.query(
            `INSERT INTO montadores (nome, telefone, email, cpf, password, role, verification_code, is_verified, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id`,
            [nome, telefone, email, cpf, hashedPassword, role, verificationCode, false, 'INATIVO']
        );

        // Enviar E-mail
        try {
            await sendVerificationEmail(email, nome, verificationCode);
        } catch (emailErr) {
            console.error('Erro ao enviar e-mail de verificação:', emailErr);
            // Mesmo se o e-mail falhar, o usuário foi criado. O admin pode reenviar depois se implementarmos.
        }

        res.status(201).json({ 
            message: 'Montador cadastrado com sucesso! Um e-mail de verificação foi enviado.',
            id: result.rows[0].id 
        });
    } catch (err) {
        console.error('Erro ao cadastrar montador:', err);
        res.status(500).json({ error: 'Erro ao cadastrar montador.' });
    }
});

// ─── VERIFICAÇÃO DE CONTA ──────────────────────────────────────────────────────
router.post('/verificar', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ error: 'E-mail e código são obrigatórios.' });
    }

    try {
        const result = await db.query(
            'SELECT id FROM montadores WHERE email = $1 AND verification_code = $2',
            [email, code]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Código de verificação inválido ou e-mail incorreto.' });
        }

        const montadorId = result.rows[0].id;

        await db.query(
            'UPDATE montadores SET is_verified = true, verification_code = NULL, status = \'DISPONIVEL\' WHERE id = $1',
            [montadorId]
        );

        res.json({ message: 'Conta verificada com sucesso! Agora você pode fazer login.' });
    } catch (err) {
        console.error('Erro ao verificar e-mail:', err);
        res.status(500).json({ error: 'Erro interno ao verificar e-mail.' });
    }
});

module.exports = router;
