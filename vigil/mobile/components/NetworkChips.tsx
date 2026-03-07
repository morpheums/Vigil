import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NETWORKS, Network } from '../constants/networks';
import { Colors, Fonts } from '../constants/theme';
import NetworkLogo from './NetworkLogo';

interface NetworkChipsProps {
  networks?: Network[];
  selected: string;
  onSelect: (networkId: string) => void;
  layout: 'grid' | 'row';
}

export default function NetworkChips({
  networks = NETWORKS,
  selected,
  onSelect,
  layout,
}: NetworkChipsProps) {
  if (layout === 'grid') {
    return (
      <View style={styles.grid}>
        {networks.map((n) => {
          const isSelected = selected === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.gridCell,
                isSelected && {
                  borderColor: n.color + 'AA',
                  backgroundColor: n.color + '30',
                },
              ]}
              onPress={() => onSelect(n.id)}
              activeOpacity={0.7}
            >
              <NetworkLogo networkId={n.id} size={24} />
              <Text style={[styles.gridSymbol, { color: isSelected ? n.color : Colors.t1 }]}>{n.symbol}</Text>
              <Text style={[styles.gridName, isSelected && { color: n.color }]}>{n.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Row mode (horizontal scrollable chips)
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
      <View style={styles.row}>
        {networks.map((n) => {
          const isSelected = selected === n.id;
          return (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.chip,
                isSelected
                  ? { borderColor: n.color + '66', backgroundColor: n.color + '26' }
                  : { borderColor: Colors.border, backgroundColor: 'transparent' },
              ]}
              onPress={() => onSelect(n.id)}
              activeOpacity={0.7}
            >
              <NetworkLogo networkId={n.id} size={16} />
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? n.color : Colors.t1 },
                ]}
              >
                {n.symbol}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Grid mode (Add Wallet bottom sheet)
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  gridCell: {
    width: '31.5%' as any,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.s2,
  },
  gridSymbol: {
    fontFamily: Fonts.spaceMono,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  gridName: {
    fontFamily: Fonts.interMedium,
    fontSize: 11,
    color: Colors.t1,
  },
  // Row mode (SafeSend)
  rowScroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: Fonts.spaceMono,
    fontSize: 9,
    fontWeight: '700',
  },
});
