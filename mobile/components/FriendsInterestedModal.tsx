import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import ModalOverlay from './ModalOverlay';
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
  const { colors } = useThemeColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <ModalOverlay
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            borderRadius: 14,
            padding: 20,
            backgroundColor: colors.background,
            maxHeight: 520,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: '600',
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
              friends.map((friend, index) => (
                <View
                  key={friend.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: index < friends.length - 1 ? 1 : 0,
                    borderBottomColor: colors.border,
                  }}
                >
                  <Avatar size={40} username={friend.username} imageUri={friend.profile_image_url || undefined} />
                  <Text
                    style={{
                      marginLeft: 12,
                      color: colors.foreground,
                      fontSize: 15,
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
              borderRadius: 10,
              backgroundColor: colors.muted,
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: colors.foreground,
                fontWeight: '600',
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {t('close')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </ModalOverlay>
    </Modal>
  );
}
