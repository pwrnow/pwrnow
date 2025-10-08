import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t } from '../lib/i18n';

interface FriendAttending {
  id: string;
  username: string;
  participated_at: string;
}

interface FriendsAttendingModalProps {
  visible: boolean;
  onClose: () => void;
  friends: FriendAttending[];
  eventTitle: string;
}

export default function FriendsAttendingModal({
  visible,
  onClose,
  friends,
  eventTitle,
}: FriendsAttendingModalProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? t('justNow') : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            flex: 1,
            justifyContent: 'flex-end',
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: insets.bottom + 20,
              maxHeight: '80%',
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                marginBottom: 16,
              }}
            >
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: colors.foreground,
                    marginBottom: 4,
                  }}
                >
                  {t('friendsAttending')}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.mutedForeground,
                  }}
                  numberOfLines={1}
                >
                  {eventTitle}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#374151' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {/* Friends List */}
            <ScrollView
              style={{ paddingHorizontal: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {friends.map((friend, index) => (
                <View
                  key={friend.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < friends.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: isDark ? '#374151' : '#E5E7EB',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 16,
                        fontWeight: '600',
                      }}
                    >
                      {friend.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.foreground,
                        marginBottom: 2,
                      }}
                    >
                      {friend.username}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: colors.mutedForeground,
                      }}
                    >
                      {t('attended')} • {formatRelativeTime(friend.participated_at)}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: '#10B981' + '15',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

