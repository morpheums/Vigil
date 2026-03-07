export interface Network {
  id: string;
  name: string;
  symbol: string;
  color: string;
}

export const NETWORKS: Network[] = [
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', color: '#627EEA' },
  { id: 'solana', name: 'Solana', symbol: 'SOL', color: '#9945FF' },
  { id: 'tron', name: 'Tron', symbol: 'TRX', color: '#FF4040' },
  { id: 'cosmoshub-4', name: 'Cosmos', symbol: 'ATOM', color: '#6B75CA' },
  { id: 'osmosis-1', name: 'Osmosis', symbol: 'OSMO', color: '#5E12A0' },
  { id: 'stellar', name: 'Stellar', symbol: 'XLM', color: '#0099CC' },
];

export const NETWORK_MAP = Object.fromEntries(NETWORKS.map(n => [n.id, n]));
