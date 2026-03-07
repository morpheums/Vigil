import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useApi, Wallet } from '../../hooks/useApi';
import { NETWORKS } from '../../constants/networks';
import { Colors, Fonts, Radii } from '../../constants/theme';
import WalletCard from '../../components/WalletCard';
import NetworkChips from '../../components/NetworkChips';

export default function WalletsScreen() {
  const api = useApi();
  const router = useRouter();
  const navigation = useNavigation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(NETWORKS[0].id);
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Header right buttons: pulse dot + Add button
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerRight}>
          <View style={styles.pulse} />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => bottomSheetRef.current?.present()}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  const loadWallets = useCallback(async () => {
    try {
      const data = await api.getWallets();
      setWallets(data);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load wallets');
    }
  }, []);

  useEffect(() => {
    loadWallets().finally(() => setLoading(false));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWallets();
    setRefreshing(false);
  }, [loadWallets]);

  const resetForm = () => {
    setAddress('');
    setNetwork(NETWORKS[0].id);
    setLabel('');
    setEmail('');
  };

  const handleAddWallet = async () => {
    if (!address.trim()) {
      Alert.alert('Validation', 'Wallet address is required.');
      return;
    }

    setSubmitting(true);
    try {
      await api.addWallet({
        address: address.trim(),
        network,
        label: label.trim() || undefined,
        alertEmail: email.trim() || undefined,
      });
      await loadWallets();
      resetForm();
      bottomSheetRef.current?.dismiss();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add wallet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <WalletCard
            wallet={item}
            onPress={() => router.push(`/wallet-detail?walletId=${item.id}`)}
            isActive={index === 0}
          />
        )}
        contentContainerStyle={wallets.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          wallets.length > 0 ? (
            <View style={styles.sectionRow}>
              <Text style={styles.sectionLabel}>WATCHING</Text>
              <Text style={styles.sectionCount}>{wallets.length} wallets</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{'\uD83D\uDEE1\uFE0F'}</Text>
            <Text style={styles.emptyTitle}>No wallets yet</Text>
            <Text style={styles.emptySubtitle}>
              Add your first to start watching.
            </Text>
          </View>
        }
      />

      {/* Add Wallet Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={['85%']}
        backgroundStyle={{ backgroundColor: Colors.s1 }}
        handleIndicatorStyle={{ backgroundColor: Colors.border2 }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        enablePanDownToClose
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          {/* Sheet Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Watch a Wallet</Text>
            <TouchableOpacity
              style={styles.sheetClose}
              onPress={() => { resetForm(); bottomSheetRef.current?.dismiss(); }}
              activeOpacity={0.7}
            >
              <Text style={styles.sheetCloseText}>{'\u2715'}</Text>
            </TouchableOpacity>
          </View>

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>WALLET ADDRESS</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="0x742d35Cc6634C0532925a3b..."
              placeholderTextColor={Colors.t2}
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.helperText}>
              Paste any ETH, SOL, TRX, ATOM, OSMO or XLM address
            </Text>
          </View>

          {/* Network Picker */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NETWORK</Text>
            <NetworkChips layout="grid" selected={network} onSelect={setNetwork} />
          </View>

          {/* Label */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              LABEL <Text style={styles.optTag}>OPTIONAL</Text>
            </Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Main Wallet"
              placeholderTextColor={Colors.t2}
              value={label}
              onChangeText={setLabel}
            />
          </View>

          {/* Alert Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              ALERT EMAIL <Text style={styles.optTag}>OPTIONAL</Text>
            </Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="you@email.com"
              placeholderTextColor={Colors.t2}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleAddWallet}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#080808" />
            ) : (
              <Text style={styles.submitButtonText}>
                Watch Wallet
              </Text>
            )}
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheetModal>
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
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: Fonts.syneBold,
    color: Colors.t1,
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: Fonts.interRegular,
    color: Colors.t2,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Section row (WATCHING header)
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
    color: Colors.t2,
    letterSpacing: 3,
  },
  sectionCount: {
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
    color: Colors.t2,
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
    overflow: 'hidden',
  },

  // Header right
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  addBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  addBtnText: {
    fontFamily: Fonts.syneBold,
    fontSize: 12,
    color: '#000',
  },

  // Bottom sheet
  sheetContent: {
    padding: 18,
    paddingTop: 0,
    paddingBottom: 32,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 18,
  },
  sheetTitle: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 18,
    color: Colors.t1,
    letterSpacing: -0.3,
  },
  sheetClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: {
    fontSize: 12,
    color: Colors.t2,
  },

  // Form fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 12,
    color: Colors.t1,
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  fieldInput: {
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    color: Colors.t1,
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
  },
  helperText: {
    fontFamily: Fonts.interRegular,
    fontSize: 10,
    color: Colors.t1,
    marginTop: 5,
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  optTag: {
    fontFamily: Fonts.spaceMono,
    fontSize: 8,
    color: Colors.t1,
    letterSpacing: 0.5,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  fieldRowItem: {
    flex: 1,
  },

  // Submit
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radii.button,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 15,
    color: '#000',
    letterSpacing: 0.1,
  },
});
