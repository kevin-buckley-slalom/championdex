import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface SubTabBarProps {
  activeTab: 'pokemon' | 'moves' | 'abilities' | 'items';
  onTabPress: (tab: string) => void;
}

const TABS = [
  { label: 'Pokémon', value: 'pokemon' },
  { label: 'Moves', value: 'moves' },
  { label: 'Abilities', value: 'abilities' },
  { label: 'Items', value: 'items' },
];

export const SubTabBar: React.FC<SubTabBarProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.value;
        const textColor = isActive ? colors.primary : colors.textMuted;
        const fontWeight = isActive ? '600' : '400';

        return (
          <Pressable
            key={tab.value}
            onPress={() => onTabPress(tab.value)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <Text style={[styles.tabText, { color: textColor, fontWeight }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    minHeight: 48,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.sm,
  },
});
