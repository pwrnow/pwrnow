import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import Avatar from './Avatar';
import { t } from '../lib/i18n';
import { FriendSummary } from './FriendsAttending';

interface FriendsInterestedModalProps {
  visible: boolean;
  onClose: () => void;
  friends: FriendSummary[];
  count: number;
}

export default function FriendsInterestedModal({
  visible,
  onClose,
  friends,
  count,
}: FriendsInterestedModalProps) {
  const { colors, isDark } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            borderRadius: 24,
            padding: 20,
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            maxHeight: 520,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: '700',
            }}
          >
            {t('friendsInterestedModalTitle', { count })}
          </Text>

          <ScrollView
            style={{ marginTop: 16 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {friends.length === 0 ? (
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 14,
                }}
              >
                {t('noFriendsYet')}
              </Text>
            ) : (
              friends.map((friend) => (
                <View
                  key={friend.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Avatar size={36} username={friend.username} imageUri={friend.profile_image_url || undefined} />
                  <Text
                    style={{
                      marginLeft: 12,
                      color: colors.foreground,
                      fontSize: 16,
                      fontWeight: '500',
                    }}
                  >
                    {friend.username}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>

          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: 12,
              backgroundColor: colors.primary,
            }}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: colors.primaryForeground,
                fontWeight: '600',
                textAlign: 'center',
                fontSize: 16,
              }}
            >
              {t('close')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </TouchableOpacity>
    </Modal>
  );
}


