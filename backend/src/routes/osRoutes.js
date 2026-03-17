const express = require('express');
const router = express.Router();
const osController = require('../controllers/osController');
const authMiddleware = require('../middlewares/authMiddleware');
const { z } = require('zod');

const criarOSSchema = z.object({
    cliente_nome: z.string().min(2).optional(),
    clienteNome: z.string().min(2).optional(),
    cliente_contato: z.string().optional(),
    clienteContato: z.string().optional(),
    clienteId: z.preprocess((v) => (v ? Number(v) : undefined), z.number().int().optional()),
    endereco: z.string().min(5).optional(),
    endereco_instalacao: z.string().min(5).optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
    valor: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().positive().optional()),
    valorBruto: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().positive().optional()),
    data_agendamento: z.string().optional(),
    dataInstalacao: z.string().optional(),
    descricao: z.string().optional(),
    tipo_projeto: z.string().optional(),
    tipoProjeto: z.string().optional(),
    observacoes: z.string().optional(),
    lat: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    lng: z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().optional()),
    raioKm: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional()),
    raio_busca: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional())
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        return res.status(400).json({ error: 'Dados invalidos', detalhes: result.error.flatten().fieldErrors });
    }
    req.body = result.data;
    next();
};

// Rotas OS
router.get('/', authMiddleware, osController.listOS);
router.post('/', authMiddleware, validate(criarOSSchema), osController.criarOS);
router.get('/stats/dashboard', authMiddleware, osController.getDashboardStats);
router.get('/:id', authMiddleware, osController.getOSById);
router.patch('/:id/status', authMiddleware, osController.updateOSStatus);

module.exports = router;
