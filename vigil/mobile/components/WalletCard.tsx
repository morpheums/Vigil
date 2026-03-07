import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Wallet } from '../hooks/useApi';
import { NETWORK_MAP } from '../constants/networks';
import { Colors, Fonts, Radii } from '../constants/theme';
import RiskBadge from './RiskBadge';

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function contagionColor(score: number): string {
  if (score < 4) return Colors.accent;
  if (score < 6) return Colors.warn;
  return Colors.danger;
}

function deriveRiskLevel(score: number | null): string {
  if (score === null || score === undefined) return 'LOW';
  if (score < 2) return 'VERY_LOW';
  if (score < 4) return 'LOW';
  if (score < 6) return 'MEDIUM';
  if (score < 8) return 'HIGH';
  return 'CRITICAL';
}

function contagionLabel(score: number): string {
  if (score >= 6) return `${Math.ceil(score / 3)} risky neighbors`;
  if (score >= 2) return 'Clean neighborhood';
  return 'No risks detected';
}

// ── Component ────────────────────────────────────────────────────────────────

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  isActive?: boolean;
}

export default function WalletCard({ wallet, onPress, isActive = false }: WalletCardProps) {
  const network = NETWORK_MAP[wallet.network];
  const displayName = wallet.label || truncateAddress(wallet.address);
  const score = wallet.contagion_score;
  const riskLevel = deriveRiskLevel(score);
  const scoreColor = score !== null && score !== undefined ? contagionColor(score) : Colors.t2;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isActive && styles.cardActive,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Active top accent line */}
      {isActive && <View style={styles.accentLine} />}

      {/* Row 1: wcard-top */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <View style={styles.labelRow}>
            {isActive && <PulsingDot />}
            <Text style={styles.walletName} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
          <View style={styles.badges}>
            {network && (
              <View style={[styles.networkBadge, {
                backgroundColor: network.color + '1A',
                borderColor: network.color + '4D',
              }]}>
                <Text style={[styles.networkText, { color: network.color }]}>
                  {network.symbol}
                </Text>
              </View>
            )}
            <RiskBadge riskLevel={riskLevel} />
          </View>
        </View>
        <View style={styles.topRight}>
          <Text style={styles.balance}>N/A</Text>
          {wallet.last_activity && (
            <Text style={styles.activity}>{formatTimestamp(wallet.last_activity)}</Text>
          )}
        </View>
      </View>

      {/* Row 3: address */}
      <Text style={styles.address}>{wallet.address}</Text>

      {/* Row 4: contagion pill */}
      <View style={styles.cpill}>
        <Text style={styles.cpillSpider}>{'\uD83D\uDD78'}</Text>
        <Text style={[styles.cpillScore, { color: scoreColor }]}>
          {score !== null && score !== undefined ? score.toFixed(1) : '—'}
        </Text>
        <Text style={styles.cpillLabel}>
          CONTAGION {'\u00B7'} {score !== null && score !== undefined ? contagionLabel(score) : 'No score yet'}
        </Text>
        <View style={styles.cbarWrap}>
          <View style={[
            styles.cbar,
            {
              width: score !== null && score !== undefined ? `${Math.min(score * 10, 100)}%` : '0%',
              backgroundColor: scoreColor,
            },
          ]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Pulsing Dot ──────────────────────────────────────────────────────────────

function PulsingDot() {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.s2,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginHorizontal: 14,
    marginBottom: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: 'rgba(61,255,160,0.25)',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },

  // Row 1 — top
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  topLeft: {
    flex: 1,
    marginRight: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  walletName: {
    fontFamily: Fonts.syneBold,
    fontSize: 13,
    color: Colors.t1,
  },
  topRight: {
    alignItems: 'flex-end',
  },
  balance: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 15,
    color: Colors.t1,
  },
  activity: {
    fontSize: 10,
    color: Colors.t2,
    marginTop: 2,
  },

  // Row 2 — badges
  badges: {
    flexDirection: 'row',
    gap: 5,
  },
  networkBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  networkText: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.6,
  },

  // Row 3 — address
  address: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t3,
    marginBottom: 10,
  },

  // Row 4 — contagion pill
  cpill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.s3,
    borderRadius: 8,
    padding: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  cpillSpider: {
    fontSize: 11,
  },
  cpillScore: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 12,
  },
  cpillLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 8,
    color: Colors.t2,
    letterSpacing: 0.5,
    flex: 1,
  },
  cbarWrap: {
    width: 60,
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cbar: {
    height: '100%',
    borderRadius: 2,
  },

  // Pulsing dot
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
});
