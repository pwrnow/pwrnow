import React, { createContext, useContext, useEffect, useState } from 'react';
import { offlineManager } from '../lib/offlineManager';
import { initializeNetworkState, isOnline } from '../lib/network';
import OfflineScreen from '../components/OfflineScreen';

interface OfflineContextType {
  isOffline: boolean;
  hasCachedData: boolean;
  isInitializing: boolean;
  syncData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: React.ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Initialize offline state
  useEffect(() => {
    initializeOfflineState();
  }, []);

  const initializeOfflineState = async () => {
    try {
      setIsInitializing(true);
      
      // Initialize network state
      await initializeNetworkState();
      
      // Check if we're online
      const online = isOnline();
      setIsOffline(!online);
      
      // Check if we have cached data
      const cachedData = await offlineManager.hasCachedData();
      setHasCachedData(cachedData);
      
      // Professional offline logic:
      // 1. If online: cache all data silently and show events (no messages)
      // 2. If offline with cache: show cached events (no messages)
      // 3. If offline without cache: show offline screen with pull-to-refresh
      if (online) {
        // Online: silently cache data and show events
        await syncData();
      } else if (!cachedData) {
        // Offline without cache: will show offline screen
      }
      // Offline with cache: silently show cached data (no messages)
    } catch (error) {
      console.error('Failed to initialize offline state:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const syncData = async () => {
    try {
      const result = await offlineManager.syncData();
      if (result.success) {
        setHasCachedData(true);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      if (isOnline()) {
        await syncData();
      } else {
        // Just update the state
        const cachedData = await offlineManager.hasCachedData();
        setHasCachedData(cachedData);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Extreme scenario: Show offline screen only when offline AND no cached data
  if (isOffline && !hasCachedData && !isInitializing) {
    return (
      <OfflineContext.Provider
        value={{
          isOffline,
          hasCachedData,
          isInitializing,
          syncData,
          refreshData,
        }}
      >
        <OfflineScreen onRefresh={handleRefresh} isRefreshing={isRefreshing} />
      </OfflineContext.Provider>
    );
  }

  // Normal operation: show app content (online with fresh data, or offline with cached data)
  return (
    <OfflineContext.Provider
      value={{
        isOffline,
        hasCachedData,
        isInitializing,
        syncData,
        refreshData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}
