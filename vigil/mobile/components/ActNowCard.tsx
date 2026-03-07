// components/ActNowCard.tsx
// Bottom-sheet modal for HIGH / CRITICAL alerts.
// Matches screen-04-actnow.html mockup exactly.

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Alert as AlertType, ActNowAction } from '../hooks/useApi';
import { Colors, Fonts, Radii } from '../constants/theme';

// -- Props --

interface ActNowCardProps {
  alert: AlertType | null;
  visible: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: number) => void;
  onActionPress?: (action: ActNowAction) => boolean;
}

// -- Helpers --

function parseDirection(message: string): 'outgoing' | 'incoming' {
  if (message.trim().startsWith('Sent')) return 'outgoing';
  return 'incoming';
}

function parseAmount(message: string): string {
  // e.g. "Sent 2,500 USDC" -> "2,500 USDC"
  const match = message.match(/(?:Sent|Received)\s+(.+)/i);
  return match ? match[1] : message;
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

function getNetworkLabel(network?: string): string {
  const labels: Record<string, string> = {
    ethereum: 'Ethereum',
    solana: 'Solana',
    tron: 'Tron',
    'cosmoshub-4': 'Cosmos Hub',
    'osmosis-1': 'Osmosis',
    stellar: 'Stellar',
  };
  return network ? labels[network] || network : 'Ethereum';
}

function getUrgencyColor(urgency: string): string {
  switch (urgency) {
    case 'critical': return Colors.danger;
    case 'high': return Colors.warn;
    case 'medium': return Colors.accent;
    default: return Colors.t2;
  }
}

function getUrgencyBg(urgency: string): { bg: string; border: string } {
  switch (urgency) {
    case 'critical': return { bg: 'rgba(255,59,48,0.06)', border: 'rgba(255,59,48,0.2)' };
    case 'high': return { bg: 'rgba(245,166,35,0.06)', border: 'rgba(245,166,35,0.2)' };
    case 'medium': return { bg: 'rgba(61,255,160,0.04)', border: 'rgba(61,255,160,0.15)' };
    default: return { bg: 'rgba(136,136,136,0.04)', border: 'rgba(136,136,136,0.15)' };
  }
}

function isSanctioned(alert: AlertType): boolean {
  return (
    alert.risk_level.toUpperCase() === 'CRITICAL' ||
    alert.message.toLowerCase().includes('sanction') ||
    alert.act_now_actions.some(a =>
      a.label.toLowerCase().includes('sanction') ||
      a.description.toLowerCase().includes('sanction')
    )
  );
}

// -- Component --

export default function ActNowCard({
  alert,
  visible,
  onClose,
  onAcknowledge,
  onActionPress,
}: ActNowCardProps) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible && alert) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, alert]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.6}
      />
    ),
    []
  );

  const handleActionPress = async (action: ActNowAction) => {
    if (onActionPress && onActionPress(action)) return;

    const target = action.url || action.deeplink;
    if (target) {
      try {
        const canOpen = await Linking.canOpenURL(target);
        if (canOpen) await Linking.openURL(target);
      } catch {
        // silently fail
      }
    }
  };

  const handleMarkHandled = () => {
    if (alert) {
      onAcknowledge(alert.id);
      onClose();
    }
  };

  if (!alert) return null;

  const direction = parseDirection(alert.message);
  const amount = parseAmount(alert.message);
  const network = (alert as any).wallet_network || undefined;
  const riskScore = (alert as any).risk_score ?? 8.2;
  const sanctioned = isSanctioned(alert);

  // Counterparty address from first action or fallback
  const counterpartyAddr =
    alert.act_now_actions.find(a => a.counterparty)?.counterparty ||
    alert.tx_hash;

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['90%']}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handleIndicator}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      enablePanDownToClose
    >
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Risk Header */}
        <View style={styles.riskHeader}>
          <View style={styles.riskIndicator}>
            <View style={styles.riskIcon}>
              <Text style={styles.riskIconEmoji}>{'\u{1F6A8}'}</Text>
            </View>
            <View style={styles.riskLabelWrap}>
              <Text style={styles.riskLabel}>HIGH RISK</Text>
              <View style={styles.riskScoreRow}>
                <View style={styles.riskBarWrap}>
                  <View style={[styles.riskBar, { width: `${riskScore * 10}%` }]} />
                </View>
                <Text style={styles.riskScoreNum}>{riskScore.toFixed(1)} / 10</Text>
              </View>
            </View>
          </View>

          {/* TX Details Box */}
          <View style={styles.txBox}>
            <View style={styles.txRow}>
              <Text style={styles.txKey}>DIRECTION</Text>
              <Text style={[styles.txVal, {
                color: direction === 'outgoing' ? Colors.danger : Colors.accent,
              }]}>
                {direction === 'outgoing' ? '\u2191 OUTGOING' : '\u2193 INCOMING'}
              </Text>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txKey}>AMOUNT</Text>
              <Text style={styles.txVal}>{amount}</Text>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txKey}>NETWORK</Text>
              <Text style={styles.txVal}>{getNetworkLabel(network)}</Text>
            </View>
            <View style={styles.txRow}>
              <Text style={styles.txKey}>TO</Text>
              <Text style={styles.txVal}>{truncateAddress(counterpartyAddr)}</Text>
            </View>
            {sanctioned && (
              <View style={[styles.txRow, { marginBottom: 0 }]}>
                <Text style={styles.txKey}>OFAC</Text>
                <Text style={[styles.txVal, { color: Colors.danger }]}>
                  {'\u26A0'} SANCTIONED
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        {alert.act_now_actions.length > 0 && (
          <View style={styles.actions}>
            <Text style={styles.actionsTitle}>RECOMMENDED ACTIONS</Text>
            {alert.act_now_actions.map((action, index) => {
              const urgencyColor = getUrgencyColor(action.urgency);
              const urgencyBg = getUrgencyBg(action.urgency);
              const num = String(index + 1).padStart(2, '0');

              return (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.actionCard, {
                    backgroundColor: urgencyBg.bg,
                    borderColor: urgencyBg.border,
                  }]}
                  onPress={() => handleActionPress(action)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionNum, { color: urgencyColor }]}>{num}</Text>
                  <View style={styles.actionContent}>
                    <Text style={styles.actionLabel}>{action.label}</Text>
                    <Text style={styles.actionDesc}>{action.description}</Text>
                  </View>
                  <Text style={[styles.actionArrow, { color: urgencyColor }]}>{'\u2192'}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </BottomSheetScrollView>

      {/* Mark as Handled button */}
      <TouchableOpacity
        style={styles.handledBtn}
        onPress={handleMarkHandled}
        activeOpacity={0.7}
      >
        <Text style={styles.handledBtnText}>{'\u2713'} Mark as Handled</Text>
      </TouchableOpacity>
    </BottomSheetModal>
  );
}

// -- Styles --

const styles = StyleSheet.create({
  sheetBg: {
    backgroundColor: Colors.s1,
    borderTopLeftRadius: Radii.sheet,
    borderTopRightRadius: Radii.sheet,
  },
  handleIndicator: {
    backgroundColor: Colors.border2,
    width: 40,
    height: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },

  // Risk Header
  riskHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  riskIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,59,48,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.25)',
    flexShrink: 0,
  },
  riskIconEmoji: {
    fontSize: 24,
  },
  riskLabelWrap: {
    flex: 1,
  },
  riskLabel: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 26,
    color: Colors.danger,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  riskScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  riskBarWrap: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
  },
  riskBar: {
    height: '100%',
    borderRadius: 2,
    // Approximate gradient with a solid mix of warn-to-danger
    backgroundColor: Colors.danger,
  },
  riskScoreNum: {
    fontFamily: Fonts.spaceMono,
    fontSize: 10,
    color: Colors.danger,
    fontWeight: '700',
  },

  // TX Details Box
  txBox: {
    backgroundColor: Colors.s2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  txKey: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    letterSpacing: 0.6,
  },
  txVal: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t1,
    fontWeight: '700',
  },

  // Actions
  actions: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flex: 1,
  },
  actionsTitle: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  actionNum: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 11,
    width: 20,
    flexShrink: 0,
    paddingTop: 1,
  },
  actionContent: {
    flex: 1,
  },
  actionLabel: {
    fontFamily: Fonts.syneBold,
    fontSize: 12,
    color: Colors.t1,
    marginBottom: 3,
  },
  actionDesc: {
    fontFamily: Fonts.interRegular,
    fontSize: 11,
    color: Colors.t2,
    lineHeight: 22,
  },
  actionArrow: {
    fontSize: 12,
    paddingTop: 2,
  },

  // Mark as Handled
  handledBtn: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 13,
    borderRadius: 10,
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  handledBtnText: {
    fontFamily: Fonts.syneBold,
    fontSize: 13,
    color: Colors.t2,
  },
});
