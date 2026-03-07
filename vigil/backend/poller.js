require('dotenv').config();
const { getAddressPayments, getAddressRisk, checkSanctions } = require('./range');
const { buildActNowActions, fireAlert } = require('./alerts');
const { calculateContagionScore } = require('./contagion');
const { getWallets, getSeenTxHashes, insertSeenTx } = require('./db');

let pollInterval = null;
let cycleCount = 0;

async function pollWallets() {
  cycleCount++;
  const wallets = getWallets();
  console.log(`[Poller] Cycle ${cycleCount}: polling ${wallets.length} wallets`);

  for (const wallet of wallets) {
    try {
      // Get recent payments
      const { payments } = await getAddressPayments(wallet.address, wallet.network, 25);

      // Get seen tx hashes for diff
      const seenHashes = new Set(getSeenTxHashes(wallet.id));

      // Process new transactions
      for (const tx of payments) {
        if (seenHashes.has(tx.hash)) continue;

        // Risk-score counterparty
        let riskInfo = { risk_level: 'UNKNOWN', risk_score: 0 };
        let sanctionsInfo = { is_ofac_sanctioned: false, is_token_blacklisted: false };

        try {
          if (tx.counterparty_address) {
            [riskInfo, sanctionsInfo] = await Promise.all([
              getAddressRisk(tx.counterparty_address, tx.counterparty_network || wallet.network),
              checkSanctions(tx.counterparty_address, tx.counterparty_network || wallet.network)
            ]);
          }
        } catch (e) {
          console.error(`[Poller] Risk check failed for ${tx.counterparty_address}:`, e.message);
        }

        // Merge sanctions into riskInfo
        const mergedRisk = { ...riskInfo, ...sanctionsInfo };

        // Insert seen transaction (skip if no tx hash)
        const txHash = tx.hash || tx.tx_hash;
        if (!txHash) continue;
        insertSeenTx(
          wallet.id, txHash, tx.amount_usd, tx.direction,
          tx.token_symbol, tx.counterparty_address,
          mergedRisk.risk_level, mergedRisk.risk_score
        );

        // Build Act Now actions and fire alert
        const actNowActions = buildActNowActions(
          { ...tx, counterparty: tx.counterparty_address, network: wallet.network },
          mergedRisk
        );

        await fireAlert(wallet,
          { ...tx, counterparty: tx.counterparty_address, network: wallet.network },
          mergedRisk, actNowActions
        );
      }

      // Every 4th cycle: recalculate contagion
      if (cycleCount % 4 === 0) {
        try {
          await calculateContagionScore(wallet.id, wallet.address, wallet.network);
          console.log(`[Poller] Contagion recalculated for wallet ${wallet.id}`);
        } catch (e) {
          console.error(`[Poller] Contagion failed for wallet ${wallet.id}:`, e.message);
        }
      }
    } catch (e) {
      console.error(`[Poller] Error polling wallet ${wallet.id}:`, e.message);
    }
  }

  console.log(`[Poller] Cycle ${cycleCount} complete at ${new Date().toISOString()}`);
}

function startPoller() {
  const interval = (parseInt(process.env.POLL_INTERVAL_SECONDS) || 60) * 1000;
  console.log(`[Poller] Starting with ${interval / 1000}s interval`);
  pollInterval = setInterval(pollWallets, interval);
  // Run first poll immediately
  pollWallets();
}

function stopPoller() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  cycleCount = 0;
}

module.exports = { startPoller, stopPoller, pollWallets, _getCycleCount: () => cycleCount };
