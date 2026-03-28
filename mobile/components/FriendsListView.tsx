import { useState } from 'react';
import { View, ScrollView, RefreshControl, Platform, Text, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
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
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(true);

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={Platform.OS === 'ios' ? colors.mutedForeground : undefined}
      colors={Platform.OS === 'android' ? [colors.primary] : undefined}
      progressBackgroundColor={Platform.OS === 'android' ? colors.background : undefined}
    />
  );

  // Show empty state if needed
  if (showEmptyState && emptyState) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
      >
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={{
            backgroundColor: colors.background,
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
        backgroundColor: colors.background,
      }}
    >
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={refreshControl}
      >
        {/* Search Bar Section */}
        <View className="mt-4 mb-4">
          <View
            style={{
              backgroundColor: colors.muted,
              borderColor: colors.border,
            }}
            className="flex-row items-center border rounded-[14px] px-4 h-12"
          >
            <Feather name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3"
              style={{
                color: colors.foreground,
                fontSize: 16,
                height: 48,
                textAlignVertical: 'center',
              }}
              placeholder={t('searchByUsername')}
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={onSearchQueryChange}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchQueryChange('')}>
                <Feather name="x-circle" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Friend Requests Section */}
        {isLoadingRequests ? (
          <View className="mb-6">
            <Text
              style={{ color: colors.foreground }}
              className="text-xl font-semibold mb-4"
            >
              {t('friendRequests')}
            </Text>
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="border rounded-[14px] p-6 items-center"
            >
              <ActivityIndicator color={colors.primary} />
            </View>
          </View>
        ) : friendRequests.length > 0 ? (
          <View className="mb-6">
            <Text
              style={{ color: colors.foreground }}
              className="text-xl font-semibold mb-4"
            >
              {t('friendRequests')}
            </Text>
            {friendRequests.map((request) => (
              <View
                key={request.id}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="border rounded-[14px] p-4 mb-3"
              >
                <View className="flex-row items-center mb-3">
                  <Avatar
                    size={44}
                    username={request.from_user.username}
                    imageUri={request.from_user.profile_image_url || undefined}
                  />
                  <Text
                    style={{ color: colors.foreground }}
                    className="ml-3 text-base font-medium"
                  >
                    {request.from_user.username}
                  </Text>
                </View>
                <View className="flex-row" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => onRejectRequest(request.id)}
                    disabled={rejectRequestPending && rejectingRequestId === request.id}
                    style={{
                      backgroundColor: colors.muted,
                    }}
                    className="flex-1 py-2.5 rounded-[10px] items-center active:opacity-80"
                  >
                    <Text
                      style={{ color: colors.foreground }}
                      className="text-sm font-semibold"
                    >
                      {t('reject')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onAcceptRequest(request.id)}
                    disabled={acceptRequestPending && acceptingRequestId === request.id}
                    style={{
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}
                    className="flex-1 border py-2.5 rounded-[10px] items-center active:opacity-80"
                  >
                    {acceptRequestPending && acceptingRequestId === request.id ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <Text style={{ color: '#10B981' }} className="text-sm font-semibold">
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
        <View className="mb-6">
          <Text
            style={{ color: colors.foreground }}
            className="text-xl font-semibold mb-4"
          >
            {t('myFriends')}
          </Text>
          {isLoadingFriends ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="border rounded-[14px] p-6 items-center"
            >
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : friends.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="border rounded-[14px] p-6 items-center"
            >
              <View
                style={{ backgroundColor: colors.muted }}
                className="w-14 h-14 rounded-full justify-center items-center mb-3"
              >
                <Feather name="users" size={28} color={colors.mutedForeground} />
              </View>
              <Text
                style={{ color: colors.foreground }}
                className="text-base font-semibold text-center mb-1"
              >
                {t('noFriendsYet')}
              </Text>
              <Text
                style={{ color: colors.mutedForeground }}
                className="text-sm text-center"
              >
                {t('addFriendsToSeeThemHere')}
              </Text>
            </View>
          ) : (
            friends.map((friend) => (
              <View
                key={friend.id}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="border rounded-[14px] p-4 mb-3"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Avatar
                      size={44}
                      username={friend.username}
                      imageUri={friend.profile_image_url || undefined}
                    />
                    <Text
                      style={{ color: colors.foreground }}
                      className="ml-3 text-base font-medium"
                    >
                      {friend.username}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => onRemoveFriend(friend.id, friend.username)}
                    style={{
                      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                      borderColor: 'rgba(220, 38, 38, 0.3)',
                    }}
                    className="border px-3 py-2 rounded-[8px] active:opacity-80"
                  >
                    <Text style={{ color: '#DC2626' }} className="text-sm font-medium">
                      {t('remove')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Suggested Friends Section */}
        {!isLoadingSuggestions && suggestedFriends.length > 0 ? (
          <View className="mb-8">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsSuggestionsExpanded(!isSuggestionsExpanded)}
              className="flex-row items-center justify-between mb-4"
            >
              <Text
                style={{ color: colors.foreground }}
                className="text-xl font-semibold"
              >
                {t('suggestFriends')}
              </Text>
              <Feather
                name={isSuggestionsExpanded ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.foreground}
              />
            </TouchableOpacity>

            {isSuggestionsExpanded && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12 }}
                style={{ marginHorizontal: -16, paddingHorizontal: 16 }}
              >
                {suggestedFriends.map((suggestion) => (
                  <View
                    key={suggestion.id}
                    style={{
                      width: 160,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    }}
                    className="border rounded-[14px] p-4 items-center"
                  >
                    <Avatar
                      size={64}
                      username={suggestion.username}
                      imageUri={suggestion.profile_image_url || undefined}
                      style={{ marginBottom: 12 }}
                    />
                    <Text
                      style={{ color: colors.foreground }}
                      className="text-base font-semibold mb-1 text-center"
                      numberOfLines={1}
                    >
                      {suggestion.username}
                    </Text>
                    {suggestion.source_friend && (
                      <Text
                        style={{ color: colors.mutedForeground }}
                        className="text-xs mb-1 text-center"
                        numberOfLines={1}
                      >
                        {t('friendOf', { username: suggestion.source_friend })}
                      </Text>
                    )}
                    <Text
                      style={{ color: colors.mutedForeground }}
                      className="text-xs mb-3 text-center"
                    >
                      {suggestion.mutual_friends_count === 1
                        ? t('mutualFriend', { count: suggestion.mutual_friends_count })
                        : t('mutualFriends', { count: suggestion.mutual_friends_count })}
                    </Text>
                    {pendingSuggestionIds.has(suggestion.id) ? (
                      <View
                        style={{ backgroundColor: colors.muted }}
                        className="py-2 rounded-[8px] w-full items-center"
                      >
                        <Text
                          style={{ color: '#F59E0B' }}
                          className="text-sm font-medium"
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

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Search Results Overlay */}
      {searchQuery.trim().length >= 3 && (
        <View
          style={{
            position: 'absolute',
            top: 72,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.background,
            zIndex: 1000,
          }}
        >
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{ color: colors.foreground }}
              className="text-xl font-semibold mb-4 mt-2"
            >
              {t('searchResults')}
            </Text>
            {isSearching ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="border rounded-[14px] p-6 items-center"
              >
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : searchResults.length === 0 ? (
              <View
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="border rounded-[14px] p-6 items-center"
              >
                <View
                  style={{ backgroundColor: colors.muted }}
                  className="w-14 h-14 rounded-full justify-center items-center mb-3"
                >
                  <Feather name="search" size={28} color={colors.mutedForeground} />
                </View>
                <Text
                  style={{ color: colors.foreground }}
                  className="text-base font-semibold text-center"
                >
                  {t('noResults')}
                </Text>
              </View>
            ) : (
              searchResults.map((user) => (
                <View
                  key={user.id}
                  style={{
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  }}
                  className="border rounded-[14px] p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <Avatar
                        size={44}
                        username={user.username}
                        imageUri={user.profile_image_url || undefined}
                      />
                      <Text
                        style={{ color: colors.foreground }}
                        className="ml-3 text-base font-medium"
                      >
                        {user.username}
                      </Text>
                    </View>
                    {user.friendship_status === 'friend' ? (
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                        }}
                        className="px-3 py-1.5 rounded-full"
                      >
                        <Text style={{ color: '#10B981' }} className="text-xs font-semibold">
                          {t('friends')}
                        </Text>
                      </View>
                    ) : user.friendship_status === 'request_sent' ? (
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                        }}
                        className="px-3 py-1.5 rounded-full"
                      >
                        <Text style={{ color: '#F59E0B' }} className="text-xs font-semibold">
                          {t('pending')}
                        </Text>
                      </View>
                    ) : user.friendship_status === 'request_received' ? (
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                        }}
                        className="px-3 py-1.5 rounded-full"
                      >
                        <Text style={{ color: '#3B82F6' }} className="text-xs font-semibold">
                          {t('respond')}
                        </Text>
                      </View>
                    ) : (
                      <InviteButton
                        userId={user.id}
                        onPress={onSendFriendRequest}
                        isPending={sendRequestPending}
                        pendingUserId={sendingRequestToUserId}
                        size="small"
                      />
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}
