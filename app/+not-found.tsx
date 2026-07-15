import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Screen not found</Text>
      <Link href="/(main)/(pokedex)" style={styles.link}>
        Go to Pokédex
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 20, marginBottom: 16 },
  link: { color: colors.primary, fontSize: 16 },
});
