import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import VigilLogo from '../../components/VigilLogo';
import { Colors, Fonts } from '../../constants/theme';

function HeaderTitle() {
  return (
    <View style={styles.headerTitle}>
      <VigilLogo size={28} />
      <View>
        <Text style={styles.headerText}>VIGIL</Text>
        <Text style={styles.headerSub}>BY RANGE</Text>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: Colors.s1,
          borderTopColor: Colors.border,
        },
        headerStyle: {
          backgroundColor: Colors.bg,
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerTitle: () => <HeaderTitle />,
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'shield.fill', android: 'shield', web: 'shield' }}
              tintColor={color}
              size={24}
            />
          ),
          tabBarLabel: 'Wallets',
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="safesend"
        options={{
          title: 'SafeSend',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    color: Colors.t1,
    fontFamily: Fonts.syneExtraBold,
    fontSize: 18,
    letterSpacing: 2,
  },
  headerSub: {
    fontFamily: Fonts.spaceMono,
    fontSize: 7,
    color: Colors.accent,
    letterSpacing: 2.5,
    marginTop: -2,
  },
});
