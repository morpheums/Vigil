const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'vigil.db');

function createDb(dbPath) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  initTables(db);
  return db;
}

function initTables(db) {
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
}

// Lazily initialized singleton for production use
let _db = null;
function getDb() {
  if (!_db) {
    _db = createDb(DB_PATH);
  }
  return _db;
}

// --- Wallet helpers ---

function insertWallet(address, network, label, expoPushToken, alertEmail) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO wallets (address, network, label, expo_push_token, alert_email)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(address, network, label || null, expoPushToken || null, alertEmail || null);
  return result.lastInsertRowid;
}

function getWallets() {
  const db = getDb();
  return db.prepare(`
    SELECT w.*, MAX(st.seen_at) AS last_activity
    FROM wallets w
    LEFT JOIN seen_transactions st ON st.wallet_id = w.id
    GROUP BY w.id
    ORDER BY w.created_at DESC
  `).all();
}

function getWallet(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
}

function deleteWallet(id) {
  const db = getDb();
  return db.prepare('DELETE FROM wallets WHERE id = ?').run(id);
}

// --- Seen transactions helpers ---

function insertSeenTx(walletId, txHash, amountUsd, direction, tokenSymbol, counterparty, riskLevel, riskScore) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO seen_transactions (wallet_id, tx_hash, amount_usd, direction, token_symbol, counterparty, risk_level, risk_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(walletId, txHash, amountUsd, direction, tokenSymbol, counterparty, riskLevel, riskScore);
  return result.lastInsertRowid;
}

function getSeenTxHashes(walletId) {
  const db = getDb();
  const rows = db.prepare('SELECT tx_hash FROM seen_transactions WHERE wallet_id = ?').all(walletId);
  return rows.map(r => r.tx_hash);
}

// --- Alert helpers ---

function insertAlert(walletId, txHash, message, riskLevel, actNowActions, channels) {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO alert_log (wallet_id, tx_hash, message, risk_level, act_now_actions, channels)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const actionsJson = typeof actNowActions === 'string' ? actNowActions : JSON.stringify(actNowActions);
  const channelsJson = typeof channels === 'string' ? channels : JSON.stringify(channels);
  const result = stmt.run(walletId, txHash, message, riskLevel, actionsJson, channelsJson);
  return result.lastInsertRowid;
}

function getAlerts(limit = 50, walletId = null) {
  const db = getDb();
  const baseQuery = `
    SELECT a.*, w.label AS wallet_label, w.address AS wallet_address
    FROM alert_log a
    LEFT JOIN wallets w ON w.id = a.wallet_id
  `;
  if (walletId) {
    return db.prepare(`${baseQuery} WHERE a.wallet_id = ? ORDER BY a.sent_at DESC LIMIT ?`).all(walletId, limit);
  }
  return db.prepare(`${baseQuery} ORDER BY a.sent_at DESC LIMIT ?`).all(limit);
}

function acknowledgeAlert(alertId) {
  const db = getDb();
  return db.prepare('UPDATE alert_log SET acknowledged = 1 WHERE id = ?').run(alertId);
}

// --- Contagion graph helpers ---

function saveContagionGraph(walletId, rootAddress, nodes) {
  const db = getDb();

  // Clear old graph data for this wallet
  db.prepare('DELETE FROM contagion_edges WHERE wallet_id = ?').run(walletId);
  db.prepare('DELETE FROM contagion_nodes WHERE wallet_id = ?').run(walletId);

  const insertNode = db.prepare(`
    INSERT INTO contagion_nodes (wallet_id, address, network, risk_level, risk_score, label, is_root)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEdge = db.prepare(`
    INSERT INTO contagion_edges (wallet_id, from_address, to_address, transfer_count)
    VALUES (?, ?, ?, ?)
  `);

  const saveAll = db.transaction((wId, rootAddr, nodeList) => {
    for (const node of nodeList) {
      const isRoot = node.address === rootAddr ? 1 : 0;
      insertNode.run(wId, node.address, node.network, node.riskLevel || null, node.riskScore || null, node.label || null, isRoot);

      if (node.edges) {
        for (const edge of node.edges) {
          insertEdge.run(wId, edge.from, edge.to, edge.transferCount || 0);
        }
      }
    }
  });

  saveAll(walletId, rootAddress, nodes);
}

function getContagionGraph(walletId) {
  const db = getDb();
  const nodes = db.prepare('SELECT * FROM contagion_nodes WHERE wallet_id = ?').all(walletId);
  const edges = db.prepare('SELECT * FROM contagion_edges WHERE wallet_id = ?').all(walletId);
  return { nodes, edges };
}

module.exports = {
  createDb,
  getDb,
  insertWallet,
  getWallets,
  getWallet,
  deleteWallet,
  insertSeenTx,
  getSeenTxHashes,
  insertAlert,
  getAlerts,
  acknowledgeAlert,
  saveContagionGraph,
  getContagionGraph,
};
