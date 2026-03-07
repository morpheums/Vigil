import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useApi, Wallet } from '../../hooks/useApi';
import { NETWORKS } from '../../constants/networks';
import WalletCard from '../../components/WalletCard';

export default function WalletsScreen() {
  const api = useApi();
  const router = useRouter();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Form state
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState(NETWORKS[0].id);
  const [label, setLabel] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add wallet');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3DFFA0" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={wallets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <WalletCard
            wallet={item}
            onPress={() => router.push(`/wallet-detail?walletId=${item.id}`)}
          />
        )}
        contentContainerStyle={wallets.length === 0 ? styles.emptyContainer : styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
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

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add Wallet Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Wallet</Text>
              <TouchableOpacity onPress={() => { resetForm(); setModalVisible(false); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {/* Address */}
            <Text style={styles.inputLabel}>Wallet Address</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0x... or sol... or T..."
              placeholderTextColor="#555555"
              value={address}
              onChangeText={setAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Network Picker */}
            <Text style={styles.inputLabel}>Network</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={network}
                onValueChange={setNetwork}
                style={styles.picker}
                dropdownIconColor="#888888"
                itemStyle={styles.pickerItem}
              >
                {NETWORKS.map((n) => (
                  <Picker.Item key={n.id} label={n.name} value={n.id} color="#FFFFFF" />
                ))}
              </Picker>
            </View>

            {/* Label (optional) */}
            <Text style={styles.inputLabel}>Label (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="My hot wallet"
              placeholderTextColor="#555555"
              value={label}
              onChangeText={setLabel}
            />

            {/* Email (optional) */}
            <Text style={styles.inputLabel}>Alert Email (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="you@example.com"
              placeholderTextColor="#555555"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

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
                <Text style={styles.submitButtonText}>Watch Wallet</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  },
  listContent: {
    paddingTop: 16,
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3DFFA0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3DFFA0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#080808',
    marginTop: -2,
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#080808',
  },
  modalContent: {
    padding: 24,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  cancelText: {
    color: '#3DFFA0',
    fontSize: 16,
    fontWeight: '500',
  },
  inputLabel: {
    color: '#888888',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 10,
    padding: 14,
    color: '#FFFFFF',
    fontSize: 15,
  },
  pickerWrapper: {
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#242424',
    borderRadius: 10,
    overflow: 'hidden',
  },
  picker: {
    color: '#FFFFFF',
  },
  pickerItem: {
    color: '#FFFFFF',
    backgroundColor: '#181818',
  },
  submitButton: {
    backgroundColor: '#3DFFA0',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    minHeight: 52,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#080808',
    fontSize: 16,
    fontWeight: '700',
  },
});
