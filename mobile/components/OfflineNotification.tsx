import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface OfflineNotificationProps {
  visible: boolean;
  onDismiss: () => void;
  onRefresh?: () => void;
  hasCachedData?: boolean;
}

export const OfflineNotification: React.FC<OfflineNotificationProps> = ({
  visible,
  onDismiss,
  onRefresh,
  hasCachedData = false,
}) => {
  const { colors } = useTheme();
  const [fadeAnim] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  if (!visible) return null;

  const handleDismiss = () => {
    Haptics.selectionAsync();
    onDismiss();
  };

  const handleRefresh = () => {
    Haptics.selectionAsync();
    onRefresh?.();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 1000,
      }}
    >
      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#FF6B6B',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Feather name="wifi-off" size={20} color="white" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 4,
              }}
            >
              No Internet Connection
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
              }}
            >
              {hasCachedData
                ? 'Showing cached data. Some features may be limited.'
                : 'Unable to load content. Please check your connection.'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleDismiss}
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: colors.muted,
            }}
          >
            <Feather name="x" size={16} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {onRefresh && (
          <TouchableOpacity
            onPress={handleRefresh}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              paddingHorizontal: 16,
              backgroundColor: colors.primary,
              borderRadius: 8,
              marginTop: 8,
            }}
          >
            <Feather name="refresh-cw" size={16} color="white" style={{ marginRight: 8 }} />
            <Text
              style={{
                color: 'white',
                fontSize: 14,
                fontWeight: '600',
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

export default OfflineNotification;
