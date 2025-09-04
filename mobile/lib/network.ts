import * as Network from 'expo-network';
import { Platform } from 'react-native';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: Network.NetworkStateType;
}

let networkState: NetworkState = {
  isConnected: false,
  isInternetReachable: null,
  type: Network.NetworkStateType.UNKNOWN,
};

// Network state listener
let networkListener: (() => void) | null = null;

export function getNetworkState(): NetworkState {
  return { ...networkState };
}

export function isOnline(): boolean {
  return networkState.isConnected && networkState.isInternetReachable !== false;
}

export function isOffline(): boolean {
  return !isOnline();
}

export function addNetworkStateListener(
  callback: (state: NetworkState) => void
): () => void {
  const subscription = Network.addNetworkStateListener((state) => {
    networkState = {
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? Network.NetworkStateType.UNKNOWN,
    };
    callback(networkState);
  });

  return () => subscription.remove();
}

export function removeNetworkStateListener(): void {
  if (networkListener) {
    networkListener();
    networkListener = null;
  }
}

// Initialize network state
export async function initializeNetworkState(): Promise<void> {
  try {
    const state = await Network.getNetworkStateAsync();
    networkState = {
      isConnected: !!state.isConnected,
      isInternetReachable: state.isInternetReachable ?? null,
      type: state.type ?? Network.NetworkStateType.UNKNOWN,
    };
  } catch (error) {
    console.warn('Failed to get initial network state:', error);
    // Default to offline state
    networkState = {
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.UNKNOWN,
    };
  }
}

// Check if we should attempt network requests
export function shouldAttemptNetworkRequest(): boolean {
  // Always attempt if we think we're online
  if (isOnline()) {
    return true;
  }

  // On iOS, we might still want to try if we have a connection but aren't sure about internet reachability
  if (
    Platform.OS === 'ios' &&
    networkState.isConnected &&
    networkState.isInternetReachable === null
  ) {
    return true;
  }

  return false;
}

// Get network type as string for debugging
export function getNetworkTypeString(): string {
  switch (networkState.type) {
    case Network.NetworkStateType.CELLULAR:
      return 'cellular';
    case Network.NetworkStateType.ETHERNET:
      return 'ethernet';
    case Network.NetworkStateType.WIFI:
      return 'wifi';
    case Network.NetworkStateType.WIMAX:
      return 'wimax';
    case Network.NetworkStateType.BLUETOOTH:
      return 'bluetooth';
    case Network.NetworkStateType.VPN:
      return 'vpn';
    case Network.NetworkStateType.UNKNOWN:
    default:
      return 'unknown';
  }
}
