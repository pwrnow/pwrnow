import React from 'react';
import { View, Text, Image } from 'react-native';
import { Organization } from '../types';
import { getInitials } from '../lib/format';
import { useThemeColors } from '../hooks/useThemeColors';

interface Props {
  organization: Organization;
  categoryName: string;
}

export const OrganizationHeader: React.FC<Props> = ({
  organization,
  categoryName,
}) => {
  const { colors } = useThemeColors();
  return (
    <View className='mx-4 mt-3'>
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className='flex-row items-center px-4 py-3 border rounded-xl'
      >
        <View
          style={{ backgroundColor: colors.muted }}
          className='w-12 h-12 rounded-full overflow-hidden justify-center items-center mr-3'
        >
          {organization.image_url ? (
            <Image
              source={{ uri: organization.image_url }}
              className='w-full h-full'
              resizeMode='cover'
            />
          ) : (
            <Text
              style={{ color: colors.foreground }}
              className='font-groteskSemibold text-sm'
            >
              {getInitials(organization.name)}
            </Text>
          )}
        </View>
        <View className='flex-1'>
          <Text
            style={{ color: colors.foreground }}
            className='font-groteskSemibold text-base leading-5'
          >
            {organization.name}
          </Text>
          <Text
            style={{ color: colors.mutedForeground }}
            className='text-sm font-grotesk'
          >
            {categoryName}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OrganizationHeader;
