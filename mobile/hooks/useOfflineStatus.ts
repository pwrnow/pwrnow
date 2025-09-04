import { useState, useEffect } from 'react';
import {
  getNetworkState,
  addNetworkStateListener,
  isOnline,
  isOffline,
} from '../lib/network';

export interface OfflineStatus {
  isOnline: boolean;
  isOffline: boolean;
  networkType: string;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

export function useOfflineStatus(): OfflineStatus {
  const [status, setStatus] = useState<OfflineStatus>(() => {
    const initialState = getNetworkState();
    return {
      isOnline: isOnline(),
      isOffline: isOffline(),
      networkType: initialState.type.toString(),
      isConnected: initialState.isConnected,
      isInternetReachable: initialState.isInternetReachable,
    };
  });

  useEffect(() => {
    const cleanup = addNetworkStateListener((newState) => {
      setStatus({
        isOnline: isOnline(),
        isOffline: isOffline(),
        networkType: newState.type.toString(),
        isConnected: newState.isConnected,
        isInternetReachable: newState.isInternetReachable,
      });
    });

    return cleanup;
  }, []);

  return status;
}
