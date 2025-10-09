import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../lib/i18n';
// Import FriendsListView component with updated props for friend suggestions
import FriendsListView from '../../components/FriendsListView';
import {
  useFriends,
  useFriendRequests,
  useUserSearch,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSendFriendRequest,
  useSuggestedFriends,
} from '../../lib/queries';

export default function FriendsScreen() {
  const { isAuthenticated } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const appState = useRef(AppState.currentState);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // React Query hooks
  const { data: friends = [], isLoading: isLoadingFriends, refetch: refetchFriends } = useFriends(isAuthenticated);
  const { data: friendRequests = [], isLoading: isLoadingRequests, refetch: refetchRequests } = useFriendRequests(isAuthenticated);
  const { data: searchResults = [], isLoading: isSearching } = useUserSearch(debouncedQuery, isAuthenticated);
  const { data: suggestedFriends = [], isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useSuggestedFriends(isAuthenticated);

  // Listen for app state changes and refetch data when app becomes active
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        isAuthenticated
      ) {
        // App has come to the foreground, refetch friends and requests
        refetchFriends();
        refetchRequests();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, refetchFriends, refetchRequests]);

  // Mutations
  const acceptRequestMutation = useAcceptFriendRequest();
  const rejectRequestMutation = useRejectFriendRequest();
  const removeFriendMutation = useRemoveFriend();
  const sendRequestMutation = useSendFriendRequest();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFriends(), refetchRequests(), refetchSuggestions()]);
    setRefreshing(false);
  }, [refetchFriends, refetchRequests, refetchSuggestions]);

  const handleAcceptRequest = useCallback(async (requestId: string) => {
    try {
      await acceptRequestMutation.mutateAsync(requestId);
      // Request accepted successfully - no alert needed
    } catch (error) {
      Alert.alert(t('error'), t('errorAcceptingRequest'));
    }
  }, [acceptRequestMutation]);

  const handleRejectRequest = useCallback(async (requestId: string) => {
    try {
      await rejectRequestMutation.mutateAsync(requestId);
      Alert.alert(t('success'), t('friendRequestRejected'));
    } catch (error) {
      Alert.alert(t('error'), t('errorRejectingRequest'));
    }
  }, [rejectRequestMutation]);

  const handleRemoveFriend = useCallback(async (friendId: string, username: string) => {
    Alert.alert(
      t('confirmRemoveFriend'),
      t('confirmRemoveFriendMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFriendMutation.mutateAsync(friendId);
            } catch (error) {
              Alert.alert(t('error'), t('errorRemovingFriend'));
            }
          },
        },
      ]
    );
  }, [removeFriendMutation]);

  const handleSendFriendRequest = useCallback(async (userId: string) => {
    try {
      await sendRequestMutation.mutateAsync(userId);
      // Request sent successfully - no alert needed
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('errorSendingRequest'));
    }
  }, [sendRequestMutation]);

  return (
    <FriendsListView
      friends={friends}
      friendRequests={friendRequests}
      suggestedFriends={suggestedFriends}
      searchResults={searchResults}
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      isSearching={isSearching}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      onAcceptRequest={handleAcceptRequest}
      onRejectRequest={handleRejectRequest}
      onRemoveFriend={handleRemoveFriend}
      onSendFriendRequest={handleSendFriendRequest}
      isLoadingFriends={isLoadingFriends}
      isLoadingRequests={isLoadingRequests}
      isLoadingSuggestions={isLoadingSuggestions}
      acceptRequestPending={acceptRequestMutation.isPending}
      acceptingRequestId={acceptRequestMutation.variables}
      rejectRequestPending={rejectRequestMutation.isPending}
      rejectingRequestId={rejectRequestMutation.variables}
      sendRequestPending={sendRequestMutation.isPending}
      sendingRequestToUserId={sendRequestMutation.variables}
      showEmptyState={!isAuthenticated}
      emptyState={{
        title: t('signInToSeeFriends'),
        message: t('signInToConnectWithFriends'),
      }}
    />
  );
}

