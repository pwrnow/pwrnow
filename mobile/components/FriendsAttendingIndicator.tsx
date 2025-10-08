import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface FriendAttending {
  id: string;
  username: string;
  participated_at: string;
}

interface FriendsAttendingIndicatorProps {
  friends: FriendAttending[];
  onPress: () => void;
}

export default function FriendsAttendingIndicator({
  friends,
  onPress,
}: FriendsAttendingIndicatorProps) {
  const { colors, isDark } = useThemeColors();

  if (!friends || friends.length === 0) {
    return null;
  }

  const displayCount = Math.min(friends.length, 3);
  const remainingCount = Math.max(0, friends.length - displayCount);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignSelf: 'flex-start',
      }}
    >
      <Ionicons
        name="people"
        size={14}
        color={isDark ? '#10B981' : '#059669'}
        style={{ marginRight: 6 }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
        {friends.slice(0, displayCount).map((friend, index) => (
          <View
            key={friend.id}
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: isDark ? '#374151' : '#E5E7EB',
              marginLeft: index > 0 ? -8 : 0,
              borderWidth: 2,
              borderColor: isDark ? '#1F2937' : '#F3F4F6',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                color: isDark ? '#FFFFFF' : '#000000',
                fontSize: 9,
                fontWeight: '600',
              }}
            >
              {friend.username.charAt(0).toUpperCase()}
            </Text>
          </View>
        ))}
      </View>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 12,
          fontWeight: '500',
        }}
      >
        {friends.length === 1
          ? friends[0].username
          : remainingCount > 0
          ? `+${remainingCount}`
          : friends.slice(0, 2).map(f => f.username.split(' ')[0]).join(', ')}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={12}
        color={colors.mutedForeground}
        style={{ marginLeft: 4 }}
      />
    </TouchableOpacity>
  );
}

