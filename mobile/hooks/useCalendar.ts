import { Alert, Linking } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Haptics from 'expo-haptics';
import { Event } from '../types';
import { config } from '../lib/config';
import { t } from '../lib/i18n';

interface UseCalendarProps {
  event: Event | null | undefined;
}

export const useCalendar = ({ event }: UseCalendarProps) => {
  const handleAddToCalendar = async () => {
    if (!event) {
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Check/request permissions
      let { status } = await Calendar.getCalendarPermissionsAsync();
      if (status !== 'granted') {
        const req = await Calendar.requestCalendarPermissionsAsync();
        status = req.status;
        if (status !== 'granted') {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error
          );
          Alert.alert(
            t('permissionDeniedTitle'),
            t('permissionDeniedMessage'),
            [
              { text: t('cancel'), style: 'cancel' },
              { text: t('settings'), onPress: () => Linking.openSettings() },
            ]
          );
          return;
        }
      }

      const startsAt = new Date(event.starts_at);
      const endsAt = new Date(event.ends_at);

      const result = await Calendar.createEventInCalendarAsync({
        title: event.title,
        startDate: startsAt,
        endDate: endsAt,
        location: event.location ?? '',
        notes: event.description ?? '',
        url: event.url || `${config.shareBaseUrl}/${event.slug}`,
      });

      if (result?.action === Calendar.CalendarDialogResultActions.saved) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        Alert.alert(
          t('successTitle'),
          t('eventAddedToCalendar', { title: event.title })
        );
      } else if (
        result?.action === Calendar.CalendarDialogResultActions.canceled
      ) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('errorTitle'), t('calendarOpenFailed'));
    }
  };

  return {
    handleAddToCalendar,
  };
};
