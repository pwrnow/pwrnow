import React from 'react';
import { View, Text } from 'react-native';
import { t } from '../lib/i18n';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  description?: string | null;
}

export const EventDescription: React.FC<Props> = ({ description }) => {
  const { colors } = useThemeColors();
  if (!description) return null as any;
  return (
    <View className='mx-4 mb-3'>
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className='border rounded-xl p-4'
      >
        <Text
          style={{ color: colors.foreground }}
          className='font-groteskSemibold text-lg mb-3'
        >
          {t('eventDescription')}
        </Text>

        <Text
          style={{ color: colors.foreground }}
          className='text-sm leading-6 font-grotesk'
        >
          {description}
        </Text>
      </View>
    </View>
  );
};

export default EventDescription;
