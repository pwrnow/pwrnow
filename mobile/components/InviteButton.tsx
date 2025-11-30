import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';

interface InviteButtonProps {
  userId: string;
  onPress: (userId: string) => void;
  isPending: boolean;
  pendingUserId?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
}

export default function InviteButton({
  userId,
  onPress,
  isPending,
  pendingUserId,
  size = 'medium',
  fullWidth = false,
}: InviteButtonProps) {
  const { isDark } = useThemeColors();
  const isThisButtonPending = isPending && pendingUserId === userId;

  return (
    <TouchableOpacity
      onPress={() => onPress(userId)}
      disabled={isThisButtonPending}
      style={{
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        paddingHorizontal: size === 'small' ? 12 : 16,
        paddingVertical: size === 'small' ? 8 : 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        ...(fullWidth && { width: '100%' }),
      }}
      activeOpacity={0.8}
    >
      {isThisButtonPending ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="user-plus" size={size === 'small' ? 14 : 16} color="#3B82F6" />
          <Text
            style={{
              color: '#3B82F6',
              fontWeight: '600',
              fontSize: size === 'small' ? 13 : 14,
              marginLeft: 6,
            }}
          >
            {t('invite')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
