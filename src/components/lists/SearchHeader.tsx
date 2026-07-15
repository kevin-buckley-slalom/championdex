import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface SearchHeaderProps {
  title: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchHeaderComponent: React.FC<SearchHeaderProps> = ({
  title,
  value,
  onChangeText,
  placeholder,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || 'Search...'}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
        />
      </View>
    </View>
  );
};

export const SearchHeader = React.memo(SearchHeaderComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
    fontSize: fontSize.md,
    color: colors.textMuted,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    padding: 0,
  },
});
