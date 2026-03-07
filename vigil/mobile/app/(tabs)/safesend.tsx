import { StyleSheet, Text, View } from 'react-native';

export default function SafeSendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SafeSend</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#080808',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
