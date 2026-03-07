// app/(tabs)/alerts.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Alerts tab — SectionList grouped by date (TODAY / YESTERDAY / EARLIER),
// pull-to-refresh, unread badge, Act Now bottom sheet for HIGH/CRITICAL.
// Matches screen-03-alerts.html mockup.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApi, Alert, ActNowAction } from '../../hooks/useApi';
import AlertItem from '../../components/AlertItem';
import ActNowCard from '../../components/ActNowCard';
import { Colors, Fonts, Spacing, Radii } from '../../constants/theme';

// ── Date grouping ────────────────────────────────────────────────────────────

function getDateGroup(sentAt: string): string {
  const date = new Date(sentAt);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  if (date >= today) return 'TODAY';
  if (date >= yesterday) return 'YESTERDAY';
  return 'EARLIER';
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AlertsScreen() {
  const api = useApi();
  const router = useRouter();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Act Now bottom sheet state
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

  // ── Date-grouped sections ──────────────────────────────────────────────

  const sections = useMemo(() => {
    const groups: Record<string, Alert[]> = {};
    const order = ['TODAY', 'YESTERDAY', 'EARLIER'];
    alerts.forEach((a) => {
      const group = getDateGroup(a.sent_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(a);
    });
    return order.filter((g) => groups[g]).map((g) => ({ title: g, data: groups[g]! }));
  }, [alerts]);

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

  // ── Render helpers ─────────────────────────────────────────────────────

  const renderItem = ({ item }: { item: Alert }) => (
    <AlertItem
      alert={item}
      onActNow={handleActNow}
      onAcknowledge={handleAcknowledge}
    />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{section.title}</Text>
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>{'\u{1F6E1}\uFE0F'}</Text>
        <Text style={styles.emptyTitle}>No alerts yet</Text>
        <Text style={styles.emptySubtitle}>
          Your wallets are being monitored.
        </Text>
      </View>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        {unreadCount > 0 && (
          <View style={styles.badgeNew}>
            <Text style={styles.badgeNewText}>{unreadCount} new</Text>
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
          <ActivityIndicator color={Colors.accent} size="small" />
        </View>
      )}

      {/* ── Alert list (date-grouped SectionList) ─────────────────────── */}
      {!loading && (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
            />
          }
        />
      )}

      {/* ── Act Now bottom sheet ──────────────────────────────────────── */}
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
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 18,
    color: Colors.t1,
    letterSpacing: -0.02 * 18,
  },
  badgeNew: {
    backgroundColor: Colors.danger,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  badgeNewText: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 9,
    color: '#FFFFFF',
  },
  errorBanner: {
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,59,48,0.2)',
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
    color: Colors.danger,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 40,
    flexGrow: 1,
  },
  sectionRow: {
    paddingTop: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t3,
    letterSpacing: 3,
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
    fontFamily: Fonts.spaceMono,
    fontSize: 16,
    color: Colors.t1,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: Fonts.spaceMono,
    fontSize: 12,
    color: Colors.t2,
    textAlign: 'center',
    lineHeight: 18,
  },
});
