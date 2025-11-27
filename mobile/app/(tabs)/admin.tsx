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
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { t } from '../../lib/i18n';
import { adminApi } from '../../lib/api';
import { ProfileImageChangeRequest } from '../../types';
import Avatar from '../../components/Avatar';
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
      staffApi.rejectProfileImageRequest(requestId, feedback),
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
      year: 'numeric',
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
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Ionicons
          name="shield-outline"
          size={64}
          color={isDark ? '#374151' : '#E5E7EB'}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            color: colors.foreground,
            textAlign: 'center',
          }}
        >
          {t('admin')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            textAlign: 'center',
            marginTop: 8,
          }}
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
        paddingTop: insets.top,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#374151' : '#E5E7EB',
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: colors.foreground,
          }}
        >
          {t('admin')}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.mutedForeground,
            marginTop: 4,
          }}
        >
          {t('pendingRequests')}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={Platform.OS === 'ios' ? colors.mutedForeground : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Ionicons
              name="checkmark-circle-outline"
              size={64}
              color={isDark ? '#374151' : '#E5E7EB'}
              style={{ marginBottom: 16 }}
            />
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              {t('noPendingRequests')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: colors.mutedForeground,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {t('noPendingRequestsDescription')}
            </Text>
          </View>
        ) : (
          pendingRequests.map((request: ProfileImageChangeRequest) => (
            <View
              key={request.id}
              style={{
                backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              {/* User Info */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Avatar
                  size={48}
                  username={request.username}
                  imageUri={request.image_url}
                />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.foreground,
                    }}
                  >
                    {request.username}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.mutedForeground,
                      marginTop: 2,
                    }}
                  >
                    {request.user_email}
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
                      color: colors.mutedForeground,
                      marginTop: 4,
                    }}
                  >
                    {formatDate(request.created_at)}
                  </Text>
                </View>
              </View>

              {/* Uploaded Image Preview */}
              <View
                style={{
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 16,
                  alignItems: 'center',
                }}
              >
                <Avatar
                  size={150}
                  username={request.username}
                  imageUri={request.image_url}
                />
              </View>

              {/* Action Buttons */}
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                }}
              >
                <TouchableOpacity
                  onPress={() => handleRejectPress(request.id)}
                  disabled={rejectMutation.isPending || approveMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? '#374151' : '#E5E7EB',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#DC2626',
                    }}
                  >
                    {t('rejectWithFeedback')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleApprove(request.id)}
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  style={{
                    flex: 1,
                    backgroundColor: '#10B981',
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                  }}
                >
                  {approveMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#FFFFFF',
                      }}
                    >
                      {t('approve')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 400,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: colors.foreground,
                marginBottom: 16,
              }}
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
                backgroundColor: isDark ? '#374151' : '#F3F4F6',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: colors.foreground,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
            />
            <View
              style={{
                flexDirection: 'row',
                gap: 12,
                marginTop: 16,
              }}
            >
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: colors.foreground,
                  }}
                >
                  {t('cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                disabled={rejectMutation.isPending}
                style={{
                  flex: 1,
                  backgroundColor: '#DC2626',
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                }}
              >
                {rejectMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '600',
                      color: '#FFFFFF',
                    }}
                  >
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

