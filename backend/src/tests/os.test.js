const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

// Mock do middleware de auth para passar direto nos testes
jest.mock('../middlewares/authMiddleware', () => (req, res, next) => {
  req.montadorId = 1;
  next();
});

const mockOS = {
  id: 101,
  cliente_nome: 'João Teste',
  endereco: 'Rua do Teste, 123',
  status: 'DISPONIVEL',
  valor: 250.00
};

describe('OS Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/os - deve listar ordens de serviço', async () => {
    db.query.mockResolvedValueOnce({ rows: [mockOS] }); // resultado ordens
    db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] }); // resultado count

    const res = await request(app).get('/api/os');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('ordens');
    expect(res.body.ordens).toHaveLength(1);
    expect(res.body.total).toEqual(1);
  });

  it('POST /api/os - deve criar uma OS com dados válidos', async () => {
    db.query.mockResolvedValue({ rows: [mockOS] });

    const res = await request(app)
      .post('/api/os')
      .send({
        cliente_nome: 'João Teste',
        endereco: 'Rua do Teste, 123',
        valor: 250.00
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('cliente_nome', 'João Teste');
  });

  it('POST /api/os - deve bloquear OS com valor negativo (Zod Validator)', async () => {
    const res = await request(app)
      .post('/api/os')
      .send({
        cliente_nome: 'João Teste',
        endereco: 'Rua do Teste, 123',
        valor: -50.00
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body).toHaveProperty('error', 'Dados inválidos');
    expect(res.body.detalhes).toHaveProperty('valor'); // Exige que o Zod pegue o erro de valor
  });

  it('PATCH /api/os/:id/status - deve atualizar status de OS', async () => {
    db.query.mockResolvedValue({ rows: [{ ...mockOS, status: 'CONCLUIDA' }] });

    const res = await request(app)
      .patch('/api/os/101/status')
      .send({ status: 'CONCLUIDA' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'CONCLUIDA');
  });

  it('PATCH /api/os/:id/status - deve bloquear status inválido', async () => {
    const res = await request(app)
      .patch('/api/os/101/status')
      .send({ status: 'STATUS_LOUCO' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Status inválido');
  });
});
