// app/(tabs)/alerts.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Alerts tab — shows all alerts sorted by sent_at DESC, pull-to-refresh,
// unread count in header, Act Now modal for HIGH/CRITICAL alerts.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApi, Alert, ActNowAction } from '../../hooks/useApi';
import AlertItem from '../../components/AlertItem';
import ActNowCard from '../../components/ActNowCard';

export default function AlertsScreen() {
  const api = useApi();
  const router = useRouter();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Act Now modal state
  const [actNowAlert, setActNowAlert] = useState<Alert | null>(null);
  const [actNowVisible, setActNowVisible] = useState(false);

  // ── Fetch alerts ───────────────────────────────────────────────────────

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await api.getAlerts();
      // Sort by sent_at DESC (newest first)
      const sorted = data.sort(
        (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
      );
      setAlerts(sorted);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load alerts';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchAlerts();
      setLoading(false);
    })();
  }, [fetchAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  // ── Unread count ───────────────────────────────────────────────────────

  const unreadCount = alerts.filter((a) => a.acknowledged === 0).length;

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleActNow = (alert: Alert) => {
    setActNowAlert(alert);
    setActNowVisible(true);
  };

  const handleCloseActNow = () => {
    setActNowVisible(false);
    setActNowAlert(null);
  };

  const handleActionPress = useCallback((action: ActNowAction): boolean => {
    if (action.id === 'safesend_check' && action.counterparty) {
      // Close the modal, then navigate to SafeSend with the address pre-filled
      handleCloseActNow();
      router.push(`/safesend?address=${action.counterparty}`);
      return true; // handled — skip default Linking behavior
    }
    return false;
  }, [router]);

  const handleAcknowledge = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      // Update local state — mark as acknowledged
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: 1 } : a))
      );
    } catch {
      // silently fail — will sync on next refresh
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Alert }) => (
    <AlertItem
      alert={item}
      onActNow={handleActNow}
      onAcknowledge={handleAcknowledge}
    />
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{'🛡️'}</Text>
        <Text style={styles.emptyTitle}>No alerts yet</Text>
        <Text style={styles.emptySubtitle}>
          Your wallets are being monitored.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* ── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Loading state ───────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#3DFFA0" size="small" />
        </View>
      )}

      {/* ── Alert list ──────────────────────────────────────────────────── */}
      {!loading && (
        <FlatList
          data={alerts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3DFFA0"
              colors={['#3DFFA0']}
            />
          }
        />
      )}

      {/* ── Act Now modal ───────────────────────────────────────────────── */}
      <ActNowCard
        alert={actNowAlert}
        visible={actNowVisible}
        onClose={handleCloseActNow}
        onAcknowledge={handleAcknowledge}
        onActionPress={handleActionPress}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'SpaceMono',
    letterSpacing: 0.3,
  },
  unreadBadge: {
    marginLeft: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,59,48,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  errorText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    color: '#FF3B30',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 18,
    paddingBottom: 40,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'SpaceMono',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
