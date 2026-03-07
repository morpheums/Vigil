const { getAddressConnections, getAddressRisk } = require('./range');
const { saveContagionGraph } = require('./db');

const RISK_WEIGHTS = {
  VERY_LOW: 0,
  LOW: 1,
  MEDIUM: 4,
  HIGH: 8,
  CRITICAL: 10,
  UNKNOWN: 2,
};

async function calculateContagionScore(walletId, address, network) {
  // 1. Get up to 15 counterparties
  const { connections } = await getAddressConnections(address, network, 15);

  // 2. Risk-score ALL counterparties in parallel
  const riskResults = await Promise.all(
    connections.map(c =>
      getAddressRisk(c.address, c.network).catch(() => null)
    )
  );

  // 3. Build scored nodes
  const nodes = connections.map((c, i) => ({
    address: c.address,
    network: c.network,
    riskLevel: riskResults[i]?.risk_level || 'UNKNOWN',
    riskScore: riskResults[i]?.risk_score || 0,
    label: c.label || null,
    transferCount: c.transfer_count || 1,
  }));

  // 4. Weighted average
  const totalWeight = nodes.reduce((s, n) => s + n.transferCount, 0);
  const weightedSum = nodes.reduce(
    (s, n) => s + RISK_WEIGHTS[n.riskLevel] * n.transferCount,
    0
  );
  const score = totalWeight > 0 ? Math.min(10, weightedSum / totalWeight) : 0;

  // 5. Save to DB
  saveContagionGraph(walletId, address, nodes);

  // 6. Update wallet contagion_score
  const db = require('./db').getDb();
  db.prepare(
    'UPDATE wallets SET contagion_score = ?, contagion_updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(parseFloat(score.toFixed(1)), walletId);

  return {
    contagionScore: parseFloat(score.toFixed(1)),
    nodeCount: nodes.length,
    highRiskCount: nodes.filter(n =>
      ['HIGH', 'CRITICAL'].includes(n.riskLevel)
    ).length,
    nodes,
  };
}

function getContagionLabel(score) {
  if (score < 2) return { label: 'CLEAN', color: '#3DFFA0' };
  if (score < 4) return { label: 'LOW RISK', color: '#3DFFA0' };
  if (score < 6) return { label: 'MODERATE', color: '#F5A623' };
  if (score < 8) return { label: 'CONTAMINATED', color: '#FF3B30' };
  return { label: 'CRITICAL', color: '#FF2D55' };
}

module.exports = { calculateContagionScore, getContagionLabel, RISK_WEIGHTS };
