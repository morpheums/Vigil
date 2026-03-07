// components/ActNowCard.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Full-screen modal for HIGH / CRITICAL alerts. Shows the risk indicator,
// transaction summary, numbered action list, and Mark as Handled / Close.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Alert as AlertType, ActNowAction } from '../hooks/useApi';

// ── Props ────────────────────────────────────────────────────────────────────

interface ActNowCardProps {
  alert: AlertType | null;
  visible: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: number) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getRiskMeta(riskLevel: string): { label: string; color: string } {
  const level = riskLevel.toUpperCase();
  if (level === 'CRITICAL') return { label: 'CRITICAL', color: '#FF3B30' };
  return { label: 'HIGH RISK', color: '#FF8C00' };
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return '#FF3B30';
    case 'high': return '#FF8C00';
    case 'medium': return '#F5A623';
    default: return '#888888';
  }
}

function truncateTxHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return hash.slice(0, 10) + '...' + hash.slice(-6);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ActNowCard({ alert, visible, onClose, onAcknowledge }: ActNowCardProps) {
  if (!alert) return null;

  const { label: riskLabel, color: riskColor } = getRiskMeta(alert.risk_level);

  const handleActionPress = async (action: ActNowAction) => {
    const target = action.url || action.deeplink;
    if (target) {
      try {
        const canOpen = await Linking.canOpenURL(target);
        if (canOpen) {
          await Linking.openURL(target);
        }
      } catch {
        // silently fail — URL not supported
      }
    }
  };

  const handleMarkHandled = () => {
    onAcknowledge(alert.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Risk indicator ──────────────────────────────────────────── */}
            <View style={[styles.riskBadge, { backgroundColor: riskColor + '15', borderColor: riskColor + '40' }]}>
              <Text style={[styles.riskEmoji]}>{'🚨'}</Text>
              <Text style={[styles.riskLabel, { color: riskColor }]}>{riskLabel}</Text>
            </View>

            {/* ── Wallet info ─────────────────────────────────────────────── */}
            {alert.wallet_label && (
              <Text style={styles.walletLabel}>{alert.wallet_label}</Text>
            )}
            <Text style={styles.walletAddress}>
              {alert.wallet_address.slice(0, 10)}...{alert.wallet_address.slice(-6)}
            </Text>

            {/* ── Transaction summary ─────────────────────────────────────── */}
            <View style={styles.summaryCard}>
              <Text style={styles.sectionTitle}>TRANSACTION SUMMARY</Text>
              <Text style={styles.summaryMessage}>{alert.message}</Text>
              <View style={styles.txRow}>
                <Text style={styles.txLabel}>TX HASH</Text>
                <Text style={styles.txValue}>{truncateTxHash(alert.tx_hash)}</Text>
              </View>
            </View>

            {/* ── Action list ─────────────────────────────────────────────── */}
            {alert.act_now_actions.length > 0 && (
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>RECOMMENDED ACTIONS</Text>
                {alert.act_now_actions.map((action, index) => {
                  const urgencyColor = getUrgencyColor(action.urgency);
                  const hasLink = !!(action.url || action.deeplink);

                  return (
                    <TouchableOpacity
                      key={action.id}
                      style={styles.actionCard}
                      onPress={() => handleActionPress(action)}
                      activeOpacity={hasLink ? 0.7 : 1}
                      disabled={!hasLink}
                    >
                      {/* Number badge */}
                      <View style={[styles.numberBadge, { backgroundColor: urgencyColor + '20', borderColor: urgencyColor + '40' }]}>
                        <Text style={[styles.numberText, { color: urgencyColor }]}>
                          {index + 1}
                        </Text>
                      </View>

                      {/* Content */}
                      <View style={styles.actionContent}>
                        <View style={styles.actionHeader}>
                          <Text style={styles.actionTitle}>{action.label}</Text>
                          <View style={[styles.urgencyPill, { backgroundColor: urgencyColor + '15', borderColor: urgencyColor + '30' }]}>
                            <Text style={[styles.urgencyText, { color: urgencyColor }]}>
                              {action.urgency.toUpperCase()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.actionDescription}>{action.description}</Text>
                        {action.counterparty && (
                          <Text style={styles.counterparty}>
                            Counterparty: {action.counterparty.slice(0, 8)}...{action.counterparty.slice(-4)}
                          </Text>
                        )}
                        {hasLink && (
                          <Text style={styles.actionLink}>Open link {'→'}</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* ── Bottom buttons ───────────────────────────────────────────── */}
          <View style={styles.bottomButtons}>
            <TouchableOpacity
              style={styles.markHandledBtn}
              onPress={handleMarkHandled}
              activeOpacity={0.7}
            >
              <Text style={styles.markHandledText}>Mark as Handled</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080808',
  },
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 32,
  },

  // ── Risk indicator ────────────────────────────────────────────────────
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 20,
  },
  riskEmoji: {
    fontSize: 20,
    marginRight: 10,
  },
  riskLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── Wallet info ───────────────────────────────────────────────────────
  walletLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  walletAddress: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.3,
  },

  // ── Summary card ──────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#555555',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  summaryMessage: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e1e1e',
  },
  txLabel: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#555555',
    letterSpacing: 0.8,
  },
  txValue: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ── Actions ───────────────────────────────────────────────────────────
  actionsSection: {
    marginBottom: 20,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 14,
    marginBottom: 10,
  },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  numberText: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    fontWeight: '700',
  },
  actionContent: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  urgencyPill: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  urgencyText: {
    fontFamily: 'SpaceMono',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionDescription: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#aaaaaa',
    lineHeight: 16,
    marginBottom: 6,
  },
  counterparty: {
    fontFamily: 'SpaceMono',
    fontSize: 9,
    color: '#666666',
    marginBottom: 4,
  },
  actionLink: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#3DFFA0',
    fontWeight: '700',
    marginTop: 2,
  },

  // ── Bottom buttons ────────────────────────────────────────────────────
  bottomButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    gap: 10,
  },
  markHandledBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(61,255,160,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(61,255,160,0.25)',
    alignItems: 'center',
  },
  markHandledText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: '#3DFFA0',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#242424',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 13,
    color: '#888888',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
