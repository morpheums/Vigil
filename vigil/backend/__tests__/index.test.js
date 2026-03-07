const request = require('supertest');
const Database = require('better-sqlite3');

// Mock range.js to avoid real API calls
jest.mock('../range', () => ({
  getAddressPayments: jest.fn().mockResolvedValue({ payments: [] }),
  getAddressRisk: jest.fn().mockResolvedValue({ risk_level: 'LOW', risk_score: 0.1, reasoning: 'Test' }),
  checkSanctions: jest.fn().mockResolvedValue({ is_ofac_sanctioned: false, is_token_blacklisted: false }),
  getPaymentRisk: jest.fn().mockResolvedValue({ risk_level: 'LOW', recommendation: 'proceed' }),
  getAddressConnections: jest.fn().mockResolvedValue({ connections: [] }),
}));

// Mock contagion.js
jest.mock('../contagion', () => ({
  calculateContagionScore: jest.fn().mockResolvedValue({ contagionScore: 0, nodeCount: 0, highRiskCount: 0, nodes: [] }),
}));

// Mock poller.js
jest.mock('../poller', () => ({
  startPoller: jest.fn(),
  stopPoller: jest.fn(),
}));

// Mock alerts.js
jest.mock('../alerts', () => ({
  buildActNowActions: jest.fn().mockReturnValue([]),
  fireAlert: jest.fn().mockResolvedValue({ message: 'test', channels: [] }),
}));

// Use global to share the db reference with the mock factory
// Variables prefixed with 'mock' are allowed in jest.mock factories
let mockDb = null;

