require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.POSTGRES_DIRECT_URL || process.env.POSTGRES_POOL_URL });

const sql = `
-- Ordens de Serviço
CREATE TABLE IF NOT EXISTS ordens_servico (
    id             SERIAL PRIMARY KEY,
    cliente        VARCHAR(255) NOT NULL,
    descricao      TEXT NOT NULL,
    endereco       TEXT NOT NULL,
    valor          NUMERIC(10,2) NOT NULL DEFAULT 0,
    data_planejada DATE,
    itens          JSONB DEFAULT '[]',
    status         VARCHAR(50) NOT NULL DEFAULT 'DISPONIVEL',
    montador_id    INTEGER,
    criado_por     INTEGER,
    created_at     TIMESTAMP DEFAULT NOW(),
    updated_at     TIMESTAMP DEFAULT NOW()
);

-- Convites
CREATE TABLE IF NOT EXISTS convites (
    id          SERIAL PRIMARY KEY,
    os_id       INTEGER NOT NULL,
    montador_id INTEGER NOT NULL,
    status      VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
    expira_em   TIMESTAMP NOT NULL,
    nota_auto   NUMERIC(3,1),
    observacao  TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Fotos das OS
CREATE TABLE IF NOT EXISTS fotos_os (
    id          SERIAL PRIMARY KEY,
    os_id       INTEGER NOT NULL,
    url         TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Histórico de Ganhos
CREATE TABLE IF NOT EXISTS historico_ganhos (
    id          SERIAL PRIMARY KEY,
    montador_id INTEGER NOT NULL,
    os_id       INTEGER,
    valor       NUMERIC(10,2) NOT NULL,
    descricao   TEXT,
    mes         INTEGER NOT NULL,
    ano         INTEGER NOT NULL,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_convites_montador ON convites(montador_id);
CREATE INDEX IF NOT EXISTS idx_convites_status ON convites(status);
CREATE INDEX IF NOT EXISTS idx_ganhos_montador_mes ON historico_ganhos(montador_id, ano, mes);
`;

async function runMigration() {
  try {
    console.log('🔄 Executando migração...');
    await pool.query(sql);
    console.log('✅ Tabelas criadas/verificadas com sucesso!');

    // Seed de OS de demonstração
    const existing = await pool.query("SELECT COUNT(*) FROM ordens_servico");
    if (parseInt(existing.rows[0].count) === 0) {
      await pool.query(`
                INSERT INTO ordens_servico (cliente, descricao, endereco, valor, status) VALUES
                ('N&L Móveis',        'Armário Cozinha',          'Av. Paulista, 100 - SP',     350.00, 'CONCLUIDA'),
                ('Maria Silva',       'Guarda Roupa 6 Portas',    'Rua das Flores, 42 - SP',    420.00, 'ACEITA'),
                ('João Rocha',        'Painel TV + Rack',          'Al. Santos, 500 - SP',       280.00, 'CONVITE_ENVIADO'),
                ('Cond. Sol Nascente','Montagem de 10 Cadeiras',   'Rua Verde, 10 - Guarulhos',  500.00, 'DISPONIVEL'),
                ('Família Mendonça',  'Guarda-roupa + Cômoda',    'Rua das Palmeiras, 142 - SP',480.00, 'DISPONIVEL')
            `);
      console.log('✅ Seed de OS inserido!');
    } else {
      console.log(`ℹ️  Banco já tem ${existing.rows[0].count} ordens — seed ignorado.`);
    }
  } catch (err) {
    console.error('❌ Erro na migração:', err.message);
  } finally {
    await pool.end();
  }
}

runMigration();
