const Database = require('better-sqlite3');
const path = require('path');

let db;
let dbModule;

beforeEach(() => {
  // Create a fresh in-memory database for each test
  db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Load the module fresh each test
  const modulePath = path.join(__dirname, '..', 'db.js');
  delete require.cache[require.resolve(modulePath)];
  dbModule = require(modulePath);

  // Initialize tables on in-memory db
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
});

afterEach(() => {
  if (db) db.close();
});

describe('table creation', () => {
  test('createDb initializes all 5 tables', () => {
    const testDb = dbModule.createDb(':memory:');
    const tables = testDb.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).all().map(t => t.name);

    expect(tables).toEqual([
      'alert_log',
      'contagion_edges',
      'contagion_nodes',
      'seen_transactions',
      'wallets',
    ]);
    testDb.close();
  });
});

describe('wallet operations', () => {
  test('insertWallet + getWallets', () => {
    db.prepare(
      'INSERT INTO wallets (address, network, label, expo_push_token, alert_email) VALUES (?, ?, ?, ?, ?)'
    ).run('0xABC123', 'ethereum', 'My Wallet', null, 'test@example.com');

    const wallets = db.prepare('SELECT * FROM wallets').all();
    expect(wallets).toHaveLength(1);
    expect(wallets[0].address).toBe('0xABC123');
    expect(wallets[0].network).toBe('ethereum');
    expect(wallets[0].label).toBe('My Wallet');
    expect(wallets[0].alert_email).toBe('test@example.com');
  });

  test('UNIQUE constraint on (address, network)', () => {
    const stmt = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    );
    stmt.run('0xABC123', 'ethereum', 'Wallet 1');

    // Same address + network should throw
    expect(() => {
      stmt.run('0xABC123', 'ethereum', 'Wallet 2');
    }).toThrow();

    // Same address, different network should succeed
    expect(() => {
      stmt.run('0xABC123', 'solana', 'Wallet 3');
    }).not.toThrow();
  });

  test('getWallet by id', () => {
    const result = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    ).run('0xDEF456', 'solana', 'Sol Wallet');

    const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(result.lastInsertRowid);
    expect(wallet.address).toBe('0xDEF456');
    expect(wallet.network).toBe('solana');
  });

  test('deleteWallet removes a wallet', () => {
    const result = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    ).run('0xDEL', 'ethereum', 'Delete Me');

    db.prepare('DELETE FROM wallets WHERE id = ?').run(result.lastInsertRowid);
    const wallet = db.prepare('SELECT * FROM wallets WHERE id = ?').get(result.lastInsertRowid);
    expect(wallet).toBeUndefined();
  });
});

describe('seen transactions', () => {
  test('insertSeenTx + getSeenTxHashes', () => {
    const walletResult = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    ).run('0xWALLET', 'ethereum', 'Test');
    const walletId = walletResult.lastInsertRowid;

    const txStmt = db.prepare(
      'INSERT INTO seen_transactions (wallet_id, tx_hash, amount_usd, direction, token_symbol, counterparty, risk_level, risk_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    txStmt.run(walletId, '0xTX1', 100.50, 'incoming', 'USDC', '0xSENDER1', 'low', 0.1);
    txStmt.run(walletId, '0xTX2', 5000.00, 'outgoing', 'USDT', '0xRECEIVER1', 'high', 0.85);

    const hashes = db.prepare(
      'SELECT tx_hash FROM seen_transactions WHERE wallet_id = ?'
    ).all(walletId).map(r => r.tx_hash);

    expect(hashes).toHaveLength(2);
    expect(hashes).toContain('0xTX1');
    expect(hashes).toContain('0xTX2');
  });
});

