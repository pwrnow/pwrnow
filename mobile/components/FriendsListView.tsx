import { useState } from 'react';
import { View, ScrollView, RefreshControl, Platform, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';
import EmptyState from './EmptyState';
import { Friend, FriendRequest, SearchedUser, FriendSuggestion } from '../types';
import Avatar from './Avatar';
import InviteButton from './InviteButton';

// Updated interface to include friend suggestions  
export interface FriendsListViewProps {
  friends: Friend[];
  friendRequests: FriendRequest[];
  suggestedFriends: FriendSuggestion[];
  searchResults: SearchedUser[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  isSearching: boolean;
  onRefresh: () => void;
  refreshing: boolean;
  onAcceptRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onRemoveFriend: (friendId: string, username: string) => void;
  onSendFriendRequest: (userId: string, fromSuggestions?: boolean) => void;
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingSuggestions: boolean;
  acceptRequestPending: boolean;
  acceptingRequestId?: string;
  rejectRequestPending: boolean;
  rejectingRequestId?: string;
  sendRequestPending: boolean;
  sendingRequestToUserId?: string;
  pendingSuggestionIds: Set<string>;
  showEmptyState?: boolean;
  emptyState?: {
    title: string;
    message: string;
  };
}

export default function FriendsListView({
  friends,
  friendRequests,
  suggestedFriends,
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
  isLoadingSuggestions,
  acceptRequestPending,
  acceptingRequestId,
  rejectRequestPending,
  rejectingRequestId,
  sendRequestPending,
  sendingRequestToUserId,
  pendingSuggestionIds,
  showEmptyState = false,
  emptyState,
}: FriendsListViewProps) {
  const { colors, isDark } = useThemeColors();
  const insets = useSafeAreaInsets();
  const subtleSpinnerColor = isDark ? '#A3A3A3' : '#9CA3AF';
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

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

        {/* Suggested Friends Section */}
        {!isLoadingSuggestions && suggestedFriends.length > 0 ? (
          <View style={{ paddingTop: 16, paddingBottom: 16 }}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: isDark ? '#FFFFFF' : '#000000',
                }}
              >
                {t('suggestFriends')}
              </Text>
              <Ionicons
                name={isSuggestionsExpanded ? 'chevron-up' : 'chevron-down'}
                size={24}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>

            {isSuggestionsExpanded && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  gap: 12,
                }}
              >
                {suggestedFriends.map((suggestion) => (
                  <View
                    key={suggestion.id}
                    style={{
                      width: 160,
                      backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                      borderRadius: 12,
                      padding: 16,
                      alignItems: 'center',
                    }}
                  >
                    <Avatar
                      size={64}
                      username={suggestion.username}
                      style={{ marginBottom: 12 }}
                    />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isDark ? '#FFFFFF' : '#000000',
                        marginBottom: 4,
                        textAlign: 'center',
                      }}
                      numberOfLines={1}
                    >
                      {suggestion.username}
                    </Text>
                    {suggestion.source_friend && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDark ? '#9CA3AF' : '#6B7280',
                          marginBottom: 4,
                          textAlign: 'center',
                        }}
                        numberOfLines={1}
                      >
                        {t('friendOf', { username: suggestion.source_friend })}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: 11,
                        color: isDark ? '#6B7280' : '#9CA3AF',
                        marginBottom: 12,
                        textAlign: 'center',
                      }}
                    >
                      {suggestion.mutual_friends_count === 1
                        ? t('mutualFriend', { count: suggestion.mutual_friends_count })
                        : t('mutualFriends', { count: suggestion.mutual_friends_count })}
                    </Text>
                    {pendingSuggestionIds.has(suggestion.id) ? (
                      <View
                        style={{
                          backgroundColor: isDark ? '#374151' : '#E5E7EB',
                          paddingHorizontal: 20,
                          paddingVertical: 8,
                          borderRadius: 8,
                          width: '100%',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            color: isDark ? '#F59E0B' : '#D97706',
                            fontSize: 14,
                            fontWeight: '500',
                          }}
                        >
                          {t('requestSent')}
                        </Text>
                      </View>
                    ) : (
                      <InviteButton
                        userId={suggestion.id}
                        onPress={(userId) => onSendFriendRequest(userId, true)}
                        isPending={sendRequestPending}
                        pendingUserId={sendingRequestToUserId}
                        size="small"
                        fullWidth
                      />
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ) : null}
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
                  {user.friendship_status === 'friend' ? (
                    <View
                      style={{
                        backgroundColor: isDark ? '#10B981' : '#D1FAE5',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? '#FFFFFF' : '#065F46',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {t('friends')}
                      </Text>
                    </View>
                  ) : user.friendship_status === 'request_sent' ? (
                    <View
                      style={{
                        backgroundColor: isDark ? '#F59E0B' : '#FEF3C7',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? '#FFFFFF' : '#92400E',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {t('pending')}
                      </Text>
                    </View>
                  ) : user.friendship_status === 'request_received' ? (
                    <View
                      style={{
                        backgroundColor: isDark ? '#3B82F6' : '#DBEAFE',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                      }}
                    >
                      <Text
                        style={{
                          color: isDark ? '#FFFFFF' : '#1E40AF',
                          fontSize: 12,
                          fontWeight: '600',
                        }}
                      >
                        {t('respond')}
                      </Text>
                    </View>
                  ) : (
                    <InviteButton
                      userId={user.id}
                      onPress={onSendFriendRequest}
                      isPending={sendRequestPending}
                      pendingUserId={sendingRequestToUserId}
                    />
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

