// mobile/components/NetworkLogo.tsx
// Drop-in component — shows real network logo with graceful text fallback

import { useState } from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { getNetwork } from '../constants/networks';

interface NetworkLogoProps {
  networkId: string;
  size?: number;
}

export default function NetworkLogo({ networkId, size = 32 }: NetworkLogoProps) {
  const [failed, setFailed] = useState(false);
  const net = getNetwork(networkId);
  if (!net) return null;

  const radius = size / 2;

  if (failed) {
    // Graceful fallback: colored circle with emoji/letter
    return (
      <View style={[
        styles.fallback,
        {
          width: size, height: size, borderRadius: radius,
          backgroundColor: net.color + '25',
          borderColor: net.color + '50',
        }
      ]}>
        <Text style={[styles.fallbackText, { color: net.color, fontSize: size * 0.38 }]}>
          {net.emoji}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: net.logoUri }}
      style={{ width: size, height: size, borderRadius: radius }}
      onError={() => setFailed(true)}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fallbackText: {
    fontFamily: 'SpaceMono',
    fontWeight: '700',
  },
});
