import React, { useEffect } from 'react';
import { Button, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import { authenticate } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { config } from '../lib/config';
import * as Google from 'expo-auth-session/providers/google';

// Required for expo-auth-session on Android
WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = config.iosClientId;

// Use a custom scheme instead of proxy
const REDIRECT_URI = makeRedirectUri({
  scheme: 'pl.pwrnow.app',
});

export default function GoogleSignInButton() {
  const { setAuthFromBackend } = useAuth();

  console.log('REDIRECT_URI', REDIRECT_URI);
  console.log('IOS_CLIENT_ID', IOS_CLIENT_ID);

  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: IOS_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri: REDIRECT_URI,
    extraParams: {
      prompt: 'consent',
    },
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      if (!access_token) {
        Alert.alert('No access token received from Google');
        return;
      }
      (async () => {
        try {
          console.log('access_token', access_token);
          const backendResult = await authenticate('google', access_token);
          await setAuthFromBackend(backendResult);
        } catch (err: any) {
          console.error('Social login error', err);
          Alert.alert('Login failed', err.message || 'Unknown error');
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Google sign-in error', JSON.stringify(response));
    }
  }, [response]);

  return (
    <Button
      title='Sign in with Google'
      onPress={() => promptAsync()}
      disabled={!request}
    />
  );
}
