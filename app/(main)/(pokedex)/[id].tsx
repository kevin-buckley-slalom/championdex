import React, { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';
import { colors, typeColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { usePokemonDetail } from '@/hooks/queries/usePokemonDetail';
import { usePokemonSpeciesData } from '@/hooks/queries/usePokemonSpeciesData';
import { usePokemonAbilities } from '@/hooks/queries/usePokemonAbilities';
import { useRelatedForms } from '@/hooks/queries/useRelatedForms';
import { useFormVariants } from '@/hooks/queries/useFormVariants';
import { prefetchShinyArtwork, isImageCached, getShinyHomeRenderUrl } from '@/services/prefetch/artworkPrefetchService';
import { EmptyState } from '@/components/common/EmptyState';
import { TypeBadge } from '@/components/common/TypeBadge';
import { PokemonHero } from '@/components/pokemon/PokemonHero';
import { computeFormLabel } from '@/utils/pokemonUtils';

import { StatChart } from '@/components/pokemon/StatChart';
import { TypeEffectivenessTable } from '@/components/pokemon/TypeEffectivenessTable';
import { RelatedFormsSection } from '@/components/pokemon/RelatedFormsSection';
import { CosmeticAlternatesSection } from '@/components/pokemon/CosmeticAlternatesSection';
import { TypeVariantsSection } from '@/components/pokemon/TypeVariantsSection';
import { FlavorTextSection } from '@/components/pokemon/FlavorTextSection';
import { EvolutionChain } from '@/components/pokemon/EvolutionChain';
import { EncounterLocationsSection } from '@/components/pokemon/EncounterLocationsSection';
import { MovesetSection } from '@/components/pokemon/MovesetSection';
import { InfoStrip } from '@/components/pokemon/InfoStrip';
import { AbilitiesSection } from '@/components/pokemon/AbilitiesSection';
import { toMetricHeight, toImperialHeight, toMetricWeight, toImperialWeight } from '@/utils/unitConversions';
import { formatGenderRatioString } from '@/utils/pokemonUtils';

/**
 * Maps Pokémon type to ambient background color, opacity, and gradient style
 */
interface AmbientBackground {
  color: string;
  opacity: number;
  gradient: 'linear' | 'radial';
}

function getAmbientBackground(primaryType: string): AmbientBackground {
  const ambientMap: Record<string, AmbientBackground> = {
    normal: { color: '#A8A878', opacity: 0.08, gradient: 'linear' },
    fire: { color: '#F08030', opacity: 0.12, gradient: 'linear' },
    water: { color: '#6890F0', opacity: 0.10, gradient: 'radial' },
    electric: { color: '#F8D030', opacity: 0.12, gradient: 'linear' },
    grass: { color: '#78C850', opacity: 0.10, gradient: 'radial' },
    ice: { color: '#98D8D8', opacity: 0.09, gradient: 'linear' },
    fighting: { color: '#C03028', opacity: 0.08, gradient: 'linear' },
    poison: { color: '#A040A0', opacity: 0.10, gradient: 'linear' },
    ground: { color: '#E0C068', opacity: 0.11, gradient: 'linear' },
    flying: { color: '#A890F0', opacity: 0.10, gradient: 'linear' },
    psychic: { color: '#F85888', opacity: 0.09, gradient: 'radial' },
    bug: { color: '#A8B820', opacity: 0.09, gradient: 'linear' },
    rock: { color: '#B8A038', opacity: 0.08, gradient: 'linear' },
    ghost: { color: '#705898', opacity: 0.12, gradient: 'radial' },
    dragon: { color: '#7038F8', opacity: 0.11, gradient: 'radial' },
    dark: { color: '#705848', opacity: 0.10, gradient: 'linear' },
    steel: { color: '#B8B8D0', opacity: 0.08, gradient: 'linear' },
    fairy: { color: '#EE99AC', opacity: 0.10, gradient: 'linear' },
  };

  return ambientMap[primaryType.toLowerCase()] || { color: '#111010', opacity: 0, gradient: 'linear' };
}

/**
 * Converts hex color to rgba string
 */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Blends ambient hex color with the dark background (#111010) at given opacity
 * Returns a solid RGB color string suitable for card surface fills
 */
function blendWithBackground(ambientHex: string, ambientOpacity: number): string {
  const bg = { r: 17, g: 16, b: 16 }; // #111010
  const r = parseInt(ambientHex.slice(1, 3), 16);
  const g = parseInt(ambientHex.slice(3, 5), 16);
  const b = parseInt(ambientHex.slice(5, 7), 16);
  const blendedR = Math.round(bg.r + (r - bg.r) * ambientOpacity);
  const blendedG = Math.round(bg.g + (g - bg.g) * ambientOpacity);
  const blendedB = Math.round(bg.b + (b - bg.b) * ambientOpacity);
  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

export default function PokemonDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pokemonId = parseInt(id ?? '0', 10);

  const { data: pokemon, isLoading, error } = usePokemonDetail(pokemonId);

  // Compute form label once, memoized
  const formLabel = useMemo(() => {
    if (!pokemon) return null;
    return computeFormLabel(pokemon.formType, pokemon.formName, pokemon.displayName, pokemon.name);
  }, [pokemon?.formType, pokemon?.formName, pokemon?.displayName, pokemon?.name]);

  // Shiny artwork prefetch state
  const [shinyReady, setShinyReady] = useState(false);

  // Below-fold content deferral state
  const [belowFoldReady, setBelowFoldReady] = useState(false);

  // Particle layer deferral — tied to belowFoldReady (350ms) with fade-in
  // MegaParticles uses Image.prefetch (async, non-blocking) and fades in over 400ms
  // so mounting it at 350ms is safe and appears smooth
  const [particlesReady, setParticlesReady] = useState(false);

  useEffect(() => {
    const belowFoldId = setTimeout(() => setBelowFoldReady(true), 650);
    const particlesId = setTimeout(() => setParticlesReady(true), 500);
    return () => {
      clearTimeout(belowFoldId);
      clearTimeout(particlesId);
    };
  }, []);

  // All queries fire when belowFoldReady — they run async on native thread, don't block JS
  const { data: speciesData } = usePokemonSpeciesData(pokemonId);
  const { data: abilities } = usePokemonAbilities(pokemonId);
  const { data: relatedForms } = useRelatedForms(belowFoldReady ? pokemonId : 0);
  const { cosmeticAlternates, typeVariants } = useFormVariants(belowFoldReady ? (pokemon?.nationalDex ?? 0) : 0);

  // Defer shiny prefetch check until after first paint
  useEffect(() => {
    if (!belowFoldReady || !pokemon?.pokeApiId) return;

    const shinyUrl = getShinyHomeRenderUrl(pokemon.pokeApiId);

    // Check if already cached, otherwise start prefetch
    isImageCached(shinyUrl).then((isCached) => {
      if (isCached) {
        console.log(`[PokemonDetail] Shiny artwork already cached for ${pokemon.displayName}`);
        setShinyReady(true);
      } else {
        console.log(`[PokemonDetail] Shiny artwork not cached, prefetching for ${pokemon.displayName}`);
        prefetchShinyArtwork(pokemon.pokeApiId).then((success) => {
          if (success) {
            console.log(`[PokemonDetail] Shiny artwork prefetch succeeded for ${pokemon.displayName}`);
            setShinyReady(true);
          } else {
            console.log(`[PokemonDetail] Shiny artwork prefetch failed for ${pokemon.displayName}`);
          }
        });
      }
    });
  }, [belowFoldReady, pokemon?.pokeApiId, pokemon?.displayName]);

  // Parallax scroll handler
  const scrollOffset = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  // Header animation based on scroll progress
  const headerTitleOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, 50, 200],
      [0.3, 0.6, 1.0],
      Extrapolate.CLAMP,
    );
    return { opacity };
  });

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Stack.Screen options={{ title: 'Pokémon' }} />
        <EmptyState
          message="Failed to load Pokémon"
          subMessage={error?.message}
        />
      </SafeAreaView>
    );
  }

  if (!pokemon && !error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Stack.Screen options={{ title: 'Pokémon' }} />
        <View style={styles.skeletonHero} />
      </SafeAreaView>
    );
  }

  if (!pokemon) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <Stack.Screen options={{ title: 'Pokémon' }} />
        <EmptyState
          message="Pokémon not found"
          subMessage="Try searching again"
        />
      </SafeAreaView>
    );
  }

  // Get ambient background for this Pokémon's primary type
  const ambient = getAmbientBackground(pokemon.primaryType);
  const ambientColorWithAlpha = hexToRgba(ambient.color, ambient.opacity);
  const cardSurfaceColor = ambient.gradient === 'radial'
    ? colors.background  // radial: hero is at top-center = pure background color
    : blendWithBackground(ambient.color, ambient.opacity);  // linear: hero is at top = tinted

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <Stack.Screen options={{ title: pokemon?.displayName ?? 'Pokémon' }} />

      <LinearGradient
        colors={
          ambient.gradient === 'radial'
            ? [colors.background, ambientColorWithAlpha]
            : [ambientColorWithAlpha, colors.background]
        }
        start={ambient.gradient === 'radial' ? { x: 0.5, y: 0.4 } : { x: 0, y: .4 }}
        end={ambient.gradient === 'radial' ? { x: 0.5, y: 1 } : { x: 0, y: 1 }}
        style={styles.ambientGradient}
      >
        <Animated.ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          scrollEventThrottle={32}
          onScroll={scrollHandler}
        >
        {/* Hero Section with Parallax Artwork */}
        <PokemonHero
          pokemonId={pokemon.nationalDex}
          pokemonName={pokemon.displayName}
          nationalDex={pokemon.nationalDex}
          primaryType={pokemon.primaryType}
          secondaryType={pokemon.secondaryType ?? null}
          accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
          artworkUrl={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.pokeApiId}.png`}
          shinyArtworkUrl={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokemon.pokeApiId}.png`}
          glowArtworkUrl={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.pokeApiId}.png`}
          scrollAnimatedValue={scrollOffset}
          shinyReady={shinyReady}
          cardSurfaceColor={cardSurfaceColor}
          formType={pokemon.formType}
          pokemonSlug={pokemon.name}
          particlesEnabled={particlesReady}
        />

        {/* Left accent bar wrapper — contains all info sections below hero */}
        <View style={styles.accentBarWrapper}>

          {/* Name Row */}
          <View style={styles.nameClassificationRow}>
            <View style={styles.nameRow}>
              {formLabel?.isPrimal ? (
                <>
                  <Text style={styles.primalPrefix}>Primal </Text>
                  <Text style={styles.pokemonName}>{formLabel.baseName}</Text>
                </>
              ) : (
                <Text style={styles.pokemonName}>{pokemon.displayName}</Text>
              )}
            </View>
          </View>

          {/* Form Label Row */}
          {formLabel?.label && (
            <View style={styles.formLabelRow}>
              <Text style={styles.formLabel}>{formLabel.label}</Text>
            </View>
          )}

          {/* Types + Classification */}
          <View style={styles.typeRow}>
            <TypeBadge type={pokemon.primaryType} size="md" width="fixed" />
            {pokemon.secondaryType && (
              <TypeBadge type={pokemon.secondaryType} size="md" width="fixed" />
            )}
            {speciesData?.classification && (
              <Text style={styles.classification}>{speciesData.classification}</Text>
            )}
          </View>

          {/* Info Strip — Compact single-row display */}
          <InfoStrip
            height={pokemon.height}
            weight={pokemon.weight}
            generation={pokemon.generation}
            genderRate={speciesData?.genderRate}
            isLegendary={pokemon.isLegendary}
            isMythical={pokemon.isMythical}
            accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
          />

          {/* Above-fold: Render immediately (uses pokemon data already in hand) */}
          {/* Abilities — uses separate query but renders empty if not ready */}
          {abilities.length > 0 && (
            <View style={styles.section}>
              <AbilitiesSection
                abilities={abilities}
                accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
                onAbilityPress={(id) => router.push(`/abilities/${id}`)}
              />
            </View>
          )}

          {/* Base Stats */}
          <View style={styles.section}>
            <StatChart
              stats={{
                hp: pokemon.baseStats.hp,
                attack: pokemon.baseStats.attack,
                defense: pokemon.baseStats.defense,
                spAttack: pokemon.baseStats.specialAttack,
                spDefense: pokemon.baseStats.specialDefense,
                speed: pokemon.baseStats.speed,
              }}
              accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
              animated
              showValues
            />
          </View>

          {/* Type Effectiveness */}
          <View style={styles.section}>
            <TypeEffectivenessTable
              primaryType={pokemon.primaryType.toLowerCase()}
              secondaryType={pokemon.secondaryType ? pokemon.secondaryType.toLowerCase() : null}
            />
          </View>

          {belowFoldReady ? (
            <>
              {/* Below-fold: Deferred (requires separate queries) */}
              {/* Evolution */}
              <View style={styles.section}>
                <EvolutionChain
                  pokemonId={pokemonId}
                  accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
                  onPokemonPress={(formId) => router.push(`/${formId}`)}
                />
              </View>

              {/* Cosmetic Alternates Section */}
              {cosmeticAlternates.length > 0 && (
                <View style={styles.section}>
                  <CosmeticAlternatesSection alternates={cosmeticAlternates} />
                </View>
              )}

              {/* Type Variants Section */}
              {typeVariants.length > 0 && (
                <View style={styles.section}>
                  <TypeVariantsSection variants={typeVariants} />
                </View>
              )}

              {/* Related Forms */}
              {relatedForms && relatedForms.length > 1 && (
                <RelatedFormsSection
                  forms={relatedForms}
                  onFormPress={(formId) => router.push(`/${formId}`)}
                  currentPokemonName={pokemon.displayName}
                  activeFormId={pokemonId}
                />
              )}

              {/* Flavor Text */}
              <View style={styles.section}>
                <FlavorTextSection
                  flavorTexts={speciesData?.flavorTexts ?? []}
                  accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
                />
              </View>

              {/* Location Encounters */}
              <View style={styles.section}>
                <EncounterLocationsSection
                  pokemonId={pokemonId}
                  pokemonName={pokemon.displayName}
                />
              </View>

              {/* Moveset Section */}
              <View style={styles.section}>
                <MovesetSection pokemonId={pokemonId} pokemonName={pokemon.displayName} />
              </View>
            </>
          ) : (
            <View style={{ height: 800 }} />
          )}
        </View>
      </Animated.ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  ambientGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  accentBarWrapper: {
    paddingLeft: 14,
    marginLeft: 0,
  },
  nameClassificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    marginTop: 6,
    marginBottom: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.xs
  },
  pokemonName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 0,
  },
  primalPrefix: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    marginRight: spacing.xs,
  },
  formLabelRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  formLabel: {
    fontSize: fontSize.xl,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  classification: {
    fontSize: fontSize.md,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginLeft: 'auto',
    textAlign: 'right',
    flexShrink: 1,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  artworkContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 250,
    borderWidth: 1,
    borderColor: colors.border,
  },
  artwork: {
    width: '100%',
    height: 200,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
  skeletonHero: {
    width: '100%',
    height: 340,
    backgroundColor: colors.surface,
  },

});
