process.env.JWT_SECRET = 'test_jwt_secret_123';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_123';

const request = require('supertest');
const app = require('../app');
const db = require('../config/db');

// Mock do banco de dados
jest.mock('../config/db', () => ({
  query: jest.fn()
}));

const mockMontador = {
  id: 1,
  nome: 'Montador Teste',
  cpf: '123.456.789-00',
  telefone: '(11) 99999-9999',
  password: 'hashedpassword',
  status: 'online',
  cidade: 'São Paulo'
};

describe('Auth Endpoints', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /api/auth/login - deve realizar o login com credenciais válidas', async () => {
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
    db.query.mockResolvedValue({ rows: [mockMontador] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ telefone: mockMontador.telefone, senha: 'password123' });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.montador).toHaveProperty('nome', 'Montador Teste');
  });

  it('POST /api/auth/login - deve falhar com senha incorreta', async () => {
    const bcrypt = require('bcrypt');
    jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
    
    db.query.mockResolvedValue({ rows: [mockMontador] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ telefone: mockMontador.telefone, senha: 'wrongpassword' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
  });


  it('POST /api/auth/login - deve falhar com telefone não encontrado', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ telefone: '(00) 00000-0000', senha: 'password123' });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('error', 'Credenciais inválidas.');
  });

  it('POST /api/auth/logout - deve limpar cookies de auth', async () => {
    db.query.mockResolvedValue({ rows: [] }); // Simula update do revoke

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refreshToken=sometoken']);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Logout realizado com sucesso.');
    // Verifica se os cookies foram limpos nos headers
    const setCookie = res.headers['set-cookie'].join(',');
    expect(setCookie).toMatch(/refreshToken=;/);
  });
});
