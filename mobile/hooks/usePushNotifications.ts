import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import {
  pushNotificationService,
  type NotificationData,
} from '../lib/push-notification-service';
import { deviceLocaleTag } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';

/**
 * React hook for managing push notifications
 */
export function usePushNotifications(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<
    Notifications.Notification | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(
    null
  );
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  function navigateFromNotificationData(data: NotificationData | undefined) {
    if (!data) return;

    console.log('[Notifications] Processing notification data:', data);

    // Handle friend request notifications
    if (data.type === 'friend_request') {
      console.log('[Notifications] Friend request notification, navigating to friends tab');
      try {
        router.push('/(tabs)/friends' as any);
        return;
      } catch (err) {
        console.warn('[Notifications] Friends tab navigation failed:', err);
      }
    }

    // If URL is provided, navigate to it
    if (data.url) {
      // Strip domain and keep only the path
      const url = new URL(data.url);
      const path = url.pathname;
      console.log('[Notifications] Navigating to path:', path);
      console.log(url);

      // Check if this is a post-specific URL structure
      const postUrlMatch = path.match(
        /^\/wydarzenia\/([^\/]+)\/posts\/([^\/]+)$/
      );
      if (postUrlMatch) {
        const [, eventSlug, postId] = postUrlMatch;
        console.log(
          '[Notifications] Post URL detected, building query-based URL'
        );

        // Build new URL with query parameters
        const newPath = `/wydarzenia/${eventSlug}?postId=${postId}&tab=posts`;
        console.log('[Notifications] Navigating to:', newPath);

        try {
          router.push(newPath as any);
          return;
        } catch (err) {
          console.warn('[Notifications] Post navigation failed:', err);
        }
      }

      // For other URLs, navigate normally
      try {
        router.push(path as any);
      } catch (err) {
        console.warn('[Notifications] Navigation failed:', err);
      }
    } else {
      console.log('[Notifications] No URL provided in notification data');
    }
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

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
        navigateFromNotificationData(data);
      });

    setupPushNotifications();

    // Handle cold start: if the app was opened by tapping a notification while killed
    Notifications.getLastNotificationResponseAsync().then((lastResponse) => {
      if (lastResponse) {
        const data = lastResponse.notification.request.content
          .data as NotificationData;
        console.log('Last notification response found on mount:', data);
        console.log('[Notifications] Attempting cold start navigation');
        navigateFromNotificationData(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [enabled]);

  // After user signs in, re-register device to attach it to the user
  useEffect(() => {
    if (!enabled) return;
    if (!isAuthenticated) return;
    if (!expoPushToken) return;

    let isMounted = true;
    (async () => {
      try {
        const registered = await pushNotificationService.registerDevice(
          expoPushToken,
          { preferredLanguage: deviceLocaleTag }
        );
        if (isMounted) setIsRegistered(registered);
      } catch (_e) {}
    })();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, expoPushToken, enabled]);

  return {
    expoPushToken,
    notification,
    isLoading,
    isRegistered,
  };
}
