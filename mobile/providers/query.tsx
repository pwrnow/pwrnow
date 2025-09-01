import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Network from 'expo-network';
import {
  initializeNetworkState,
  addNetworkStateListener,
} from '../lib/network';
import { queryConfig } from '../lib/queryConfig';

// Create AsyncStorage persister for offline data persistence
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  // Use configuration for storage key
  key: queryConfig.persistence.storageKey,
});

// Single app-wide QueryClient instance with global offline-aware configurations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global retry configuration
      retry: (failureCount, error) => {
        // Don't retry if we're offline (error message indicates no connection)
        if (
          error instanceof Error &&
          error.message.includes('No internet connection')
        ) {
          return false;
        }
        // Retry up to configured max attempts for other errors
        return failureCount < queryConfig.retry.queries.maxAttempts;
      },
      retryDelay: queryConfig.retry.queries.delay,

      // Global stale time - data considered fresh for configured duration
      staleTime: queryConfig.staleTime.default,

      // Global garbage collection time - data kept in cache for configured duration
      gcTime: queryConfig.gcTime.default,

      // Global refetch settings from configuration
      refetchOnReconnect: queryConfig.network.refetchOnReconnect,
      refetchOnWindowFocus: queryConfig.network.refetchOnWindowFocus,

      // Global network behavior from configuration
      networkMode: queryConfig.network.networkMode,
    },
    mutations: {
      // Global mutation retry configuration from configuration
      retry: queryConfig.retry.mutations.maxAttempts,
      retryDelay: queryConfig.retry.mutations.delay,
    },
  },
});

// Wire React Query online status to our network utility
onlineManager.setEventListener((setOnline) => {
  const subscription = Network.addNetworkStateListener((state) => {
    const isOnline =
      !!state.isConnected && (state.isInternetReachable ?? true) !== false;
    setOnline(isOnline);
  });
  return () => subscription.remove();
});

function useReactNativeFocusManager() {
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    }

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  useReactNativeFocusManager();

  // Initialize network state and set up listeners
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupNetwork = async () => {
      await initializeNetworkState();
      cleanup = addNetworkStateListener((state) => {
        console.log('Network state changed:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      });
    };

    setupNetwork();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        // Persist queries when app goes to background
        maxAge: queryConfig.persistence.maxAge,
        // Don't persist mutations
        buster: queryConfig.persistence.buster,
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}

export { queryClient };
