import { NativeTabs, Icon, Label, VectorIcon } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../lib/i18n';
import { Platform } from 'react-native';

export default function TabsLayout() {
  const { isStaff } = useAuth();

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>{t('home')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'house', selected: 'house.fill' }} />,
          android: <Icon src={<VectorIcon family={Ionicons} name="home" />} />,
        })}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="liked">
        <Label>{t('liked')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'heart', selected: 'heart.fill' }} />,
          android: <Icon src={<VectorIcon family={Ionicons} name="heart" />} />,
        })}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="friends">
        <Label>{t('friends')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />,
          android: <Icon src={<VectorIcon family={Ionicons} name="people" />} />,
        })}
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="admin" hidden={!isStaff}>
        <Label>{t('admin')}</Label>
        {Platform.select({
          ios: <Icon sf={{ default: 'shield', selected: 'shield.fill' }} />,
          android: <Icon src={<VectorIcon family={Ionicons} name="shield" />} />,
        })}
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

