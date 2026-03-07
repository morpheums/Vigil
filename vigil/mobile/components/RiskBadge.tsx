import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const LEVEL_COLORS: Record<string, string> = {
  VERY_LOW: '#3DFFA0',
  LOW: '#3DFFA0',
  MEDIUM: '#F5A623',
  HIGH: '#FF8C00',
  CRITICAL: '#FF3B30',
};

interface RiskBadgeProps {
  riskLevel: string;
  size?: 'sm' | 'md';
}

export default function RiskBadge({ riskLevel, size = 'md' }: RiskBadgeProps) {
  const normalized = riskLevel.toUpperCase().replace(/[\s-]/g, '_');
  const color = LEVEL_COLORS[normalized] || '#888888';
  const dotSize = size === 'sm' ? 6 : 8;
  const fontSize = size === 'sm' ? 11 : 13;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          { width: dotSize, height: dotSize, borderRadius: dotSize / 2, backgroundColor: color },
        ]}
      />
      <Text style={[styles.label, { color, fontSize }]}>
        {riskLevel.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {},
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
