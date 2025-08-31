import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Text as SvgText,
  Path,
} from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { authenticate } from '../lib/api';
import { config } from '../lib/config';
import { t } from '../lib/i18n';
import * as Haptics from 'expo-haptics';

// Required for expo-auth-session on Android
WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = config.iosClientId;

// Use a custom scheme instead of proxy
const REDIRECT_URI = makeRedirectUri({
  scheme: 'pl.pwrnow.app',
});

// Brand gradient colors - blue and pink only
const ACCENT_BLUE = '#2066DF';
const ACCENT_PINK = '#EC2E81';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { setAuthFromBackend, isLoading, isAuthenticated } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  console.log(
    'SignIn Screen - isLoading:',
    isLoading,
    'isAuthenticated:',
    isAuthenticated
  );

  // Redirect if already authenticated (but not if we're currently authenticating)
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAuthenticating) {
      // Reset the navigation stack to the home screen
      router.replace('/');
      // Reset the entire navigation stack to prevent back navigation
      try {
        router.dismissAll();
      } catch (err: any) {
        console.error('Error dismissing all navigation stacks', err);
      }
    }
  }, [isLoading, isAuthenticated, isAuthenticating]);

  const [googleRequest, googleResponse, promptGoogleAsync] =
    Google.useAuthRequest({
      iosClientId: IOS_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: REDIRECT_URI,
      extraParams: {
        prompt: 'consent',
      },
    });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { access_token } = googleResponse.params;
      if (!access_token) {
        Alert.alert('No access token received from Google');
        return;
      }
      (async () => {
        try {
          setIsAuthenticating(true);
          const backendResult = await authenticate('google', access_token);
          await setAuthFromBackend(backendResult);
          // Reset navigation stack to home screen after successful login
          router.replace('/');
          // Reset the entire navigation stack to prevent back navigation
          try {
            router.dismissAll();
          } catch (err: any) {
            console.error('Error dismissing all navigation stacks', err);
          }
        } catch (err: any) {
          console.error('Social login error', err);
          Alert.alert('Login failed', err.message || 'Unknown error');
        } finally {
          setIsAuthenticating(false);
        }
      })();
    } else if (googleResponse?.type === 'error') {
      Alert.alert('Google sign-in error', JSON.stringify(googleResponse));
    }
  }, [googleResponse]);

  const handleAppleSignIn = async () => {
    try {
      setIsAuthenticating(true);

      // Check if we're on iOS
      if (Platform.OS !== 'ios') {
        Alert.alert(t('error'), t('appleSignInIOSOnly'));
        return;
      }

      // Check if Apple authentication is available
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(t('error'), t('appleSignInNotAvailable'));
        return;
      }

      // Perform Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple authentication credential:', credential);

      // Extract the authorization code from the credential
      const { identityToken, user, fullName, email } = credential;

      console.log('Apple authentication successful:', {
        user: user,
        hasFullName: !!fullName,
        hasEmail: !!email,
      });

      if (!identityToken) {
        throw new Error('No identity token received from Apple');
      }

      // Send the authorization code to your backend
      const backendResult = await authenticate('apple', identityToken, {
        lastName: fullName?.familyName,
        firstName: fullName?.givenName,
        email: email,
      });
      await setAuthFromBackend(backendResult);

      // Reset navigation stack to home screen after successful login
      router.replace('/');
    } catch (error: any) {
      console.error('Apple sign-in error:', error);

      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled the sign-in flow - no need to show an alert
        console.log(t('appleSignInCanceled'));
      } else {
        Alert.alert(t('appleSignInFailed'), t('appleSignInGenericError'));
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoBack = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleGooglePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    promptGoogleAsync();
  };

  const handleApplePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleAppleSignIn();
  };

  // Simple loading check
  if (isLoading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text
            style={{
              color: isDark ? '#FFFFFF' : '#000000',
              fontSize: 18,
              fontFamily: 'SpaceGrotesk-Medium',
            }}
          >
            {t('loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? '#000000' : '#FFFFFF' }}
    >
      {/* Header with back button, no logo */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 10,
        }}
      >
        <TouchableOpacity
          onPress={handleGoBack}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.1)'
              : 'rgba(0,0,0,0.05)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={0.7}
        >
          <Feather
            name='arrow-left'
            size={20}
            color={isDark ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
        {/* Main content */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* App logo/title */}
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <View
              style={{
                height: 70,
                width: '100%',
                marginBottom: 24,
              }}
            >
              <Svg height={70} width={'100%'}>
                <Defs>
                  <SvgLinearGradient id='titleGrad' x1='0' y1='0' x2='1' y2='1'>
                    <Stop offset='0%' stopColor={ACCENT_PINK} stopOpacity='1' />
                    <Stop
                      offset='100%'
                      stopColor={ACCENT_BLUE}
                      stopOpacity='1'
                    />
                  </SvgLinearGradient>
                </Defs>
                <SvgText
                  fill='url(#titleGrad)'
                  fontSize='38'
                  fontWeight='700'
                  fontFamily='Righteous-Regular'
                  x='50%'
                  y='42'
                  textAnchor='middle'
                >
                  PWr Now
                </SvgText>
              </Svg>
            </View>

            <Text
              style={{
                fontSize: 26,
                fontWeight: '600',
                color: isDark ? '#FFFFFF' : '#000000',
                textAlign: 'center',
                fontFamily: 'SpaceGrotesk-SemiBold',
                marginBottom: 12,
                lineHeight: 32,
              }}
            >
              {t('unlockFullExperience')}
            </Text>

            <Text
              style={{
                fontSize: 15,
                color: isDark ? '#9CA3AF' : '#6B7280',
                textAlign: 'center',
                fontFamily: 'SpaceGrotesk-Regular',
                lineHeight: 22,
                paddingHorizontal: 16,
              }}
            >
              {t('signInDescription')}
            </Text>
          </View>

          {/* Sign-in buttons */}
          <View
            style={{
              gap: 14,
            }}
          >
            {/* Google Sign-In Button */}
            <TouchableOpacity
              onPress={handleGooglePress}
              disabled={!googleRequest || isAuthenticating}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? '#374151' : '#E5E7EB',
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 24,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 3,
                minHeight: 48,
                opacity: isAuthenticating ? 0.6 : 1,
              }}
              activeOpacity={0.8}
            >
              {/* Google G Logo SVG */}
              <Svg
                width={20}
                height={20}
                viewBox='0 0 24 24'
                style={{ marginRight: 16 }}
              >
                <Path
                  d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                  fill='#4285F4'
                />
                <Path
                  d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                  fill='#34A853'
                />
                <Path
                  d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                  fill='#FBBC05'
                />
                <Path
                  d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                  fill='#EA4335'
                />
              </Svg>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#1F1F1F',
                  fontFamily: 'SpaceGrotesk-Medium',
                  letterSpacing: 0.1,
                }}
              >
                {t('continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            {/* Apple Sign-In Button */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={
                  AppleAuthentication.AppleAuthenticationButtonType.CONTINUE
                }
                buttonStyle={
                  isDark
                    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
                }
                cornerRadius={14}
                style={{
                  width: '100%',
                  height: 48,
                }}
                onPress={handleApplePress}
              />
            )}
          </View>

          {/* Terms text */}
          <Text
            style={{
              fontSize: 13,
              color: isDark ? '#9CA3AF' : '#6B7280',
              textAlign: 'center',
              fontFamily: 'SpaceGrotesk-Regular',
              marginTop: 28,
              lineHeight: 18,
              paddingHorizontal: 12,
            }}
          >
            {t('bySigningInYouAgree')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
