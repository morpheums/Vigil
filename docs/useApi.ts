// hooks/useApi.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central data layer for the Vigil mobile app.
// All backend communication goes through here — never call fetch directly
// from screen components.
//
// Usage:
//   const api = useApi();
//   const wallets = await api.getWallets();
//   const result = await api.addWallet({ address, network, label, alertEmail });
// ─────────────────────────────────────────────────────────────────────────────

import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // contagion calls can be slow (15 parallel API calls)
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Wallet {
  id: number;
  address: string;
  network: string;
  label: string | null;
  contagion_score: number | null;
  contagion_updated_at: string | null;
  last_activity: string | null;
  created_at: string;
}

export interface Transaction {
  id: number;
  wallet_id: number;
  tx_hash: string;
  amount_usd: number | null;
  direction: 'incoming' | 'outgoing';
  token_symbol: string | null;
  counterparty: string | null;
  risk_level: string | null;
  risk_score: number | null;
  seen_at: string;
}

export interface ActNowAction {
  id: string;
  urgency: 'critical' | 'high' | 'medium';
  label: string;
  description: string;
  url?: string | null;
  deeplink?: string | null;
  counterparty?: string;
}

export interface Alert {
  id: number;
  wallet_id: number;
  wallet_label: string | null;
  wallet_address: string;
  tx_hash: string;
  message: string;
  risk_level: string;
  act_now_actions: ActNowAction[];
  channels: string[];
  acknowledged: number;
  sent_at: string;
}

export interface ContagionNode {
  address: string;
  network: string;
  riskLevel: string;
  riskScore: number;
  label: string | null;
  transferCount: number;
}

export interface ContagionEdge {
  from_address: string;
  to_address: string;
  transfer_count: number;
}

export interface ContagionResult {
  contagionScore: number;
  nodeCount: number;
  highRiskCount: number;
  nodes: ContagionNode[];
  edges: ContagionEdge[];
}

export interface RiskCheckResult {
  riskLevel: string;
  riskScore: number;
  reasoning: string;
  isSanctioned: boolean;
  isBlacklisted: boolean;
}

export interface PaymentRiskResult {
  overallRiskLevel: string;
  riskScore: number;
  riskFactors: string[];
  senderRisk: { risk_level: string; risk_score: number };
  recipientRisk: { risk_level: string; risk_score: number };
}

// ── Error helper ──────────────────────────────────────────────────────────────

function apiError(err: unknown): Error {
  if (err instanceof AxiosError) {
    const msg = err.response?.data?.error || err.response?.data?.message || err.message;
    return new Error(msg);
  }
  return err instanceof Error ? err : new Error('Unknown error');
}

// ── API methods ───────────────────────────────────────────────────────────────

export function useApi() {

  // ── Wallets ────────────────────────────────────────────────────────────────

  async function getWallets(): Promise<Wallet[]> {
    try {
      const { data } = await client.get('/wallets');
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  async function addWallet(params: {
    address: string;
    network: string;
    label?: string;
    expoPushToken?: string | null;
    alertEmail?: string;
  }): Promise<Wallet> {
    try {
      const { data } = await client.post('/wallets', params);
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  async function deleteWallet(id: number): Promise<void> {
    try {
      await client.delete(`/wallets/${id}`);
    } catch (err) {
      throw apiError(err);
    }
  }

  // ── Contagion ──────────────────────────────────────────────────────────────

  async function getContagion(walletId: number): Promise<ContagionResult> {
    try {
      const { data } = await client.get(`/wallets/${walletId}/contagion`);
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  async function refreshContagion(walletId: number): Promise<ContagionResult> {
    try {
      // This can take 10–20s (15 parallel Range API calls) — timeout extended
      const { data } = await client.post(
        `/wallets/${walletId}/contagion/refresh`,
        {},
        { timeout: 60000 }
      );
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  // ── Alerts ─────────────────────────────────────────────────────────────────

  async function getAlerts(params?: {
    limit?: number;
    walletId?: number;
  }): Promise<Alert[]> {
    try {
      const { data } = await client.get('/alerts', { params });
      // act_now_actions comes back as a JSON string from SQLite — parse it
      return data.map((alert: any) => ({
        ...alert,
        act_now_actions: typeof alert.act_now_actions === 'string'
          ? JSON.parse(alert.act_now_actions || '[]')
          : (alert.act_now_actions || []),
        channels: typeof alert.channels === 'string'
          ? JSON.parse(alert.channels || '[]')
          : (alert.channels || []),
      }));
    } catch (err) {
      throw apiError(err);
    }
  }

  async function acknowledgeAlert(alertId: number): Promise<void> {
    try {
      await client.patch(`/alerts/${alertId}/acknowledge`);
    } catch (err) {
      throw apiError(err);
    }
  }

  // ── SafeSend / Risk ────────────────────────────────────────────────────────

  async function checkRisk(params: {
    address: string;
    network: string;
  }): Promise<RiskCheckResult> {
    try {
      const { data } = await client.post('/risk-check', params);
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  async function checkPaymentRisk(params: {
    senderAddress?: string;
    senderNetwork?: string;
    recipientAddress: string;
    recipientNetwork: string;
    amountUsd?: number;
  }): Promise<PaymentRiskResult> {
    try {
      const { data } = await client.post('/payment-risk', params);
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  // ── Health ─────────────────────────────────────────────────────────────────

  async function getHealth(): Promise<{
    status: string;
    walletCount: number;
    lastPollAt: string | null;
  }> {
    try {
      const { data } = await client.get('/health');
      return data;
    } catch (err) {
      throw apiError(err);
    }
  }

  return {
    getWallets,
    addWallet,
    deleteWallet,
    getContagion,
    refreshContagion,
    getAlerts,
    acknowledgeAlert,
    checkRisk,
    checkPaymentRisk,
    getHealth,
  };
}
