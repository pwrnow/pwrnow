import React from 'react';
import { View, Text } from 'react-native';
import { t } from '../lib/i18n';

interface Props {
  description?: string | null;
}

export const EventDescription: React.FC<Props> = ({ description }) => {
  if (!description) return null as any;
  return (
    <View className='mx-4 mb-3'>
      <View className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4'>
        <Text className='text-black dark:text-white font-groteskSemibold text-lg mb-3'>
          {t('eventDescription')}
        </Text>

        <Text className='text-black/90 dark:text-white/90 text-sm leading-6 font-grotesk'>
          {description}
        </Text>
      </View>
    </View>
  );
};

export default EventDescription;
