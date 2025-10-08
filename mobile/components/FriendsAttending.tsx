import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const [showModal, setShowModal] = useState(false);
  const insets = useSafeAreaInsets();

  if (count === 0) return null;

  const displayedFriends = friends.slice(0, 3);
  const hasMore = count > 3;

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowModal(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
          borderRadius: 8,
          marginTop: 8,
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Ionicons
            name="people"
            size={16}
            color={isDark ? '#3B82F6' : '#2563EB'}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#D1D5DB' : '#6B7280',
              flex: 1,
            }}
            numberOfLines={1}
          >
            {count === 1
              ? `${displayedFriends[0].username}`
              : count === 2
              ? `${displayedFriends[0].username} ${t('and')} ${displayedFriends[1].username}`
              : hasMore
              ? `${displayedFriends[0].username}, ${displayedFriends[1].username} ${t('andOthers', { count: count - 2 })}`
              : `${displayedFriends[0].username}, ${displayedFriends[1].username} ${t('and')} ${displayedFriends[2].username}`}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={isDark ? '#9CA3AF' : '#9CA3AF'}
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* Full List Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            paddingTop: insets.top,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: isDark ? '#374151' : '#E5E7EB',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
              }}
            >
              {t('friendsAttending')}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons
                name="close"
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          </View>

          {/* Friends List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 8 }}
          >
            {friends.map((friend, index) => (
              <View
                key={friend.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 16,
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
                  <Ionicons
                    name="person"
                    size={20}
                    color={isDark ? '#9CA3AF' : '#6B7280'}
                  />
                </View>
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? '#FFFFFF' : '#000000',
                  }}
                >
                  {friend.username}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

