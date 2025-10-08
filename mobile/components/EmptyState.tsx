import { View, Text } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';

interface EmptyStateProps {
  title: string;
  message: string;
}

export default function EmptyState({ title, message }: EmptyStateProps) {
  const { isDark } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}
    >
      <Text
        style={{
          fontSize: 18,
          color: isDark ? '#FFFFFF' : '#000000',
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: isDark ? '#9CA3AF' : '#6B7280',
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}

