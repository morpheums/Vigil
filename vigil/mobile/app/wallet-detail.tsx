import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApi, Wallet, ContagionResult } from '../hooks/useApi';
import { Colors, Fonts, Radii } from '../constants/theme';
import { NETWORKS } from '../constants/networks';
import ContagionGraph from '../components/ContagionGraph';
import RiskBadge from '../components/RiskBadge';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function contagionColor(score: number): string {
  if (score < 2) return Colors.accent;
  if (score < 4) return Colors.accent;
  if (score < 6) return Colors.warn;
  if (score < 8) return Colors.danger;
  return Colors.critical;
}

function riskLevel(score: number): string {
  if (score < 2) return 'VERY LOW';
  if (score < 4) return 'LOW';
  if (score < 6) return 'MEDIUM';
  if (score < 8) return 'HIGH';
  return 'CRITICAL';
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function WalletDetailScreen() {
  const { walletId } = useLocalSearchParams<{ walletId: string }>();
  const router = useRouter();
  const api = useApi();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [contagion, setContagion] = useState<ContagionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingContagion, setRefreshingContagion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericId = Number(walletId);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const wallets = await api.getWallets();
      const found = wallets.find((w) => w.id === numericId);
      if (!found) {
        setError('Wallet not found.');
        return;
      }
      setWallet(found);

      const contagionData = await api.getContagion(numericId);
      setContagion(contagionData);
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data.');
    }
  }, [numericId]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefreshContagion = async () => {
    setRefreshingContagion(true);
    try {
      const result = await api.refreshContagion(numericId);
      setContagion(result);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to refresh contagion data.');
    } finally {
      setRefreshingContagion(false);
    }
  };

  const handleDeleteWallet = () => {
    Alert.alert(
      'Delete Wallet',
      'Are you sure you want to stop watching this wallet? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await api.deleteWallet(numericId);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete wallet.');
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            loadData().finally(() => setLoading(false));
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!wallet) return null;

  const networkInfo = NETWORKS.find((n) => n.id === wallet.network);
  const networkColor = networkInfo?.color || Colors.t2;
  const networkSymbol = networkInfo?.symbol || wallet.network.toUpperCase();
  const score = contagion?.contagionScore ?? 0;
  const scoreColor = contagionColor(score);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back row */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>{'\u2190'} Back</Text>
          </TouchableOpacity>
        </View>

        {/* Detail header */}
        <View style={styles.detailHeader}>
          <View style={styles.detailNameRow}>
            <Text style={styles.detailName}>
              {wallet.label || 'Wallet'}
            </Text>
            {/* Network badge */}
            <View
              style={[
                styles.networkBadge,
                {
                  borderColor: networkColor + '4D',
                  backgroundColor: networkColor + '1A',
                },
              ]}
            >
              <Text
                style={[styles.networkBadgeText, { color: networkColor }]}
              >
                {networkSymbol}
              </Text>
            </View>
            {/* Risk badge */}
            <RiskBadge riskLevel={riskLevel(score)} />
          </View>
          <Text style={styles.detailAddr}>{wallet.address}</Text>

          {/* Stats grid */}
          <View style={styles.statsGrid}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>N/A</Text>
              <Text style={styles.statKey}>BALANCE</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statVal, { color: scoreColor }]}>
                {score.toFixed(1)}
              </Text>
              <Text style={styles.statKey}>CONTAGION</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statVal}>
                {wallet.last_activity
                  ? relativeTime(wallet.last_activity)
                  : '--'}
              </Text>
              <Text style={styles.statKey}>LAST TX</Text>
            </View>
          </View>
        </View>

        {/* Contagion section */}
        {contagion && (
          <View style={styles.csection}>
            <View style={styles.ctitleRow}>
              <View>
                <Text style={styles.cScoreLabel}>CONTAGION SCORE</Text>
                <View style={styles.cScoreRow}>
                  <Text style={[styles.cScoreBig, { color: scoreColor }]}>
                    {score.toFixed(1)}
                  </Text>
                  <Text style={styles.cScoreOutOf}> / 10</Text>
                </View>
                <Text style={styles.cSub}>
                  {contagion.highRiskCount > 0
                    ? `${contagion.highRiskCount} of ${contagion.nodeCount} neighbors are high risk`
                    : `${contagion.nodeCount} neighbors \u2014 no risks detected`}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.refreshBtn,
                  refreshingContagion && styles.buttonDisabled,
                ]}
                onPress={handleRefreshContagion}
                disabled={refreshingContagion}
                activeOpacity={0.7}
              >
                {refreshingContagion ? (
                  <ActivityIndicator color={Colors.accent} size="small" />
                ) : (
                  <Text style={styles.refreshBtnText}>REFRESH</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Graph */}
            {contagion.nodes.length > 0 ? (
              <ContagionGraph
                nodes={contagion.nodes as any}
                contagionScore={contagion.contagionScore}
                rootAddress={wallet.address}
              />
            ) : (
              <View style={styles.emptyGraph}>
                <Text style={styles.emptyGraphText}>
                  No contagion data available yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Recent Transactions placeholder */}
        <View style={styles.txSectionHeader}>
          <Text style={styles.txSectionLabel}>RECENT TRANSACTIONS</Text>
        </View>
        <View style={styles.txPlaceholder}>
          <Text style={styles.txPlaceholderText}>
            Transaction history coming soon
          </Text>
        </View>

        {/* Delete Wallet Button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDeleteWallet}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color={Colors.danger} />
          ) : (
            <Text style={styles.deleteButtonText}>Delete Wallet</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Back row
  backRow: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
  },
  backText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 10,
    color: Colors.accent,
  },

  // Detail header
  detailHeader: {
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailName: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 16,
    color: Colors.t1,
  },
  networkBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderWidth: 1,
  },
  networkBadgeText: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.5,
  },
  detailAddr: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t3,
    marginBottom: 8,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.s2,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statVal: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 14,
    color: Colors.t1,
    marginBottom: 2,
  },
  statKey: {
    fontFamily: Fonts.spaceMono,
    fontSize: 8,
    color: Colors.t3,
    letterSpacing: 0.8,
  },

  // Contagion section
  csection: {
    padding: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  ctitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cScoreLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t3,
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  cScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cScoreBig: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 32,
    lineHeight: 36,
  },
  cScoreOutOf: {
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
    color: Colors.t2,
  },
  cSub: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    marginTop: 3,
  },

  // Refresh button (subtle)
  refreshBtn: {
    backgroundColor: Colors.accent10,
    borderWidth: 1,
    borderColor: Colors.accent20,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  refreshBtnText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.accent,
    letterSpacing: 0.6,
  },

  // Empty graph
  emptyGraph: {
    backgroundColor: Colors.s1,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 32,
    alignItems: 'center',
  },
  emptyGraphText: {
    fontFamily: Fonts.interRegular,
    color: Colors.t2,
    fontSize: 13,
    textAlign: 'center',
  },

  // TX section
  txSectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 4,
  },
  txSectionLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t3,
    letterSpacing: 1.8,
  },
  txPlaceholder: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: Colors.s1,
    borderRadius: Radii.card,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
  },
  txPlaceholderText: {
    fontFamily: Fonts.interRegular,
    color: Colors.t2,
    fontSize: 12,
  },

  // Delete button
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: Radii.button,
    borderWidth: 1,
    borderColor: Colors.danger,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 18,
    marginBottom: 12,
  },
  deleteButtonText: {
    fontFamily: Fonts.syneBold,
    color: Colors.danger,
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    fontFamily: Fonts.interRegular,
    color: Colors.danger,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.s2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontFamily: Fonts.spaceMono,
    color: Colors.accent,
    fontSize: 13,
  },
});
