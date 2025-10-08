import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import * as Haptics from 'expo-haptics';
import { t } from '../lib/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';

interface UsernameSelectionModalProps {
  visible: boolean;
  onComplete: () => void;
  onCancel?: () => void; // Optional for dismissible modals (e.g., from settings)
  dismissible?: boolean; // Whether the modal can be dismissed
}

export default function UsernameSelectionModal({
  visible,
  onComplete,
  onCancel,
  dismissible = false,
}: UsernameSelectionModalProps) {
  const { colors } = useThemeColors();
  const { updateUserLocally } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<
    'idle' | 'available' | 'unavailable' | 'invalid'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [checkTimeout, setCheckTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Validate username format
  const validateUsernameFormat = (value: string): boolean => {
    if (value.length < 3) {
      setErrorMessage(t('usernameAtLeast3'));
      return false;
    }
    if (value.length > 16) {
      setErrorMessage(t('usernameAtMost16'));
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      setErrorMessage(t('usernameAllowedChars'));
      return false;
    }
    setErrorMessage('');
    return true;
  };

  // Check username availability with debounce
  useEffect(() => {
    if (!username) {
      setAvailabilityStatus('idle');
      setErrorMessage('');
      return;
    }

    // Clear previous timeout
    if (checkTimeout) {
      clearTimeout(checkTimeout);
    }

    // Validate format first
    if (!validateUsernameFormat(username)) {
      setAvailabilityStatus('invalid');
      return;
    }

    // Set new timeout to check availability
    const timeout = setTimeout(async () => {
      setIsChecking(true);
      setAvailabilityStatus('idle');

      try {
        const result = await api.user.checkUsername(username);
        if (result.available) {
          setAvailabilityStatus('available');
          setErrorMessage('');
        } else {
          setAvailabilityStatus('unavailable');
          setErrorMessage(t('usernameTaken'));
        }
      } catch (error: any) {
        console.error('Error checking username:', error);
        setAvailabilityStatus('unavailable');
        setErrorMessage(t('usernameCheckFailed'));
      } finally {
        setIsChecking(false);
      }
    }, 500); // 500ms debounce

    setCheckTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [username]);

  const handleSubmit = async () => {
    if (availabilityStatus !== 'available') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t('invalidUsername'), errorMessage || t('chooseValidUsername'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Update username via API - returns updated user data
      const updatedUser = await api.user.updateUsername(username);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Update user data locally immediately (includes username and username_set_by_user)
      await updateUserLocally(updatedUser);
      
      // Invalidate user query to trigger refetch with fresh data
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
      
      // Reset form state
      setUsername('');
      setAvailabilityStatus('idle');
      setErrorMessage('');
      
      onComplete();
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error('Error updating username:', error);
      Alert.alert(t('error'), error.message || t('usernameUpdateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (dismissible && onCancel) {
      // Reset form state
      setUsername('');
      setAvailabilityStatus('idle');
      setErrorMessage('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onCancel();
    }
  };

  const getStatusIcon = () => {
    if (isChecking) {
      return <ActivityIndicator size='small' color={colors.mutedForeground} />;
    }

    switch (availabilityStatus) {
      case 'available':
        return <Feather name='check-circle' size={20} color='#10b981' />;
      case 'unavailable':
      case 'invalid':
        return <Feather name='x-circle' size={20} color='#ef4444' />;
      default:
        return null;
    }
  };

  const getHelperText = () => {
    if (isChecking) {
      return t('checkingAvailability');
    }

    if (errorMessage) {
      return errorMessage;
    }

    if (availabilityStatus === 'available') {
      return t('usernameAvailable');
    }

    return t('chooseUniqueUsername');
  };

  const getHelperTextColor = () => {
    if (availabilityStatus === 'available') return '#10b981';
    if (
      availabilityStatus === 'unavailable' ||
      availabilityStatus === 'invalid'
    )
      return '#ef4444';
    return colors.mutedForeground;
  };

  return (
    <Modal
      visible={visible}
      animationType='fade'
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              {/* Close button for dismissible modals */}
              {dismissible && (
                <TouchableOpacity
                  onPress={handleCancel}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    zIndex: 10,
                    padding: 8,
                  }}
                >
                  <Feather name='x' size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: colors.primary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Feather name='at-sign' size={28} color={colors.primary} />
              </View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.foreground,
                  fontFamily: 'SpaceGrotesk-Bold',
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('chooseYourUsername')}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  fontFamily: 'SpaceGrotesk-Regular',
                  lineHeight: 20,
                }}
              >
                {dismissible ? t('setYourUsernameOnce') : t('usernameOnlyOnce')}
              </Text>
            </View>

            {/* Username Input */}
            <View style={{ marginBottom: 24 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor:
                    availabilityStatus === 'available'
                      ? '#10b981'
                      : availabilityStatus === 'unavailable' ||
                        availabilityStatus === 'invalid'
                      ? '#ef4444'
                      : colors.border,
                  paddingHorizontal: 16,
                  height: 56,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: colors.mutedForeground,
                    fontFamily: 'SpaceGrotesk-Medium',
                    marginRight: 4,
                  }}
                >
                  @
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.foreground,
                    fontFamily: 'SpaceGrotesk-Medium',
                    paddingVertical: 0,
                  }}
                  placeholder={t('usernamePlaceholder')}
                  placeholderTextColor={colors.mutedForeground}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize='none'
                  autoCorrect={false}
                  autoFocus={true}
                  maxLength={16}
                  editable={!isSubmitting}
                />
                <View style={{ marginLeft: 8 }}>{getStatusIcon()}</View>
              </View>

              {/* Helper Text */}
              <Text
                style={{
                  fontSize: 12,
                  color: getHelperTextColor(),
                  fontFamily: 'SpaceGrotesk-Regular',
                  marginTop: 8,
                  marginLeft: 4,
                }}
              >
                {getHelperText()}
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={
                availabilityStatus !== 'available' || isSubmitting || isChecking
              }
              style={{
                backgroundColor:
                  availabilityStatus === 'available' && !isSubmitting
                    ? colors.primary
                    : colors.muted,
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 56,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity:
                  availabilityStatus === 'available' && !isSubmitting ? 0.3 : 0,
                shadowRadius: 8,
                elevation: availabilityStatus === 'available' && !isSubmitting ? 4 : 0,
              }}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size='small' color='#FFFFFF' />
              ) : (
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '700',
                    color:
                      availabilityStatus === 'available'
                        ? '#FFFFFF'
                        : colors.mutedForeground,
                    fontFamily: 'SpaceGrotesk-Bold',
                    letterSpacing: 0.3,
                  }}
                >
                  {t('setUsername')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Info Text */}
            {!dismissible && (
              <Text
                style={{
                  fontSize: 12,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                  fontFamily: 'SpaceGrotesk-Regular',
                  marginTop: 16,
                  lineHeight: 16,
                }}
              >
                {t('usernameNotChangeableWarning')}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

