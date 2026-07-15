import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

interface AbilitiesSectionProps {
  abilities: Array<{ id: number; displayName: string; isHidden: boolean }>;
  accentColor: string;
  onAbilityPress: (id: number) => void;
}

const styles = StyleSheet.create({
  columnsContainer: {
    flexDirection: 'row',
    // gap: 16,
  },
  column: {
    flex: 1,
  },
  columnLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  abilityList: {
    gap: 4,
  },
  abilityRow: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  abilityRowPressed: {
    opacity: 0.65,
  },
  accentBar: {
    width: 2,
    height: 18,
    alignSelf: 'center',
    marginRight: 8,
  },
  abilityName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: 21,
    color: colors.textMuted,
    opacity: 0.6,
    marginLeft: 24,
  },
});

function AbilityColumn({
  title,
  abilities,
  accentColor,
  onAbilityPress,
}: {
  title: string;
  abilities: Array<{ id: number; displayName: string; isHidden: boolean }>;
  accentColor: string;
  onAbilityPress: (id: number) => void;
}) {
  const [maxNameWidth, setMaxNameWidth] = React.useState<number>(0);

  if (abilities.length === 0) {
    return null;
  }

  return (
    <View style={styles.column}>
      <Text style={styles.columnLabel}>{title}</Text>
      <View style={styles.abilityList}>
        {abilities.map((ability) => (
          <Pressable
            key={ability.id}
            onPress={() => onAbilityPress(ability.id)}
            style={({ pressed }) => [
              styles.abilityRow,
              pressed && styles.abilityRowPressed,
            ]}
          >
            <View
              style={[styles.accentBar, { backgroundColor: accentColor }]}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.abilityName,
                { width: maxNameWidth > 0 ? maxNameWidth : undefined },
              ]}
              onLayout={(e) => {
                const w = e?.nativeEvent?.layout?.width;
                if (w) setMaxNameWidth((prev) => Math.max(prev, w));
              }}
            >
              {ability.displayName}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function AbilitiesSection({
  abilities,
  accentColor,
  onAbilityPress,
}: AbilitiesSectionProps) {
  const regularAbilities = abilities.filter((a) => !a.isHidden);
  const hiddenAbilities = abilities.filter((a) => a.isHidden);

  return (
    <View style={styles.columnsContainer}>
      <AbilityColumn
        title="ABILITIES"
        abilities={regularAbilities}
        accentColor={accentColor}
        onAbilityPress={onAbilityPress}
      />
      <AbilityColumn
        title="HIDDEN"
        abilities={hiddenAbilities}
        accentColor={accentColor}
        onAbilityPress={onAbilityPress}
      />
    </View>
  );
}
