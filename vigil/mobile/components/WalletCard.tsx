import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wallet } from '../hooks/useApi';
import { NETWORK_MAP } from '../constants/networks';

function contagionColor(score: number): string {
  if (score < 2) return '#3DFFA0';
  if (score < 4) return '#3DFFA0';
  if (score < 6) return '#F5A623';
  if (score < 8) return '#FF8C00';
  return '#FF3B30';
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
}

export default function WalletCard({ wallet, onPress }: WalletCardProps) {
  const network = NETWORK_MAP[wallet.network];
  const displayName = wallet.label || truncateAddress(wallet.address);
  const score = wallet.contagion_score;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header row: name + network badge */}
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>
        {network && (
          <View style={[styles.networkBadge, { backgroundColor: network.color + '22' }]}>
            <Text style={[styles.networkText, { color: network.color }]}>
              {network.symbol}
            </Text>
          </View>
        )}
      </View>

      {/* Address (shown if label exists) */}
      {wallet.label && (
        <Text style={styles.address}>{truncateAddress(wallet.address)}</Text>
      )}

      {/* Bottom row: contagion score + last activity */}
      <View style={styles.bottomRow}>
        {score !== null && score !== undefined ? (
          <View style={[styles.contagionPill, { backgroundColor: contagionColor(score) + '18' }]}>
            <Text style={[styles.contagionText, { color: contagionColor(score) }]}>
              {'\uD83D\uDD78'} Contagion: {score.toFixed(1)}
            </Text>
          </View>
        ) : (
          <View style={styles.contagionPill}>
            <Text style={[styles.contagionText, { color: '#888888' }]}>
              {'\uD83D\uDD78'} No score yet
            </Text>
          </View>
        )}

        {wallet.last_activity && (
          <Text style={styles.timestamp}>
            {formatTimestamp(wallet.last_activity)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  networkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  address: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 4,
    fontFamily: 'Courier',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  contagionPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#181818',
  },
  contagionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    color: '#888888',
    fontSize: 12,
  },
});
