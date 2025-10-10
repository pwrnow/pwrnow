import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
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
        backgroundColor: isDark ? '#3B82F6' : '#2563EB',
        paddingHorizontal: size === 'small' ? 12 : 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        ...(fullWidth && { width: '100%' }),
      }}
    >
      {isThisButtonPending ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text
          style={{
            color: '#FFFFFF',
            fontWeight: '500',
            fontSize: size === 'small' ? 14 : 16,
          }}
        >
          {t('invite')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

