import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import VigilLogo from '../../components/VigilLogo';

function HeaderTitle() {
  return (
    <View style={styles.headerTitle}>
      <VigilLogo size={28} />
      <Text style={styles.headerText}>VIGIL</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3DFFA0',
        tabBarInactiveTintColor: '#555',
        tabBarStyle: {
          backgroundColor: '#080808',
          borderTopColor: '#222222',
        },
        headerStyle: {
          backgroundColor: '#080808',
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
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
});
