import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, subMessage }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>?</Text>
      <Text style={styles.message}>{message}</Text>
      {subMessage && <Text style={styles.subMessage}>{subMessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  message: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subMessage: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
