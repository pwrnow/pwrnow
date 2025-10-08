import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

interface Friend {
  id: string;
  username: string;
}

interface FriendsAttendingProps {
  friends: Friend[];
  count: number;
}

export default function FriendsAttending({ friends, count }: FriendsAttendingProps) {
  const { colors, isDark } = useThemeColors();

  if (count === 0) return null;

  const displayedFriends = friends.slice(0, 3);
  const remainingCount = count - displayedFriends.length;

  // Get usernames text
  const getUsernamesText = () => {
    if (displayedFriends.length === 1) {
      return displayedFriends[0].username;
    } else if (displayedFriends.length === 2) {
      return `${displayedFriends[0].username}, ${displayedFriends[1].username}`;
    } else if (displayedFriends.length === 3) {
      return `${displayedFriends[0].username}, ${displayedFriends[1].username}, ${displayedFriends[2].username}`;
    }
    return '';
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      {/* Stacked Avatars */}
      <View style={{ flexDirection: 'row', marginRight: 8 }}>
        {displayedFriends.map((friend, index) => (
          <View
            key={friend.id}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: isDark ? '#374151' : '#E5E7EB',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: index === 0 ? 0 : -10,
              borderWidth: 2,
              borderColor: isDark ? '#000000' : '#FFFFFF',
              zIndex: displayedFriends.length - index,
            }}
          >
            <Ionicons
              name="person"
              size={14}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
          </View>
        ))}
      </View>

      {/* Username and Count */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
        <Text
          style={{
            fontSize: 13,
            color: isDark ? '#D1D5DB' : '#6B7280',
            marginRight: 4,
          }}
          numberOfLines={1}
        >
          {getUsernamesText()}
        </Text>
        {remainingCount > 0 && (
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#9CA3AF' : '#9CA3AF',
              fontWeight: '500',
            }}
          >
            +{remainingCount} {remainingCount === 1 ? 'other' : 'others'}
          </Text>
        )}
      </View>
    </View>
  );
}

