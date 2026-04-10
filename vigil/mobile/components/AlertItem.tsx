// components/AlertItem.tsx
// Two visual modes: ACT NOW (HIGH/CRITICAL) and Normal (LOW/MEDIUM)
// Matches screen-03-alerts.html mockup exactly.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert } from '../hooks/useApi';
import { Colors, Fonts, Radii } from '../constants/theme';
import RiskBadge from './RiskBadge';

// -- Props --

interface AlertItemProps {
  alert: Alert;
  onActNow: (alert: Alert) => void;
  onAcknowledge: (alertId: number) => void;
}

// -- Helpers --

function isActNowLevel(riskLevel: string): boolean {
  const level = riskLevel.toUpperCase();
  return level === 'HIGH' || level === 'CRITICAL';
}

function isCritical(riskLevel: string): boolean {
  return riskLevel.toUpperCase() === 'CRITICAL';
}

function formatAlertTitle(alert: { direction: string | null; amount_usd: number | null; token_symbol: string | null }): string {
  const dir = alert.direction === 'outgoing' ? 'Outgoing' : 'Incoming';
  const amount = alert.amount_usd != null ? `$${alert.amount_usd.toLocaleString()}` : '';
  const token = alert.token_symbol || '';
  return `${dir} ${amount} ${token}`.trim();
}

