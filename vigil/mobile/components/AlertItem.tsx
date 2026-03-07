// components/AlertItem.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Single alert row for the Alerts list. Two visual modes:
//   - Normal (LOW/MEDIUM): compact row with risk dot, message, timestamp
//   - Act Now (HIGH/CRITICAL): red/orange banner with actions preview
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { Alert, ActNowAction } from '../hooks/useApi';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Props ────────────────────────────────────────────────────────────────────

interface AlertItemProps {
  alert: Alert;
  onActNow: (alert: Alert) => void;
  onAcknowledge: (alertId: number) => void;
}

// ── Risk dot colors ──────────────────────────────────────────────────────────

const RISK_DOT_COLORS: Record<string, string> = {
  LOW: '#3DFFA0',
  MEDIUM: '#F5A623',
  HIGH: '#FF8C00',
  CRITICAL: '#FF3B30',
};

function getRiskDotColor(riskLevel: string): string {
  return RISK_DOT_COLORS[riskLevel.toUpperCase()] || '#888888';
}

function isActNowLevel(riskLevel: string): boolean {
  const level = riskLevel.toUpperCase();
  return level === 'HIGH' || level === 'CRITICAL';
}

// ── Time formatting ──────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export default function AlertItem({ alert, onActNow, onAcknowledge }: AlertItemProps) {
  const [expanded, setExpanded] = useState(false);
  const actNow = isActNowLevel(alert.risk_level);
  const dotColor = getRiskDotColor(alert.risk_level);
  const isUnread = alert.acknowledged === 0;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  // ── Act Now mode (HIGH / CRITICAL) ──────────────────────────────────────

  if (actNow) {
    const previewActions = alert.act_now_actions.slice(0, 2);
    const hasMore = alert.act_now_actions.length > 2;
    const bannerColor = alert.risk_level.toUpperCase() === 'CRITICAL' ? '#FF3B30' : '#FF8C00';

    return (
      <View style={[styles.container, styles.actNowContainer, { borderColor: bannerColor + '40' }]}>
        {/* Banner */}
        <View style={[styles.actNowBanner, { backgroundColor: bannerColor + '18' }]}>
          <Text style={[styles.actNowBannerText, { color: bannerColor }]}>
            {'⚡ ACT NOW'}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(alert.sent_at)}</Text>
        </View>

        {/* Wallet label */}
        {alert.wallet_label && (
          <Text style={styles.walletLabel}>{alert.wallet_label}</Text>
        )}

        {/* Message */}
        <Text style={styles.message}>{alert.message}</Text>

        {/* Action previews */}
        {previewActions.length > 0 && (
          <View style={styles.actionsPreview}>
            {previewActions.map((action, i) => (
              <View key={action.id} style={styles.actionRow}>
                <View style={[styles.actionBullet, { backgroundColor: bannerColor }]} />
                <Text style={styles.actionLabel} numberOfLines={1}>
                  {action.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.actNowButtons}>
          {hasMore && (
            <TouchableOpacity
              style={[styles.actNowBtn, { borderColor: bannerColor + '40' }]}
              onPress={() => onActNow(alert)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actNowBtnText, { color: bannerColor }]}>
                See all actions
              </Text>
            </TouchableOpacity>
          )}
          {!hasMore && (
            <TouchableOpacity
              style={[styles.actNowBtn, { borderColor: bannerColor + '40' }]}
              onPress={() => onActNow(alert)}
              activeOpacity={0.7}
            >
              <Text style={[styles.actNowBtnText, { color: bannerColor }]}>
                View details
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actNowBtn, styles.handleBtn]}
            onPress={() => onAcknowledge(alert.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.handleBtnText}>Mark as handled</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Normal mode (LOW / MEDIUM) ──────────────────────────────────────────

  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unreadContainer]}
      onPress={toggleExpand}
      activeOpacity={0.7}
    >
      {/* Header row */}
      <View style={styles.normalRow}>
        <View style={[styles.riskDot, { backgroundColor: dotColor }]} />
        <Text style={styles.message} numberOfLines={expanded ? undefined : 2}>
          {alert.message}
        </Text>
        <Text style={styles.timestamp}>{formatTimestamp(alert.sent_at)}</Text>
      </View>

      {/* Expanded details */}
      {expanded && (
        <View style={styles.expandedDetails}>
          {alert.wallet_label && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>WALLET</Text>
              <Text style={styles.detailValue}>{alert.wallet_label}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TX</Text>
            <Text style={styles.detailValue} numberOfLines={1}>
              {alert.tx_hash.slice(0, 10)}...{alert.tx_hash.slice(-6)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>RISK</Text>
            <Text style={[styles.detailValue, { color: dotColor }]}>
              {alert.risk_level.toUpperCase()}
            </Text>
          </View>
          {isUnread && (
            <TouchableOpacity
              style={styles.acknowledgeBtn}
              onPress={() => onAcknowledge(alert.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.acknowledgeBtnText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    marginBottom: 10,
    overflow: 'hidden',
  },
  unreadContainer: {
    borderColor: '#333333',
  },
  actNowContainer: {
    borderWidth: 1,
  },

  // ── Act Now mode ────────────────────────────────────────────────────────
  actNowBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actNowBannerText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  walletLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#888888',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  message: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flex: 1,
  },
  actionsPreview: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 8,
  },
  actionLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#cccccc',
    flex: 1,
  },
  actNowButtons: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingBottom: 12,
    gap: 8,
  },
  actNowBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
  },
  actNowBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  handleBtn: {
    backgroundColor: 'rgba(61,255,160,0.08)',
    borderColor: 'rgba(61,255,160,0.2)',
  },
  handleBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#3DFFA0',
    letterSpacing: 0.3,
  },

  // ── Normal mode ─────────────────────────────────────────────────────────
  normalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: 10,
  },
  timestamp: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#888888',
    letterSpacing: 0.3,
    marginLeft: 8,
    flexShrink: 0,
  },

  // ── Expanded details ───────────────────────────────────────────────────
  expandedDetails: {
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  detailLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#555555',
    letterSpacing: 0.8,
  },
  detailValue: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  acknowledgeBtn: {
    marginTop: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(61,255,160,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(61,255,160,0.2)',
    alignItems: 'center',
  },
  acknowledgeBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#3DFFA0',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
