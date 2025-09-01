import React, { createContext, useContext, useMemo } from 'react';
import { usePushNotifications } from '../hooks/usePushNotifications';

type NotificationsContextValue = {
  expoPushToken: string | null;
  isLoading: boolean;
  isRegistered: boolean;
};

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export const NotificationsProvider: React.FC<{
  children: React.ReactNode;
  enabled?: boolean;
}> = ({ children, enabled = true }) => {
  const { expoPushToken, isLoading, isRegistered } = usePushNotifications({
    enabled,
  });

  const value = useMemo(
    () => ({ expoPushToken, isLoading, isRegistered }),
    [expoPushToken, isLoading, isRegistered]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error(
      'useNotifications must be used inside NotificationsProvider'
    );
  return ctx;
}