jest.mock('../db', () => {
  return {
    getDb: jest.fn(() => global.__testDb),
    insertWallet: jest.fn((address, network, label, expoPushToken, alertEmail) => {
      const db = global.__testDb;
      const stmt = db.prepare(
        'INSERT INTO wallets (address, network, label, expo_push_token, alert_email) VALUES (?, ?, ?, ?, ?)'
      );
      const result = stmt.run(address, network, label || null, expoPushToken || null, alertEmail || null);
      return result.lastInsertRowid;
    }),
    getWallets: jest.fn(() => {
      return global.__testDb.prepare('SELECT * FROM wallets ORDER BY created_at DESC').all();
    }),
    getWallet: jest.fn((id) => {
      return global.__testDb.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
    }),
    deleteWallet: jest.fn((id) => {
      return global.__testDb.prepare('DELETE FROM wallets WHERE id = ?').run(id);
    }),
    insertSeenTx: jest.fn((walletId, txHash, amountUsd, direction, tokenSymbol, counterparty, riskLevel, riskScore) => {
      const db = global.__testDb;
      const stmt = db.prepare(
        'INSERT INTO seen_transactions (wallet_id, tx_hash, amount_usd, direction, token_symbol, counterparty, risk_level, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      return stmt.run(walletId, txHash, amountUsd, direction, tokenSymbol, counterparty, riskLevel, riskScore).lastInsertRowid;
    }),
    getSeenTxHashes: jest.fn((walletId) => {
      return global.__testDb.prepare('SELECT tx_hash FROM seen_transactions WHERE wallet_id = ?').all(walletId).map(r => r.tx_hash);
    }),
    insertAlert: jest.fn((walletId, txHash, message, riskLevel, actNowActions, channels) => {
      const db = global.__testDb;
      const actionsJson = typeof actNowActions === 'string' ? actNowActions : JSON.stringify(actNowActions);
      const channelsJson = typeof channels === 'string' ? channels : JSON.stringify(channels);
      const stmt = db.prepare(
        'INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels) VALUES (?, ?, ?, ?, ?, ?)'
      );
      return stmt.run(walletId, txHash, message, riskLevel, actionsJson, channelsJson).lastInsertRowid;
    }),
    getAlerts: jest.fn((limit = 50, walletId = null) => {
      const db = global.__testDb;
      if (walletId) {
        return db.prepare('SELECT * FROM alert_log WHERE wallet_id = ? ORDER BY sent_at DESC LIMIT ?').all(walletId, limit);
      }
      return db.prepare('SELECT * FROM alert_log ORDER BY sent_at DESC LIMIT ?').all(limit);
    }),
    acknowledgeAlert: jest.fn((alertId) => {
      return global.__testDb.prepare('UPDATE alert_log SET acknowledged = 1 WHERE id = ?').run(alertId);
    }),
    getContagionGraph: jest.fn((walletId) => {
      const db = global.__testDb;
      const nodes = db.prepare('SELECT * FROM contagion_nodes WHERE wallet_id = ?').all(walletId);
      const edges = db.prepare('SELECT * FROM contagion_edges WHERE wallet_id = ?').all(walletId);
      return { nodes, edges };
    }),
    saveContagionGraph: jest.fn(),
  };
});

function createTestDb() {
  const db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      address TEXT NOT NULL,
      network TEXT NOT NULL,
      label TEXT,
      expo_push_token TEXT,
      alert_email TEXT,
      contagion_score REAL DEFAULT NULL,
      contagion_updated_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(address, network)
    );
    CREATE TABLE IF NOT EXISTS seen_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      amount_usd REAL,
      direction TEXT,
      token_symbol TEXT,
      counterparty TEXT,
      risk_level TEXT,
      risk_score REAL,
      seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(wallet_id) REFERENCES wallets(id)
    );
    CREATE TABLE IF NOT EXISTS alert_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      message TEXT,
      risk_level TEXT,
      act_now_actions TEXT,
      channels TEXT,
      acknowledged INTEGER DEFAULT 0,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS contagion_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      address TEXT NOT NULL,
      network TEXT NOT NULL,
      risk_level TEXT,
      risk_score REAL,
      label TEXT,
      is_root INTEGER DEFAULT 0,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(wallet_id) REFERENCES wallets(id)
    );
    CREATE TABLE IF NOT EXISTS contagion_edges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      transfer_count INTEGER,
      FOREIGN KEY(wallet_id) REFERENCES wallets(id)
    );
  `);
  return db;
}

let app;

beforeEach(() => {
  global.__testDb = createTestDb();
  mockDb = global.__testDb;

  // Clear require cache for index.js so it picks up fresh state
  const appPath = require.resolve('../index');
  delete require.cache[appPath];
  app = require('../index');
});

afterEach(() => {
  if (global.__testDb) {
    global.__testDb.close();
    global.__testDb = null;
  }
});

describe('POST /wallets', () => {
  test('returns 201 with valid body', async () => {
    const res = await request(app)
      .post('/wallets')
      .send({ address: '0xABC123', network: 'ethereum', label: 'Test Wallet' })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.address).toBe('0xABC123');
    expect(res.body.network).toBe('ethereum');
    expect(res.body.label).toBe('Test Wallet');
  });

  test('returns 400 when address is missing', async () => {
    const res = await request(app)
      .post('/wallets')
      .send({ network: 'ethereum' })
      .expect(400);

    expect(res.body.error).toBe('address and network required');
  });

  test('returns 400 when network is missing', async () => {
    const res = await request(app)
      .post('/wallets')
      .send({ address: '0xABC123' })
      .expect(400);

    expect(res.body.error).toBe('address and network required');
  });

  test('returns 409 for duplicate wallet', async () => {
    await request(app)
      .post('/wallets')
      .send({ address: '0xDUP', network: 'ethereum' })
      .expect(201);

    const res = await request(app)
      .post('/wallets')
      .send({ address: '0xDUP', network: 'ethereum' })
      .expect(409);

    expect(res.body.error).toBe('Wallet already exists');
  });
});

describe('GET /wallets', () => {
  test('returns an array of wallets', async () => {
    const res = await request(app)
      .get('/wallets')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('returns wallets after inserting one', async () => {
    await request(app)
      .post('/wallets')
      .send({ address: '0xLIST', network: 'solana', label: 'List Test' });

    const res = await request(app)
      .get('/wallets')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].address).toBe('0xLIST');
  });
});

describe('DELETE /wallets/:id', () => {
  test('returns 204 on successful delete', async () => {
    const createRes = await request(app)
      .post('/wallets')
      .send({ address: '0xDEL', network: 'ethereum' });

    await request(app)
      .delete(`/wallets/${createRes.body.id}`)
      .expect(204);

    const listRes = await request(app)
      .get('/wallets')
      .expect(200);

    expect(listRes.body).toHaveLength(0);
  });
});

describe('GET /wallets/:id/contagion', () => {
  test('returns 404 when no contagion data exists', async () => {
    const createRes = await request(app)
      .post('/wallets')
      .send({ address: '0xCONT', network: 'ethereum' });

    await request(app)
      .get(`/wallets/${createRes.body.id}/contagion`)
      .expect(404);
  });
});

describe('GET /alerts', () => {
  test('returns an array', async () => {
    const res = await request(app)
      .get('/alerts')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  test('parses act_now_actions JSON strings', async () => {
    const createRes = await request(app)
      .post('/wallets')
      .send({ address: '0xALRT', network: 'ethereum' });

    global.__testDb.prepare(
      'INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(createRes.body.id, '0xTXH', 'Test alert', 'HIGH', JSON.stringify([{ id: 'revoke', label: 'Revoke' }]), JSON.stringify(['push']));

    const res = await request(app)
      .get('/alerts')
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(Array.isArray(res.body[0].act_now_actions)).toBe(true);
    expect(res.body[0].act_now_actions[0].id).toBe('revoke');
    expect(Array.isArray(res.body[0].channels)).toBe(true);
  });
});

describe('PATCH /alerts/:id/acknowledge', () => {
  test('acknowledges an alert', async () => {
    const createRes = await request(app)
      .post('/wallets')
      .send({ address: '0xACK', network: 'ethereum' });

    global.__testDb.prepare(
      'INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(createRes.body.id, '0xTXACK', 'Ack test', 'MEDIUM', '[]', '[]');

    const alertId = global.__testDb.prepare('SELECT id FROM alert_log ORDER BY id DESC LIMIT 1').get().id;

    const res = await request(app)
      .patch(`/alerts/${alertId}/acknowledge`)
      .expect(200);

    expect(res.body.acknowledged).toBe(true);

    const alert = global.__testDb.prepare('SELECT * FROM alert_log WHERE id = ?').get(alertId);
    expect(alert.acknowledged).toBe(1);
  });
});

describe('POST /risk-check', () => {
  test('returns risk data for valid address', async () => {
    const res = await request(app)
      .post('/risk-check')
      .send({ address: '0xRISK', network: 'ethereum' })
      .expect(200);

    expect(res.body).toHaveProperty('riskLevel');
    expect(res.body).toHaveProperty('riskScore');
    expect(res.body).toHaveProperty('isSanctioned');
    expect(res.body).toHaveProperty('isBlacklisted');
  });

  test('returns 400 when address missing', async () => {
    await request(app)
      .post('/risk-check')
      .send({ network: 'ethereum' })
      .expect(400);
  });
});

describe('POST /payment-risk', () => {
  test('returns payment risk result', async () => {
    const res = await request(app)
      .post('/payment-risk')
      .send({
        senderAddress: '0xSENDER',
        senderNetwork: 'ethereum',
        recipientAddress: '0xRECIPIENT',
        recipientNetwork: 'ethereum',
        amountUsd: 100,
      })
      .expect(200);

    expect(res.body).toHaveProperty('risk_level');
  });

  test('returns 400 when recipientAddress missing', async () => {
    await request(app)
      .post('/payment-risk')
      .send({ senderAddress: '0xSENDER' })
      .expect(400);
  });
});

describe('GET /health', () => {
  test('returns status ok with wallet count', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('walletCount');
    expect(res.body).toHaveProperty('lastPollAt');
    expect(typeof res.body.walletCount).toBe('number');
  });
});
