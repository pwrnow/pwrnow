import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';

type TabType = 'details' | 'posts' | 'schedule';

interface Props {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const SegmentedTabs: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const renderTab = (
    key: TabType,
    label: string,
    icon: keyof typeof Feather.glyphMap
  ) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        setActiveTab(key);
      }}
      className={`flex-1 py-3 px-4 rounded-lg items-center ${
        activeTab === key
          ? 'bg-white dark:bg-black border border-black/10 dark:border-white/20'
          : 'bg-transparent'
      }`}
      style={
        activeTab === key && !isDark
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 1 },
              elevation: 2,
            }
          : undefined
      }
      activeOpacity={0.7}
    >
      <View className='flex-row items-center'>
        <Feather
          name={icon}
          size={16}
          color={
            activeTab === key
              ? isDark
                ? '#FFFFFF'
                : '#000000'
              : isDark
              ? '#FFFFFF80'
              : '#00000080'
          }
        />
        <Text
          className={`ml-2 font-groteskMedium text-sm ${
            activeTab === key
              ? 'text-black dark:text-white'
              : 'text-black/50 dark:text-white/50'
          }`}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className='px-4 pt-4 pb-2 border-b border-black/10 dark:border-white/10'>
      <View className='bg-black/5 dark:bg-white/5 rounded-xl p-1 border border-black/10 dark:border-white/10'>
        <View className='flex-row'>
          {renderTab('details', t('details'), 'info')}
          {renderTab('posts', t('posts'), 'message-circle')}
          {renderTab('schedule', t('schedule'), 'calendar')}
        </View>
      </View>
    </View>
  );
};

export default SegmentedTabs;
