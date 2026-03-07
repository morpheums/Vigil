import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import NetworkChips from '../../components/NetworkChips';
import { Colors, Fonts } from '../../constants/theme';
import {
  useApi,
  type RiskCheckResult,
  type PaymentRiskResult,
} from '../../hooks/useApi';

// -- Helpers ------------------------------------------------------------------

function riskEmoji(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return '\u{1F7E2}'; // green circle
    case 'MEDIUM':
      return '\u{1F7E1}'; // yellow circle
    case 'HIGH':
      return '\u{1F6A8}'; // siren
    case 'CRITICAL':
      return '\u{1F480}'; // skull
    default:
      return '\u{2753}'; // question mark
  }
}

function getRiskColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return Colors.accent;
    case 'MEDIUM':
      return Colors.warn;
    case 'HIGH':
      return Colors.danger;
    case 'CRITICAL':
      return Colors.critical;
    default:
      return Colors.t2;
  }
}

function getVerdictMessage(result: RiskCheckResult): string {
  if (result.isSanctioned) return 'DO NOT SEND \u2014 Sanctioned address';
  if (result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL')
    return 'HIGH RISK \u2014 Exercise extreme caution';
  if (result.riskLevel === 'MEDIUM')
    return 'MODERATE RISK \u2014 Proceed with caution';
  return 'LOW RISK \u2014 Address appears safe';
}

function getRiskHeaderBg(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return 'rgba(61,255,160,0.12)';
    case 'MEDIUM':
      return 'rgba(245,166,35,0.12)';
    case 'HIGH':
      return 'rgba(255,59,48,0.15)';
    case 'CRITICAL':
      return 'rgba(255,45,85,0.15)';
    default:
      return Colors.s2;
  }
}

function getRiskBorderColor(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return 'rgba(61,255,160,0.35)';
    case 'MEDIUM':
      return 'rgba(245,166,35,0.35)';
    case 'HIGH':
      return 'rgba(255,59,48,0.35)';
    case 'CRITICAL':
      return 'rgba(255,45,85,0.45)';
    default:
      return Colors.border;
  }
}

function getRiskVerdictBg(level: string): string {
  switch (level.toUpperCase()) {
    case 'LOW':
      return 'rgba(61,255,160,0.12)';
    case 'MEDIUM':
      return 'rgba(245,166,35,0.12)';
    case 'HIGH':
      return 'rgba(255,59,48,0.15)';
    case 'CRITICAL':
      return 'rgba(255,45,85,0.15)';
    default:
      return Colors.s2;
  }
}

