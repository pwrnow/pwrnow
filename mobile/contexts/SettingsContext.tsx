import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsStorage, AppSettings } from '../lib/settingsStorage';
import { pushNotificationService } from '../lib/push-notification-service';

type SettingsContextType = {
  settings: AppSettings;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<AppSettings>(
    settingsStorage.getSettings()
  );

  useEffect(() => {
    const unsubscribe = settingsStorage.subscribe((newSettings) => {
      setSettings(newSettings);
    });

    return unsubscribe;
  }, []);

  const setNotificationsEnabled = async (enabled: boolean) => {
    // Update local settings first
    await settingsStorage.setNotificationsEnabled(enabled);

    // Register device with updated notification preferences
    try {
      const pushToken = await pushNotificationService.getExpoPushToken();
      if (pushToken) {
        await pushNotificationService.registerDevice(pushToken, {
          notificationsEnabled: enabled,
        });
        console.log(
          `Device registered with notifications ${
            enabled ? 'enabled' : 'disabled'
          }`
        );
      } else {
        console.warn('No push token available for device registration');
      }
    } catch (error) {
      console.error(
        'Failed to register device with notification preferences:',
        error
      );
      // Don't throw - settings are still updated locally
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setNotificationsEnabled,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
