import { View, ScrollView, RefreshControl, Platform, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';
import EmptyState from './EmptyState';
import { Friend, FriendRequest, SearchedUser } from '../types';
import Avatar from './Avatar';

interface FriendsListViewProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  searchResults: SearchedUser[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearching: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string, username: string) => void;
  onSendFriendRequest: (userId: string) => void;
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  acceptRequestPending: boolean;
  acceptingRequestId?: string;
  rejectRequestPending: boolean;
  rejectingRequestId?: string;
  sendRequestPending: boolean;
  sendingRequestToUserId?: string;
  showEmptyState?: boolean;
  emptyState?: {
    title: string;
    message: string;
  };
}

export default function FriendsListView({
  friends,
  friendRequests,
  searchResults,
  searchQuery,
  onSearchQueryChange,
  isSearching,
  onRefresh,
  refreshing,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onSendFriendRequest,
  isLoadingFriends,
  isLoadingRequests,
  acceptRequestPending,
  acceptingRequestId,
  rejectRequestPending,
  rejectingRequestId,
  sendRequestPending,
  sendingRequestToUserId,
  showEmptyState = false,
  emptyState,
}: FriendsListViewProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
      colors={Platform.OS === 'android' ? [subtleSpinnerColor] : undefined}
      progressBackgroundColor={
        Platform.OS === 'android' ? colors.background : undefined
      }
      titleColor={Platform.OS === 'ios' ? subtleSpinnerColor : undefined}
    />
  );

  // Show empty state if needed
  if (showEmptyState && emptyState) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
        }}
      >
        <ScrollView
          style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
          contentContainerStyle={{
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            flex: 1,
          }}
          refreshControl={refreshControl}
        >
          <EmptyState title={emptyState.title} message={emptyState.message} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
      }}
    >
      <ScrollView
        style={{ backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
        contentContainerStyle={{
          backgroundColor: isDark ? '#000000' : '#FFFFFF',
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
              borderRadius: 12,
              paddingHorizontal: 12,
              height: 48,
            }}
          >
            <Ionicons
              name="search"
              size={20}
              color={isDark ? '#9CA3AF' : '#6B7280'}
            />
            <TextInput
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 16,
                color: isDark ? '#FFFFFF' : '#000000',
              }}
              placeholder={t('searchByUsername')}
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchQueryChange('')}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={isDark ? '#6B7280' : '#9CA3AF'}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Friend Requests Section */}
        {isLoadingRequests ? (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 12,
              }}
            >
              {t('friendRequests')}
            </Text>
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
          </View>
        ) : friendRequests.length > 0 ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 12,
              }}
            >
              {t('friendRequests')}
            </Text>
            {friendRequests.map((request) => (
              <View
                key={request.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Avatar
                    size={40}
                    username={request.from_user.username}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: isDark ? '#FFFFFF' : '#000000',
                    }}
                  >
                    {request.from_user.username}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => onRejectRequest(request.id)}
                    disabled={rejectRequestPending && rejectingRequestId === request.id}
                    style={{
                      backgroundColor: isDark ? '#374151' : '#E5E7EB',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? '#FFFFFF' : '#000000',
                        fontWeight: '500',
                      }}
                    >
                      {t('reject')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onAcceptRequest(request.id)}
                    disabled={acceptRequestPending && acceptingRequestId === request.id}
                    style={{
                      backgroundColor: isDark ? '#10B981' : '#059669',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    {acceptRequestPending && acceptingRequestId === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>
                        {t('accept')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Friends List Section */}
        <View style={{ paddingHorizontal: 16, paddingTop: friendRequests.length > 0 ? 0 : 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: isDark ? '#FFFFFF' : '#000000',
              marginBottom: 12,
            }}
          >
            {t('myFriends')}
          </Text>
          {isLoadingFriends ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator color={isDark ? '#FFFFFF' : '#000000'} />
            </View>
          ) : friends.length === 0 ? (
            <View style={{ paddingVertical: 40 }}>
              <Ionicons
                name="people-outline"
                size={64}
                color={isDark ? '#374151' : '#E5E7EB'}
                style={{ alignSelf: 'center', marginBottom: 16 }}
              />
              <Text
                style={{
                  fontSize: 16,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('noFriendsYet')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: isDark ? '#6B7280' : '#9CA3AF',
                  textAlign: 'center',
                }}
              >
                {t('addFriendsToSeeThemHere')}
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View
                key={friend.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Avatar
                    size={40}
                    username={friend.username}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: isDark ? '#FFFFFF' : '#000000',
                    }}
                  >
                    {friend.username}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => onRemoveFriend(friend.id, friend.username)}
                  style={{
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? '#EF4444' : '#DC2626',
                      fontWeight: '500',
                    }}
                  >
                    {t('remove')}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Search Results Overlay */}
      {searchQuery.trim().length >= 3 && (
        <View
          style={{
            position: 'absolute',
            top: 80, // Below search bar
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: isDark ? '#000000' : '#FFFFFF',
            zIndex: 1000,
          }}
        >
          <ScrollView
            style={{
              flex: 1,
              backgroundColor: isDark ? '#000000' : '#FFFFFF',
            }}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                marginBottom: 12,
              }}
            >
              {t('searchResults')}
            </Text>
            {isSearching ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
            ) : searchResults.length === 0 ? (
              <View style={{ paddingVertical: 60, alignItems: 'center' }}>
                <Ionicons
                  name="search-outline"
                  size={64}
                  color={isDark ? '#374151' : '#E5E7EB'}
                  style={{ marginBottom: 16 }}
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: isDark ? '#9CA3AF' : '#6B7280',
                    textAlign: 'center',
                  }}
                >
                  {t('noResults')}
                </Text>
              </View>
            ) : (
              searchResults.map((user) => (
                <View
                  key={user.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Avatar
                      size={40}
                      username={user.username}
                      style={{ marginRight: 12 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        color: isDark ? '#FFFFFF' : '#000000',
                      }}
                    >
                      {user.username}
                    </Text>
                  </View>
                  {user.is_friend ? (
                    <Text
                      style={{
                        color: isDark ? '#10B981' : '#059669',
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {t('alreadyFriends')}
                    </Text>
                  ) : user.has_pending_request ? (
                    <Text
                      style={{
                        color: isDark ? '#F59E0B' : '#D97706',
                        fontSize: 14,
                        fontWeight: '500',
                      }}
                    >
                      {t('pending')}
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={() => onSendFriendRequest(user.id)}
                      disabled={sendRequestPending && sendingRequestToUserId === user.id}
                      style={{
                        backgroundColor: isDark ? '#3B82F6' : '#2563EB',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                      }}
                    >
                      {sendRequestPending && sendingRequestToUserId === user.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={{ color: '#FFFFFF', fontWeight: '500' }}>
                          {t('invite')}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