// -- Component ----------------------------------------------------------------

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
  const [paymentResult, setPaymentResult] = useState<PaymentRiskResult | null>(
    null,
  );

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

  // Derived risk styling
  const riskColor = riskResult ? getRiskColor(riskResult.riskLevel) : Colors.t2;
  const riskBorderColor = riskResult
    ? getRiskBorderColor(riskResult.riskLevel)
    : Colors.border;
  const riskHeaderBg = riskResult
    ? getRiskHeaderBg(riskResult.riskLevel)
    : Colors.s2;
  const riskVerdictBg = riskResult
    ? getRiskVerdictBg(riskResult.riskLevel)
    : Colors.s2;
  const verdictMessage = riskResult ? getVerdictMessage(riskResult) : '';

  // -- Render -----------------------------------------------------------------

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Risk Check</Text>
          <Text style={styles.introSub}>
            Verify any address before sending funds
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Recipient Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>RECIPIENT ADDRESS</Text>
            <TextInput
              style={styles.fieldInput}
              value={recipientAddress}
              onChangeText={onRecipientChange}
              placeholder="0x... or wallet address"
              placeholderTextColor={Colors.t3}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Network */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NETWORK</Text>
            <NetworkChips
              layout="row"
              selected={network}
              onSelect={onNetworkChange}
            />
          </View>

          {/* Amount + Sender side by side */}
          <View style={styles.fieldRow}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>AMOUNT (USD)</Text>
              <TextInput
                style={styles.fieldInput}
                value={amountUsd}
                onChangeText={onAmountChange}
                placeholder="e.g. 2,500"
                placeholderTextColor={Colors.t3}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>MY ADDRESS (OPT.)</Text>
              <TextInput
                style={styles.fieldInput}
                value={senderAddress}
                onChangeText={onSenderChange}
                placeholder="0x742d...4e"
                placeholderTextColor={Colors.t3}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Check button */}
          <TouchableOpacity
            style={[styles.checkBtn, (!canCheck || loading) && { opacity: 0.4 }]}
            onPress={handleCheckRisk}
            disabled={!canCheck || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={Colors.t2} />
            ) : (
              <Text style={styles.checkBtnText}>
                {riskResult ? '\u2713 Checked' : 'Check Risk'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Risk Results */}
        {riskResult && (
          <View style={[styles.resultCard, { borderColor: riskBorderColor }]}>
            {/* Header */}
            <View
              style={[
                styles.resultHeader,
                { backgroundColor: riskHeaderBg, borderBottomColor: riskBorderColor },
              ]}
            >
              <View>
                <Text style={[styles.resultRisk, { color: riskColor }]}>
                  {riskEmoji(riskResult.riskLevel)}{' '}
                  {riskResult.riskLevel.toUpperCase()} RISK
                </Text>
                <Text style={styles.resultSubtext}>Counterparty risk score</Text>
              </View>
              <Text style={styles.resultScore}>
                {riskResult.riskScore} / 10
              </Text>
            </View>

            {/* Body rows */}
            <View style={styles.resultBody}>
              <View style={styles.resultRow}>
                <Text style={styles.resultKey}>OFAC SANCTIONED</Text>
                <Text
                  style={[
                    styles.resultVal,
                    riskResult.isSanctioned && styles.resultValBad,
                  ]}
                >
                  {riskResult.isSanctioned ? '\u{1F6AB} YES' : 'NO'}
                </Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultKey}>TOKEN BLACKLISTED</Text>
                <Text
                  style={[
                    styles.resultVal,
                    riskResult.isBlacklisted && styles.resultValBad,
                  ]}
                >
                  {riskResult.isBlacklisted ? '\u{1F6AB} YES' : 'NO'}
                </Text>
              </View>

              {/* Payment risk rows (when available) */}
              {paymentResult && (
                <>
                  <View style={styles.resultRow}>
                    <Text style={styles.resultKey}>PAYMENT RISK</Text>
                    <Text
                      style={[
                        styles.resultVal,
                        (paymentResult.overallRiskLevel === 'HIGH' ||
                          paymentResult.overallRiskLevel === 'CRITICAL') &&
                          styles.resultValBad,
                      ]}
                    >
                      {paymentResult.overallRiskLevel.toUpperCase()}
                    </Text>
                  </View>
                </>
              )}

              {/* Reasoning */}
              <Text style={styles.reasoning}>{riskResult.reasoning}</Text>
            </View>

            {/* Verdict bar */}
            <View
              style={[
                styles.verdict,
                {
                  backgroundColor: riskVerdictBg,
                  borderTopColor: riskBorderColor,
                },
              ]}
            >
              <Text style={[styles.verdictText, { color: riskColor }]}>
                {riskEmoji(riskResult.riskLevel)} {verdictMessage}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// -- Styles -------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },

  // Intro
  intro: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  introTitle: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 18,
    color: Colors.t1,
    marginBottom: 3,
  },
  introSub: {
    fontFamily: Fonts.interRegular,
    fontSize: 12,
    color: Colors.t2,
  },

  // Form
  form: {
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    letterSpacing: 2,
    marginBottom: 6,
  },
  fieldInput: {
    width: '100%',
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: Colors.t1,
    fontFamily: Fonts.spaceMono,
    fontSize: 10,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Check button
  checkBtn: {
    width: '100%',
    backgroundColor: Colors.s2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  checkBtnText: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 14,
    color: Colors.t2,
  },

  // Error
  errorCard: {
    backgroundColor: 'rgba(255,59,48,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.danger,
    padding: 14,
    marginHorizontal: 18,
    marginTop: 12,
  },
  errorText: {
    fontFamily: Fonts.interRegular,
    color: Colors.danger,
    fontSize: 13,
  },

  // Result card
  resultCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    marginHorizontal: 18,
    marginTop: 14,
  },
  resultHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
  },
  resultRisk: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  resultSubtext: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    marginTop: 4,
  },
  resultScore: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 13,
    color: Colors.t2,
  },

  // Result body
  resultBody: {
    backgroundColor: Colors.s2,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultKey: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    color: Colors.t2,
    letterSpacing: 1,
  },
  resultVal: {
    fontFamily: Fonts.spaceMono,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.t1,
  },
  resultValBad: {
    color: Colors.danger,
  },
  reasoning: {
    fontFamily: Fonts.interRegular,
    fontSize: 11,
    color: Colors.t2,
    lineHeight: 22,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },

  // Verdict bar
  verdict: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  verdictText: {
    fontFamily: Fonts.syneExtraBold,
    fontSize: 12,
  },
});
