import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { getApiUrl } from './config';
import { deviceLocaleTag } from './i18n';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface DeviceRegistration {
  expoPushToken: string;
  platform: 'ios' | 'android';
  deviceName?: string;
  appVersion?: string;
  notificationsEnabled: boolean;
  preferredLanguage?: string;
}

export interface NotificationData {
  type: string;
  event_id?: string;
  event_slug?: string;
  category_slug?: string;
  organization_slug?: string;
  [key: string]: any;
}

class PushNotificationService {
  private expoPushToken: string | null = null;
  private isRegistered = false;

  /**
   * Register for push notifications and get the Expo push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Must use physical device for push notifications');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission not granted for push notifications');
      return null;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    try {
      // Get the project ID
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        throw new Error('Project ID not found');
      }

      // Get the push token
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

      this.expoPushToken = pushTokenString;
      console.log('Expo push token:', pushTokenString);

      return pushTokenString;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  /**
   * Register device with the backend API
   */
  async registerDevice(
    expoPushToken: string,
    preferences: Partial<DeviceRegistration> = {}
  ): Promise<boolean> {
    try {
      const registrationData: DeviceRegistration = {
        expoPushToken,
        platform: Platform.OS as 'ios' | 'android',
        deviceName: Device.deviceName || `${Device.modelName} (${Platform.OS})`,
        appVersion: Constants.expoConfig?.version || '1.0.0',
        notificationsEnabled: true,
        preferredLanguage: deviceLocaleTag,
        ...preferences,
      };

      const response = await fetch(`${getApiUrl()}/api/devices/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (response.ok) {
        this.isRegistered = true;
        console.log('Device registered successfully');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to register device:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  /**
   * Get the current expo push token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  /**
   * Check if device is registered
   */
  isDeviceRegistered(): boolean {
    return this.isRegistered;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();
