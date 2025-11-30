import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import Avatar from './Avatar';
import { t } from '../lib/i18n';

export interface FriendSummary {
  id: string;
  username: string;
  profile_image_url?: string | null;
}

interface FriendsAttendingProps {
  friends: FriendSummary[];
  count: number;
  onPress?: () => void;
}

export default function FriendsAttending({
  friends,
  count,
  onPress,
}: FriendsAttendingProps) {
  const { isDark } = useThemeColors();

  if (count === 0) return null;

  const displayedFriends = friends.slice(0, 3);
  const remainingCount = count - displayedFriends.length;
  const isPressable = typeof onPress === 'function';

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

  const Container = isPressable ? Pressable : View;

  return (
    <Container
      onPress={onPress}
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
              marginLeft: index === 0 ? 0 : -10,
              borderWidth: 2,
              borderRadius: 14,
              borderColor: isDark ? '#000000' : '#FFFFFF',
              zIndex: displayedFriends.length - index,
            }}
          >
            <Avatar
              size={28}
              username={friend.username}
              imageUri={friend.profile_image_url || undefined}
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
            {t('andOthers', { count: remainingCount })}
          </Text>
        )}
      </View>
    </Container>
  );
}

