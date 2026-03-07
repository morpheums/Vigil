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
import ContagionGraph from '../components/ContagionGraph';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function contagionColor(score: number): string {
  if (score < 2) return '#3DFFA0';
  if (score < 4) return '#3DFFA0';
  if (score < 6) return '#F5A623';
  if (score < 8) return '#FF3B30';
  return '#FF2D55';
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
        <ActivityIndicator size="large" color="#3DFFA0" />
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {wallet.label || 'Wallet'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Wallet Info */}
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>
            {wallet.label || 'Unnamed Wallet'}
          </Text>
          <Text style={styles.walletAddress}>
            {truncateAddress(wallet.address)}
          </Text>
          <Text style={styles.walletNetwork}>{wallet.network}</Text>
        </View>

        {/* Contagion Score Summary */}
        {contagion && (
          <View style={styles.scoreSummary}>
            <Text style={styles.scoreLabel}>CONTAGION SCORE</Text>
            <View style={styles.scoreRow}>
              <Text
                style={[
                  styles.scoreNumber,
                  { color: contagionColor(contagion.contagionScore) },
                ]}
              >
                {contagion.contagionScore.toFixed(1)}
              </Text>
              <Text style={styles.scoreOutOf}> / 10</Text>
            </View>
            <Text style={styles.scoreSubtitle}>
              {contagion.highRiskCount > 0
                ? `${contagion.highRiskCount} of ${contagion.nodeCount} neighbors are high risk`
                : `${contagion.nodeCount} neighbors — no risks detected`}
            </Text>
          </View>
        )}

        {/* Contagion Graph */}
        {contagion && contagion.nodes.length > 0 && (
          <View style={styles.graphSection}>
            <ContagionGraph
              nodes={contagion.nodes as any}
              contagionScore={contagion.contagionScore}
              rootAddress={wallet.address}
            />
          </View>
        )}

        {contagion && contagion.nodes.length === 0 && (
          <View style={styles.emptyGraph}>
            <Text style={styles.emptyGraphText}>
              No contagion data available yet.
            </Text>
          </View>
        )}

        {/* Refresh Contagion Button */}
        <TouchableOpacity
          style={[
            styles.refreshButton,
            refreshingContagion && styles.buttonDisabled,
          ]}
          onPress={handleRefreshContagion}
          disabled={refreshingContagion}
          activeOpacity={0.8}
        >
          {refreshingContagion ? (
            <ActivityIndicator color="#080808" />
          ) : (
            <Text style={styles.refreshButtonText}>Refresh Contagion</Text>
          )}
        </TouchableOpacity>

        {/* Delete Wallet Button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && styles.buttonDisabled]}
          onPress={handleDeleteWallet}
          disabled={deleting}
          activeOpacity={0.8}
        >
          {deleting ? (
            <ActivityIndicator color="#FFFFFF" />
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
    backgroundColor: '#080808',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#242424',
  },
  backText: {
    color: '#3DFFA0',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  walletInfo: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#181818',
  },
  walletLabel: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  walletAddress: {
    color: '#888888',
    fontSize: 14,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  walletNetwork: {
    color: '#888888',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreSummary: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  scoreLabel: {
    fontSize: 9,
    color: '#888888',
    letterSpacing: 1.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  scoreOutOf: {
    fontSize: 12,
    color: '#555555',
  },
  scoreSubtitle: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  graphSection: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  emptyGraph: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242424',
    padding: 32,
    alignItems: 'center',
  },
  emptyGraphText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#3DFFA0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 52,
  },
  refreshButtonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 52,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#181818',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#242424',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#3DFFA0',
    fontSize: 15,
    fontWeight: '600',
  },
});
