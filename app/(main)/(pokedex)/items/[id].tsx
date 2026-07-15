import React, { useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useItemDetail } from '@/hooks/queries/useItemDetail';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { Image } from 'expo-image';

export default function ItemDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const itemId = parseInt(id ?? '0', 10);

  const { data: item, isLoading, error } = useItemDetail(itemId);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Item</Text>
        </View>
        <EmptyState
          message="Failed to load item"
          subMessage={error?.message}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Item</Text>
        </View>
        <LoadingSpinner message="Loading item..." />
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Item</Text>
        </View>
        <EmptyState
          message="Item not found"
          subMessage="Try searching again"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {item.displayName}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Item Name and Sprite */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{item.displayName}</Text>
          {item.spriteUrl && (
            <View style={styles.spriteContainer}>
              <Image
                source={{ uri: item.spriteUrl }}
                style={styles.sprite}
                contentFit="contain"
              />
            </View>
          )}
        </View>

        {/* Item Info */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Category</Text>
              <Text style={styles.infoBadgeValue}>
                {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
              </Text>
            </View>
            {item.cost !== null && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeLabel}>Cost</Text>
                <Text style={styles.infoBadgeValue}>{item.cost}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  spriteContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 150,
  },
  sprite: {
    width: 100,
    height: 100,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  infoBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBadgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoBadgeValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
});
