import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  message: {
    marginTop: spacing.lg,
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
  },
});
