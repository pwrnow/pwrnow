import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  pushNotificationService,
  type NotificationData,
} from '../lib/push-notification-service';
import { deviceLocaleTag } from '../lib/i18n';

/**
 * React hook for managing push notifications
 */
export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function setupPushNotifications() {
      setIsLoading(true);

      // Register for push notifications
      const token =
        await pushNotificationService.registerForPushNotifications();

      if (token) {
        setExpoPushToken(token);

        // Register device with backend
        const registered = await pushNotificationService.registerDevice(token, {
          preferredLanguage: deviceLocaleTag,
        });
        setIsRegistered(registered);
      }

      setIsLoading(false);
    }

    // Set up notification listeners
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);

        // Access notification data properly
        const notificationData = notification.request.content
          .data as NotificationData;
        console.log('Notification data:', notificationData);

        setNotification(notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('Notification response (user tapped):', response);

        // Handle notification tap - access data from the correct location
        const data = response.notification.request.content
          .data as NotificationData;

        console.log('Notification tap data:', data);

        // Handle different notification types
        if (data?.type === 'event_verified' && data.event_slug) {
          console.log('Event notification tapped:', data.event_slug);
          // Add your navigation logic here if needed
        } else if (data?.type === 'test') {
          console.log('Test notification tapped');
        } else {
          console.log('Unknown notification type or missing data');
        }
      });

    setupPushNotifications();

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return {
    expoPushToken,
    notification,
    isLoading,
    isRegistered,
  };
}
