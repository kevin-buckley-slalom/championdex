import '../src/i18n';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { initializeDatabase } from '@/services/database/initializeDatabase';
import { startArtworkPrefetch, startAlternateFormPrefetch } from '@/services/prefetch/artworkPrefetchService';
import { usePreloadBackdropImages } from '@/hooks/usePreloadBackdropImages';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { colors } from '@/constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 30,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Pre-load backdrop images asynchronously (fire-and-forget)
  usePreloadBackdropImages();

  useEffect(() => {
    initializeDatabase()
      .then(() => {
        setIsReady(true);
        // Trigger artwork prefetch fire-and-forget (does not block ready state)
        startArtworkPrefetch();
        // Also trigger alternate form prefetch fire-and-forget
        startAlternateFormPrefetch();
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        setIsReady(true); // Still show app even on error
      });
  }, []);

  if (!isReady) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.loadingContainer}>
          <LoadingSpinner message="Initializing ChampionDex..." />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
