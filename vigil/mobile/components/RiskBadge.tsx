import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../constants/theme';

const LEVEL_META: Record<string, { color: string; label: string }> = {
  VERY_LOW: { color: Colors.accent, label: 'VERY LOW' },
  LOW:      { color: Colors.accent, label: 'LOW' },
  MEDIUM:   { color: Colors.warn, label: 'MEDIUM' },
  HIGH:     { color: Colors.danger, label: 'HIGH' },
  CRITICAL: { color: Colors.critical, label: 'CRITICAL' },
};

interface RiskBadgeProps {
  riskLevel: string;
}

export default function RiskBadge({ riskLevel }: RiskBadgeProps) {
  const normalized = riskLevel.toUpperCase().replace(/[\s-]/g, '_');
  const meta = LEVEL_META[normalized] || { color: Colors.t2, label: riskLevel.toUpperCase() };

  return (
    <View style={[styles.badge, {
      backgroundColor: meta.color + '1A',
      borderColor: meta.color + '4D',
    }]}>
      <Text style={[styles.label, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  label: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.5,
  },
});
