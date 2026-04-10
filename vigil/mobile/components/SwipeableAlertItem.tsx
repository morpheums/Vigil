// components/SwipeableAlertItem.tsx
// Swipe-left-to-mark-read wrapper around AlertItem.

import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import AlertItem from './AlertItem';
import { Alert } from '../hooks/useApi';
import { Colors, Fonts } from '../constants/theme';

interface SwipeableAlertItemProps {
  alert: Alert;
  onActNow: (alert: Alert) => void;
  onAcknowledge: (alertId: number) => void;
}

function renderRightActions() {
  return (
    <View style={styles.rightAction}>
      <Text style={styles.checkmark}>{'\u2713'}</Text>
      <Text style={styles.readLabel}>Read</Text>
    </View>
  );
}

export default function SwipeableAlertItem({ alert, onActNow, onAcknowledge }: SwipeableAlertItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  // Already acknowledged — render plain AlertItem, no swipe
  if (alert.acknowledged === 1) {
    return <AlertItem alert={alert} onActNow={onActNow} onAcknowledge={onAcknowledge} />;
  }

  const handleSwipeOpen = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      onAcknowledge(alert.id);
      swipeableRef.current?.close();
    }
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
    >
      <AlertItem alert={alert} onActNow={onActNow} onAcknowledge={onAcknowledge} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightAction: {
    width: 90,
    backgroundColor: Colors.accent + 'CC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  readLabel: {
    fontFamily: Fonts.spaceMono,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
