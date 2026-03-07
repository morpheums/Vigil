import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams } from 'expo-router';

import { NETWORKS } from '../../constants/networks';
import {
  useApi,
  type RiskCheckResult,
  type PaymentRiskResult,
} from '../../hooks/useApi';

// ── Design tokens ───────────────────────────────────────────────────────────
const COLORS = {
  bg: '#080808',
  surface: '#111111',
  surfaceAlt: '#181818',
  accent: '#3DFFA0',
  border: '#242424',
  danger: '#FF3B30',
  warning: '#F5A623',
  text: '#FFFFFF',
  secondary: '#888888',
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function riskEmoji(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return '\u{1F7E2}'; // green circle
    case 'MEDIUM':
      return '\u{1F7E1}'; // yellow circle
    case 'HIGH':
      return '\u{1F534}'; // red circle
    case 'CRITICAL':
      return '\u{1F480}'; // skull
    default:
      return '\u{2753}'; // question mark
  }
}

function verdictStyle(level: string): { bg: string; border?: string } {
  switch (level.toUpperCase()) {
    case 'LOW':
      return { bg: '#0A3D1F' };
    case 'MEDIUM':
      return { bg: '#3D3A0A' };
    case 'HIGH':
      return { bg: '#3D0A0A' };
    case 'CRITICAL':
      return { bg: '#1A0A0A', border: COLORS.danger };
    default:
      return { bg: COLORS.surfaceAlt };
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function SafeSendScreen() {
  const api = useApi();
  const params = useLocalSearchParams<{ address?: string }>();

  // Form state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [network, setNetwork] = useState('');
  const [amountUsd, setAmountUsd] = useState('');
  const [senderAddress, setSenderAddress] = useState('');

  // Results state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [riskResult, setRiskResult] = useState<RiskCheckResult | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentRiskResult | null>(null);

  // Deep-link: pre-fill address from query param
  useEffect(() => {
    if (params.address) {
      setRecipientAddress(params.address);
    }
  }, [params.address]);

  // Clear results when any input changes
  function clearResults() {
    setRiskResult(null);
    setPaymentResult(null);
    setError(null);
  }

  function onRecipientChange(text: string) {
    setRecipientAddress(text);
    clearResults();
  }

  function onNetworkChange(value: string) {
    setNetwork(value);
    clearResults();
  }

  function onAmountChange(text: string) {
    setAmountUsd(text);
    clearResults();
  }

  function onSenderChange(text: string) {
    setSenderAddress(text);
    clearResults();
  }

  const canCheck = recipientAddress.trim().length > 0 && network.length > 0;

  async function handleCheckRisk() {
    if (!canCheck) return;

    setLoading(true);
    setError(null);
    setRiskResult(null);
    setPaymentResult(null);

    try {
      // Always run basic risk check
      const risk = await api.checkRisk({
        address: recipientAddress.trim(),
        network,
      });
      setRiskResult(risk);

      // If sender provided, also run payment risk
      if (senderAddress.trim().length > 0) {
        const payment = await api.checkPaymentRisk({
          senderAddress: senderAddress.trim(),
          senderNetwork: network,
          recipientAddress: recipientAddress.trim(),
          recipientNetwork: network,
          amountUsd: amountUsd ? parseFloat(amountUsd) : undefined,
        });
        setPaymentResult(payment);
      }
    } catch (err: any) {
      setError(err.message || 'Risk check failed');
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <Text style={styles.title}>SafeSend</Text>
        <Text style={styles.subtitle}>
          Check any address before sending funds
        </Text>

        {/* Form */}
        <View style={styles.card}>
          {/* Recipient Address */}
          <Text style={styles.label}>Recipient Address *</Text>
          <TextInput
            style={styles.input}
            value={recipientAddress}
            onChangeText={onRecipientChange}
            placeholder="0x... or wallet address"
            placeholderTextColor={COLORS.secondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Network Picker */}
          <Text style={styles.label}>Network *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={network}
              onValueChange={onNetworkChange}
              style={styles.picker}
              dropdownIconColor={COLORS.secondary}
            >
              <Picker.Item
                label="Select a network..."
                value=""
                color={COLORS.secondary}
              />
              {NETWORKS.map((n) => (
                <Picker.Item
                  key={n.id}
                  label={`${n.name} (${n.symbol})`}
                  value={n.id}
                  color={Platform.OS === 'ios' ? COLORS.text : undefined}
                />
              ))}
            </Picker>
          </View>

          {/* Amount USD */}
          <Text style={styles.label}>Amount USD (optional)</Text>
          <TextInput
            style={styles.input}
            value={amountUsd}
            onChangeText={onAmountChange}
            placeholder="e.g. 1000"
            placeholderTextColor={COLORS.secondary}
            keyboardType="numeric"
          />

          {/* Sender Address */}
          <Text style={styles.label}>My Address / Sender (optional)</Text>
          <Text style={styles.hint}>
            Provide your address to enable payment risk analysis
          </Text>
          <TextInput
            style={styles.input}
            value={senderAddress}
            onChangeText={onSenderChange}
            placeholder="Your wallet address"
            placeholderTextColor={COLORS.secondary}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Check Risk Button */}
          <Pressable
            style={[
              styles.button,
              !canCheck && styles.buttonDisabled,
            ]}
            onPress={handleCheckRisk}
            disabled={!canCheck || loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <Text style={styles.buttonText}>Check Risk</Text>
            )}
          </Pressable>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Risk Results */}
        {riskResult && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Risk Report</Text>

            {/* Verdict Banner */}
            {(() => {
              const v = verdictStyle(riskResult.riskLevel);
              return (
                <View
                  style={[
                    styles.verdictBanner,
                    { backgroundColor: v.bg },
                    v.border ? { borderColor: v.border, borderWidth: 1 } : null,
                  ]}
                >
                  <Text style={styles.verdictText}>
                    {riskEmoji(riskResult.riskLevel)} {riskResult.riskLevel.toUpperCase()}
                  </Text>
                </View>
              );
            })()}

            {/* Score */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Risk Score</Text>
              <Text style={styles.rowValue}>{riskResult.riskScore}/10</Text>
            </View>

            {/* OFAC Sanctioned */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>OFAC Sanctioned</Text>
              <Text style={styles.rowValue}>
                {riskResult.isSanctioned ? '\u{1F6AB} SANCTIONED' : '\u{2705} Clean'}
              </Text>
            </View>

            {/* Token Blacklisted */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Token Blacklisted</Text>
              <Text style={styles.rowValue}>
                {riskResult.isBlacklisted ? '\u{1F6AB} BLACKLISTED' : '\u{2705} Clean'}
              </Text>
            </View>

            {/* Reasoning */}
            <Text style={styles.reasoningLabel}>Reasoning</Text>
            <Text style={styles.reasoningText}>{riskResult.reasoning}</Text>
          </View>
        )}

        {/* Payment Risk Results */}
        {paymentResult && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Risk Breakdown</Text>

            {/* Overall */}
            {(() => {
              const v = verdictStyle(paymentResult.overallRiskLevel);
              return (
                <View
                  style={[
                    styles.verdictBanner,
                    { backgroundColor: v.bg },
                    v.border ? { borderColor: v.border, borderWidth: 1 } : null,
                  ]}
                >
                  <Text style={styles.verdictText}>
                    {riskEmoji(paymentResult.overallRiskLevel)}{' '}
                    Overall: {paymentResult.overallRiskLevel.toUpperCase()} ({paymentResult.riskScore}/10)
                  </Text>
                </View>
              );
            })()}

            {/* Sender Risk */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Sender Risk</Text>
              <Text style={styles.rowValue}>
                {riskEmoji(paymentResult.senderRisk.risk_level)}{' '}
                {paymentResult.senderRisk.risk_level.toUpperCase()} ({paymentResult.senderRisk.risk_score}/10)
              </Text>
            </View>

            {/* Recipient Risk */}
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Recipient Risk</Text>
              <Text style={styles.rowValue}>
                {riskEmoji(paymentResult.recipientRisk.risk_level)}{' '}
                {paymentResult.recipientRisk.risk_level.toUpperCase()} ({paymentResult.recipientRisk.risk_score}/10)
              </Text>
            </View>

            {/* Risk Factors */}
            {paymentResult.riskFactors.length > 0 && (
              <>
                <Text style={styles.reasoningLabel}>Risk Factors</Text>
                {paymentResult.riskFactors.map((factor, i) => (
                  <Text key={i} style={styles.factorText}>
                    {'\u2022'} {factor}
                  </Text>
                ))}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: 6,
    marginTop: 12,
  },
  hint: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerWrapper: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    height: Platform.OS === 'ios' ? 180 : 48,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#2A0A0A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 14,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  verdictBanner: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  verdictText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  reasoningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.secondary,
    marginTop: 14,
    marginBottom: 6,
  },
  reasoningText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  factorText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 2,
  },
});