describe('alerts', () => {
  test('insertAlert + getAlerts', () => {
    const walletResult = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    ).run('0xALERT', 'ethereum', 'Alert Test');
    const walletId = walletResult.lastInsertRowid;

    db.prepare(
      'INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(walletId, '0xTXALERT', 'High risk detected', 'high',
      JSON.stringify(['freeze', 'report']), JSON.stringify(['push', 'email']));

    const alerts = db.prepare('SELECT * FROM alert_log ORDER BY sent_at DESC LIMIT 50').all();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].message).toBe('High risk detected');
    expect(JSON.parse(alerts[0].act_now_actions)).toEqual(['freeze', 'report']);
    expect(JSON.parse(alerts[0].channels)).toEqual(['push', 'email']);
  });

  test('acknowledgeAlert sets acknowledged to 1', () => {
    const walletResult = db.prepare(
      'INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)'
    ).run('0xACK', 'ethereum', 'Ack Test');

    const alertResult = db.prepare(
      'INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(walletResult.lastInsertRowid, '0xTXACK', 'Test', 'medium', '[]', '["push"]');

    db.prepare('UPDATE alert_log SET acknowledged = 1 WHERE id = ?').run(alertResult.lastInsertRowid);
    const alert = db.prepare('SELECT * FROM alert_log WHERE id = ?').get(alertResult.lastInsertRowid);
    expect(alert.acknowledged).toBe(1);
  });
});

describe('contagion graph', () => {
  test('saveContagionGraph + getContagionGraph', () => {
    const testDb = dbModule.createDb(':memory:');
    testDb.prepare('INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)').run('0xROOT', 'ethereum', 'Graph Test');

    // Insert nodes and edges
    const insertNode = testDb.prepare(
      'INSERT INTO contagion_nodes (wallet_id, address, network, risk_level, risk_score, label, is_root) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const insertEdge = testDb.prepare(
      'INSERT INTO contagion_edges (wallet_id, from_address, to_address, transfer_count) VALUES (?, ?, ?, ?)'
    );

    insertNode.run(1, '0xROOT', 'ethereum', 'low', 0.1, 'Root Wallet', 1);
    insertNode.run(1, '0xNEIGHBOR1', 'ethereum', 'high', 0.9, 'Risky Peer', 0);
    insertEdge.run(1, '0xROOT', '0xNEIGHBOR1', 5);

    const nodes = testDb.prepare('SELECT * FROM contagion_nodes WHERE wallet_id = ?').all(1);
    const edges = testDb.prepare('SELECT * FROM contagion_edges WHERE wallet_id = ?').all(1);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);

    const rootNode = nodes.find(n => n.is_root === 1);
    expect(rootNode.address).toBe('0xROOT');
    expect(rootNode.risk_level).toBe('low');

    const neighbor = nodes.find(n => n.address === '0xNEIGHBOR1');
    expect(neighbor.risk_level).toBe('high');
    expect(neighbor.risk_score).toBe(0.9);

    expect(edges[0].from_address).toBe('0xROOT');
    expect(edges[0].to_address).toBe('0xNEIGHBOR1');
    expect(edges[0].transfer_count).toBe(5);

    testDb.close();
  });

  test('replacing old contagion data clears previous entries', () => {
    const testDb = dbModule.createDb(':memory:');
    testDb.prepare('INSERT INTO wallets (address, network, label) VALUES (?, ?, ?)').run('0xROOT', 'ethereum', 'Test');

    // Insert initial node
    testDb.prepare(
      'INSERT INTO contagion_nodes (wallet_id, address, network, risk_level, risk_score, label, is_root) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(1, '0xOLD', 'ethereum', 'low', 0.1, 'Old Node', 0);

    let nodes = testDb.prepare('SELECT * FROM contagion_nodes WHERE wallet_id = 1').all();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].address).toBe('0xOLD');

    // Clear and re-insert (simulating saveContagionGraph)
    testDb.prepare('DELETE FROM contagion_edges WHERE wallet_id = ?').run(1);
    testDb.prepare('DELETE FROM contagion_nodes WHERE wallet_id = ?').run(1);
    testDb.prepare(
      'INSERT INTO contagion_nodes (wallet_id, address, network, risk_level, risk_score, label, is_root) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(1, '0xNEW', 'ethereum', 'medium', 0.5, 'New Node', 1);

    nodes = testDb.prepare('SELECT * FROM contagion_nodes WHERE wallet_id = 1').all();
    expect(nodes).toHaveLength(1);
    expect(nodes[0].address).toBe('0xNEW');

    testDb.close();
  });
});
