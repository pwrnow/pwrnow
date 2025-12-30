import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Organization } from '../types';
import { getInitials } from '../lib/format';
import { useThemeColors } from '../hooks/useThemeColors';
import OrganizationListModal from './OrganizationListModal';

interface Props {
  organization: Organization;
  categoryName: string;
  allOrganizations?: Organization[];
}

export const OrganizationHeader: React.FC<Props> = ({
  organization,
  categoryName,
  allOrganizations,
}) => {
  const { colors } = useThemeColors();
  const [showOrgsModal, setShowOrgsModal] = useState(false);

  // Use all organizations if provided, otherwise fallback to just the main organization
  const organizations = allOrganizations && allOrganizations.length > 0
    ? allOrganizations
    : [organization];
  const hasMultipleOrgs = organizations.length > 1;

  // Get display name: prefer short_name, otherwise use full name
  const getDisplayName = (org: Organization) => {
    return org.short_name || org.display_name || org.name;
  };

  // Build organization names string with "&" separator
  const organizationNamesDisplay = organizations
    .map((org) => getDisplayName(org))
    .join(' & ');

  // Show max 2 avatars + "+N" indicator
  const visibleOrgs = organizations.slice(0, 2);
  const extraOrgsCount = organizations.length - 2;

  return (
    <View className='mx-4 mt-3'>
      <Pressable
        onPress={() => hasMultipleOrgs && setShowOrgsModal(true)}
        style={{ backgroundColor: colors.card, borderColor: colors.border }}
        className='flex-row items-center px-4 py-3 border rounded-xl'
      >
        {/* Stacked Avatars */}
        <View className='flex-row items-center mr-3'>
          {visibleOrgs.map((org, index) => (
            <View
              key={org.id}
              style={{
                backgroundColor: colors.muted,
                marginLeft: index > 0 ? -16 : 0,
                zIndex: visibleOrgs.length - index,
                borderWidth: 2,
                borderColor: colors.card,
              }}
              className='w-12 h-12 rounded-full overflow-hidden justify-center items-center'
            >
              {org.image_url ? (
                <Image
                  source={{ uri: org.image_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit='cover'
                  cachePolicy='disk'
                  priority='high'
                  transition={100}
                />
              ) : (
                <Text
                  style={{ color: colors.foreground }}
                  className='font-groteskSemibold text-sm'
                >
                  {getInitials(org.name)}
                </Text>
              )}
            </View>
          ))}
          {extraOrgsCount > 0 && (
            <View
              style={{
                backgroundColor: colors.muted,
                marginLeft: -16,
                zIndex: 0,
                borderWidth: 2,
                borderColor: colors.card,
              }}
              className='w-12 h-12 rounded-full justify-center items-center'
            >
              <Text
                style={{ color: colors.foreground }}
                className='font-groteskSemibold text-xs'
              >
                +{extraOrgsCount}
              </Text>
            </View>
          )}
        </View>
        <View className='flex-1'>
          <Text
            style={{
              color: hasMultipleOrgs ? colors.foreground + 'CC' : colors.foreground
            }}
            className={hasMultipleOrgs ? 'font-medium text-sm leading-4' : 'font-groteskSemibold text-base leading-5'}
            numberOfLines={2}
          >
            {organizationNamesDisplay}
          </Text>
          <Text
            style={{ color: colors.mutedForeground }}
            className='text-sm font-grotesk'
          >
            {categoryName}
          </Text>
        </View>
      </Pressable>

      <OrganizationListModal
        visible={showOrgsModal}
        onClose={() => setShowOrgsModal(false)}
        organizations={organizations}
      />
    </View>
  );
};

export default OrganizationHeader;
