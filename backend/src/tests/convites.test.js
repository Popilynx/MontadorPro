const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

jest.mock('../config/db', () => ({
  query: jest.fn()
}));

jest.mock('../middlewares/authMiddleware', () => (req, res, next) => {
  req.montadorId = 1;
  next();
});

jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const mockConvite = {
  id: 'uuid-1234',
  ordemServicoId: '101',
  montadorId: '1',
  status: 'PENDENTE',
  expiracaoAt: new Date(Date.now() + 100000).toISOString(),
  valor: 250.00
};

describe('Convites Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('GET /api/convites - deve listar convites pendentes do montador logado', async () => {
    db.query.mockResolvedValue({ rows: [mockConvite] });

    const res = await request(app).get('/api/convites');

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toHaveProperty('id', 'uuid-1234');
    expect(res.body[0]).toHaveProperty('status', 'PENDENTE');
  });

  it('POST /api/convites/:id/responder - deve aceitar um convite', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockConvite] }) // SELECT convite
      .mockResolvedValueOnce({}) // UPDATE convite status 'ACEITO'
      .mockResolvedValueOnce({}); // UPDATE OS status 'ACEITA' e montador_id

    const res = await request(app)
      .post('/api/convites/uuid-1234/responder')
      .send({ acao: 'ACEITAR' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Convite aceito com sucesso.');
  });

  it('POST /api/convites/:id/responder - deve bloquear ação inválida', async () => {
    const res = await request(app)
      .post('/api/convites/uuid-1234/responder')
      .send({ acao: 'AÇÃO_ESTRANHA' });

    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('Ação inválida');
  });

  it('POST /api/convites/:id/finalizar - deve finalizar a OS', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [mockConvite] }) // SELECT convite
      .mockResolvedValueOnce({}); // UPDATE OS 'CONCLUIDA'

    const res = await request(app)
      .post('/api/convites/uuid-1234/finalizar')
      .send({ nota: 5, observacao: 'Tudo certo!' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'OS finalizada com sucesso!');
  });
});
