import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../lib/i18n';
import { adminApi } from '../../lib/api';
import { ProfileImageChangeRequest, Event } from '../../types';
import Avatar from '../../components/Avatar';
import EventCard from '../../components/EventCard';
import * as Haptics from 'expo-haptics';

export default function AdminScreen() {
  const { colors, isDark } = useTheme();
  const { isStaff, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  // Fetch pending requests
  const {
    data: pendingRequests = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['pending-profile-image-requests'],
    queryFn: () => adminApi.getPendingProfileImageRequests(),
    enabled: isStaff && isAuthenticated,
  });

  // Fetch recently added events
  const {
    data: recentEvents = [],
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ['recently-added-events'],
    queryFn: () => adminApi.getRecentlyAddedEvents(),
    enabled: isStaff && isAuthenticated,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (requestId: string) => adminApi.approveProfileImageRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-profile-image-requests'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(t('success'), t('requestApproved'));
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), error.message);
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ requestId, feedback }: { requestId: string; feedback: string }) =>
      adminApi.rejectProfileImageRequest(requestId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-profile-image-requests'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setRejectModalVisible(false);
      setSelectedRequestId(null);
      setRejectionFeedback('');
      Alert.alert(t('success'), t('requestRejected'));
    },
    onError: (error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('error'), error.message);
    },
  });

  const handleApprove = useCallback(async (requestId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    approveMutation.mutate(requestId);
  }, [approveMutation]);

  const handleRejectPress = useCallback(async (requestId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRequestId(requestId);
    setRejectionFeedback('');
    setRejectModalVisible(true);
  }, []);

  const handleConfirmReject = useCallback(() => {
    if (!rejectionFeedback.trim()) {
      Alert.alert(t('error'), t('feedbackRequired'));
      return;
    }
    if (selectedRequestId) {
      rejectMutation.mutate({
        requestId: selectedRequestId,
        feedback: rejectionFeedback.trim(),
      });
    }
  }, [selectedRequestId, rejectionFeedback, rejectMutation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isStaff || !isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text
          style={{ color: colors.mutedForeground }}
          className="text-sm text-center"
        >
          Staff access required
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
    >
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              refetchEvents();
            }}
            tintColor={Platform.OS === 'ios' ? colors.mutedForeground : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
          />
        }
      >
        {/* Pending Requests Section */}
        <View className="mb-8 mt-4">
          <Text
            style={{ color: colors.foreground }}
            className="text-xl font-semibold mb-4"
          >
            {t('pendingRequests')}
          </Text>

          {isLoading ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="border rounded-[14px] p-6 items-center"
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : pendingRequests.length === 0 ? (
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
                <Feather name="check-circle" size={28} color={colors.mutedForeground} />
              </View>
              <Text
                style={{ color: colors.foreground }}
                className="text-base font-semibold text-center mb-1"
              >
                {t('noPendingRequests')}
              </Text>
              <Text
                style={{ color: colors.mutedForeground }}
                className="text-sm text-center"
              >
                {t('noPendingRequestsDescription')}
              </Text>
            </View>
          ) : (
            pendingRequests.map((request: ProfileImageChangeRequest) => (
              <View
                key={request.id}
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                }}
                className="border rounded-[14px] p-4 mb-3"
              >
                {/* User Info Row */}
                <View className="flex-row items-center mb-4">
                  <Avatar
                    size={44}
                    username={request.username}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      style={{ color: colors.foreground }}
                      className="text-base font-semibold"
                    >
                      {request.username}
                    </Text>
                    <Text
                      style={{ color: colors.mutedForeground }}
                      className="text-xs mt-0.5"
                    >
                      {request.user_email}
                    </Text>
                    <Text
                      style={{ color: colors.mutedForeground }}
                      className="text-xs mt-1"
                    >
                      {formatDate(request.created_at)}
                    </Text>
                  </View>
                </View>

                {/* Large Image Preview */}
                <View
                  style={{ backgroundColor: colors.muted }}
                  className="rounded-xl p-2 mb-4 items-center"
                >
                  <Avatar
                    size={160}
                    username={request.username}
                    imageUri={request.image_url}
                  />
                </View>

                {/* Action Buttons */}
                <View className="flex-row" style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleRejectPress(request.id)}
                    disabled={rejectMutation.isPending || approveMutation.isPending}
                    style={{
                      backgroundColor: isDark ? 'rgba(220, 38, 38, 0.15)' : 'rgba(220, 38, 38, 0.1)',
                      borderColor: 'rgba(220, 38, 38, 0.3)',
                    }}
                    className="flex-1 border rounded-[10px] py-3 items-center active:opacity-80"
                  >
                    <View className="flex-row items-center">
                      <Feather name="x" size={16} color="#DC2626" />
                      <Text
                        style={{ color: '#DC2626' }}
                        className="text-sm font-semibold ml-1.5"
                      >
                        {t('reject')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleApprove(request.id)}
                    disabled={approveMutation.isPending || rejectMutation.isPending}
                    style={{
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                      borderColor: 'rgba(16, 185, 129, 0.3)',
                    }}
                    className="flex-1 border rounded-[10px] py-3 items-center active:opacity-80"
                  >
                    {approveMutation.isPending ? (
                      <ActivityIndicator size="small" color="#10B981" />
                    ) : (
                      <View className="flex-row items-center">
                        <Feather name="check" size={16} color="#10B981" />
                        <Text
                          style={{ color: '#10B981' }}
                          className="text-sm font-semibold ml-1.5"
                        >
                          {t('approve')}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recently Added Events Section */}
        <View className="mb-8">
          <Text
            style={{ color: colors.foreground }}
            className="text-xl font-semibold mb-4"
          >
            Recently Added (Last 3 Days)
          </Text>

          {isLoadingEvents ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
              }}
              className="border rounded-[14px] p-6 items-center"
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : recentEvents.length === 0 ? (
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
                <Feather name="calendar" size={28} color={colors.mutedForeground} />
              </View>
              <Text
                style={{ color: colors.foreground }}
                className="text-base font-semibold text-center mb-1"
              >
                No Recent Events
              </Text>
              <Text
                style={{ color: colors.mutedForeground }}
                className="text-sm text-center"
              >
                No events have been added in the last 3 days
              </Text>
            </View>
          ) : (
            recentEvents.map((event: Event) => (
              <View key={event.id} className="mb-3">
                <EventCard event={event} />
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Rejection Feedback Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderRadius: 14,
              padding: 20,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text
              style={{ color: colors.foreground }}
              className="text-lg font-semibold mb-4"
            >
              {t('rejectionFeedback')}
            </Text>
            <TextInput
              value={rejectionFeedback}
              onChangeText={setRejectionFeedback}
              placeholder={t('rejectionFeedbackPlaceholder')}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.muted,
                borderRadius: 10,
                padding: 12,
                fontSize: 14,
                color: colors.foreground,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
            <View className="flex-row mt-4" style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={{
                  backgroundColor: colors.muted,
                }}
                className="flex-1 py-3 rounded-[10px] items-center active:opacity-80"
              >
                <Text
                  style={{ color: colors.foreground }}
                  className="text-sm font-semibold"
                >
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                disabled={rejectMutation.isPending}
                style={{
                  backgroundColor: '#DC2626',
                }}
                className="flex-1 py-3 rounded-[10px] items-center active:opacity-80"
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-semibold text-white">
                    {t('reject')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