function formatTimestamp(sentAt: string): string {
  const date = new Date(sentAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Network badge color map
const NETWORK_BADGE_META: Record<string, { label: string; color: string }> = {
  ethereum:       { label: 'ETH', color: '#627EEA' },
  solana:         { label: 'SOL', color: '#9945FF' },
  tron:           { label: 'TRX', color: '#FF4040' },
  'cosmoshub-4':  { label: 'ATOM', color: '#6B75CA' },
  'osmosis-1':    { label: 'OSMO', color: '#750BBB' },
  stellar:        { label: 'XLM', color: '#0099CC' },
};

function getNetworkMeta(network?: string): { label: string; color: string } {
  if (network && NETWORK_BADGE_META[network]) {
    return NETWORK_BADGE_META[network];
  }
  return { label: 'ETH', color: '#627EEA' };
}

// -- Inline NetworkBadge --

function NetworkBadge({ network }: { network?: string }) {
  const meta = getNetworkMeta(network);
  return (
    <View style={[styles.netBadge, {
      backgroundColor: meta.color + '1A',
      borderColor: meta.color + '4D',
    }]}>
      <Text style={[styles.netBadgeText, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

// -- Component --

export default function AlertItem({ alert, onActNow, onAcknowledge }: AlertItemProps) {
  const actNow = isActNowLevel(alert.risk_level);
  const critical = isCritical(alert.risk_level);
  const direction = alert.direction || 'incoming';
  const title = formatAlertTitle(alert);
  const isUnread = alert.acknowledged === 0;
  const dimStyle = alert.acknowledged === 1 ? { opacity: 0.5 } : undefined;

  // Prefer counterparty network from actions, fall back to wallet network
  const actionNetwork = alert.act_now_actions.find(a => (a as any).network);
  const network = (actionNetwork as any)?.network || (alert as any).wallet_network || undefined;

  // -- ACT NOW mode (HIGH / CRITICAL) --

  if (actNow) {
    const previewActions = alert.act_now_actions.slice(0, 2);
    const totalActions = alert.act_now_actions.length;
    const moreCount = totalActions - 2;

    const bannerBg = critical
      ? 'rgba(255,45,85,0.15)'
      : 'rgba(255,59,48,0.15)';
    const bannerBorderBottom = 'rgba(255,59,48,0.2)';
    const cardBorderColor = critical
      ? 'rgba(255,45,85,0.4)'
      : 'rgba(255,59,48,0.35)';
    const bannerEmoji = critical ? '\u{1F6A8}' : '\u{26A1}'; // alarm vs lightning
    const bannerText = critical ? 'ACT NOW \u2014 SANCTIONED' : 'ACT NOW';
    const bannerTextColor = critical ? Colors.critical : Colors.danger;

    // Icon box styles based on direction — always differentiate outgoing (red) vs incoming (green)
    const iconOutgoing = direction === 'outgoing';
    const iconBg = iconOutgoing ? 'rgba(255,59,48,0.18)' : 'rgba(61,255,160,0.18)';
    const iconBorder = iconOutgoing ? 'rgba(255,59,48,0.35)' : 'rgba(61,255,160,0.35)';
    const iconColor = iconOutgoing ? Colors.danger : Colors.accent;

    return (
      <TouchableOpacity
        style={[styles.card, { borderColor: cardBorderColor }, dimStyle]}
        onPress={() => onActNow(alert)}
        activeOpacity={0.8}
      >
        {/* Banner */}
        <View style={[styles.actBanner, {
          backgroundColor: bannerBg,
          borderBottomWidth: 1,
          borderBottomColor: bannerBorderBottom,
        }]}>
          <Text style={styles.bannerEmoji}>{bannerEmoji}</Text>
          <Text style={[styles.actText, { color: bannerTextColor }]}>
            {bannerText}
          </Text>
          <Text style={styles.actTime}>{formatTimestamp(alert.sent_at)}</Text>
        </View>

        {/* Body */}
        <View style={[styles.abody, !critical && styles.abodyBorderBottom]}>
          <View style={[styles.aicon, { backgroundColor: iconBg, borderColor: iconBorder }]}>
            <Text style={[styles.aiconText, { color: iconColor }]}>{iconOutgoing ? '\u2191' : '\u2193'}</Text>
          </View>
          <View style={styles.ainfo}>
            <View style={styles.atitleRow}>
              <Text style={styles.atitle} numberOfLines={1}>{title}</Text>
              {isUnread && (
                <View style={styles.newPill}>
                  <Text style={styles.newPillText}>NEW</Text>
                </View>
              )}
            </View>
            <View style={styles.abadges}>
              <NetworkBadge network={network} />
              <RiskBadge riskLevel={alert.risk_level} />
            </View>
          </View>
        </View>

        {/* Action Preview — only for HIGH, not CRITICAL */}
        {!critical && previewActions.length > 0 && (
          <View style={styles.actPreview}>
            {previewActions.map((action) => (
              <View key={action.id} style={styles.actRow}>
                <Text style={styles.actRowLabel} numberOfLines={1}>{action.label}</Text>
                <Text style={styles.actRowArrow}>{'\u2192'}</Text>
              </View>
            ))}
            {moreCount > 0 && (
              <Text style={styles.actMore}>
                + {moreCount} more action{moreCount > 1 ? 's' : ''} {'\u00B7'} tap to open
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // -- Normal mode (LOW / MEDIUM) --

  return (
    <TouchableOpacity
      style={[styles.card, dimStyle]}
      onPress={() => {
        if (isUnread) onAcknowledge(alert.id);
      }}
      activeOpacity={0.7}
    >
      <View style={styles.abody}>
        <View style={[styles.aicon, {
          backgroundColor: direction === 'outgoing'
            ? 'rgba(255,59,48,0.15)'
            : 'rgba(61,255,160,0.15)',
          borderColor: direction === 'outgoing'
            ? 'rgba(255,59,48,0.30)'
            : 'rgba(61,255,160,0.30)',
        }]}>
          <Text style={[styles.aiconText, {
            color: direction === 'outgoing' ? Colors.danger : Colors.accent,
          }]}>{direction === 'outgoing' ? '\u2191' : '\u2193'}</Text>
        </View>
        <View style={styles.ainfo}>
          <Text style={styles.atitle} numberOfLines={1}>{title}</Text>
          <View style={styles.abadges}>
            <NetworkBadge network={network} />
            <RiskBadge riskLevel={alert.risk_level} />
          </View>
        </View>
        <Text style={styles.atime}>{formatTimestamp(alert.sent_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// -- Styles --

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: Radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Banner (ACT NOW)
  actBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    gap: 8,
  },
  bannerEmoji: {
    fontSize: 14,
  },
  actText: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  actTime: {
    fontFamily: Fonts.spaceMono,
    fontSize: 8,
    color: Colors.t2,
    marginLeft: 'auto',
  },

  // Body
  abody: {
    backgroundColor: Colors.s2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  abodyBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,59,48,0.15)',
  },

  // Icon box
  aicon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  aiconText: {
    fontSize: 15,
    color: Colors.t1,
  },

  // Info
  ainfo: {
    flex: 1,
  },
  atitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  atitle: {
    fontFamily: Fonts.syneBold,
    fontSize: 12,
    color: Colors.t1,
    flexShrink: 1,
  },
  newPill: {
    backgroundColor: Colors.accent10,
    borderWidth: 1,
    borderColor: 'rgba(61,255,160,0.3)',
    borderRadius: 3,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  newPillText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 7,
    color: Colors.accent,
    letterSpacing: 0.5,
  },
  abadges: {
    flexDirection: 'row',
    gap: 5,
  },

  // Timestamp (normal mode)
  atime: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    flexShrink: 0,
  },

  // Network badge
  netBadge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  netBadgeText: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.4,
  },

  // Action preview (HIGH only)
  actPreview: {
    backgroundColor: Colors.s2,
    paddingVertical: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    gap: 5,
  },
  actRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,59,48,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.12)',
    borderRadius: 8,
  },
  actRowLabel: {
    fontFamily: Fonts.syneBold,
    fontSize: 11,
    color: Colors.t1,
    flex: 1,
  },
  actRowArrow: {
    fontSize: 10,
    color: Colors.danger,
  },
  actMore: {
    fontFamily: Fonts.spaceMono,
    fontSize: 8,
    color: Colors.t1,
    textAlign: 'center',
    paddingTop: 2,
  },
});
