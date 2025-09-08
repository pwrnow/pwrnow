import React, { createContext, useContext, useEffect, useState } from 'react';
import { offlineManager } from '../lib/offlineManager';
import { initializeNetworkState, isOnline } from '../lib/network';
import OfflineNotification from '../components/OfflineNotification';
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
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
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
      
      // If online, sync data
      if (online) {
        console.log('App started online, syncing data...');
        await syncData();
      } else if (cachedData) {
        console.log('App started offline with cached data');
        setShowOfflineNotification(true);
      } else {
        console.log('App started offline without cached data');
      }
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
        console.log(`Sync successful: ${result.eventsCount} events, ${result.imagesCount} images`);
        setHasCachedData(true);
        setShowOfflineNotification(false);
      } else {
        console.warn('Sync failed:', result.error);
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

  const handleDismissNotification = () => {
    setShowOfflineNotification(false);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  // Show offline screen if no internet and no cached data
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
      <OfflineNotification
        visible={showOfflineNotification}
        onDismiss={handleDismissNotification}
        onRefresh={handleRefresh}
        hasCachedData={hasCachedData}
      />
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
