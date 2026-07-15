import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/constants/colors';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Settings — coming soon</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: colors.textMuted, fontSize: 16 },
});
