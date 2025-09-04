import React from 'react';
import { View, Text, Image } from 'react-native';
import { Organization } from '../types';
import { getInitials } from '../lib/format';

interface Props {
  organization: Organization;
  categoryName: string;
}

export const OrganizationHeader: React.FC<Props> = ({
  organization,
  categoryName,
}) => {
  return (
    <View className='mx-4 mt-3'>
      <View className='flex-row items-center px-4 py-3 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl'>
        <View className='w-12 h-12 rounded-full overflow-hidden bg-black/10 dark:bg-white/10 justify-center items-center mr-3'>
          {organization.image_url ? (
            <Image
              source={{ uri: organization.image_url }}
              className='w-full h-full'
              resizeMode='cover'
            />
          ) : (
            <Text className='text-black dark:text-white font-groteskSemibold text-sm'>
              {getInitials(organization.name)}
            </Text>
          )}
        </View>
        <View className='flex-1'>
          <Text className='text-black dark:text-white font-groteskSemibold text-base leading-5'>
            {organization.name}
          </Text>
          <Text className='text-black/60 dark:text-white/60 text-sm font-grotesk'>
            {categoryName}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default OrganizationHeader;
