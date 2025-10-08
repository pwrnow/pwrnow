import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { t } from '../lib/i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRScanFeedback, { QRScanState } from '../components/QRScanFeedback';

const { width, height } = Dimensions.get('window');

export default function QRScannerScreen() {
  const { colors, isDark } = useThemeColors();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackState, setFeedbackState] = useState<QRScanState | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [eventTitle, setEventTitle] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarcodeScanned = async ({
    type,
    data,
  }: {
    type: string;
    data: string;
  }) => {
    if (scanned || isProcessing) return;

    setScanned(true);
    setIsProcessing(true);
    setIsScanning(false);

    // Show processing feedback
    setFeedbackState('processing');
    setFeedbackMessage(t('processing'));
    setShowFeedback(true);

    try {
      // Call the API to confirm participation
      const response = await api.events.scanQRCode(data);

      if (response.data.success) {
        // Success case
        setFeedbackState('success');
        setFeedbackMessage(
          response.data.message || t('participationConfirmedMessage')
        );
        setEventTitle(response.data.event?.title || '');
        setShowFeedback(true);
      }
    } catch (error: any) {
      console.error('QR scan error:', error);

      let errorMessage = t('qrScanError');
      let state: QRScanState = 'error';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;

        // Check if it's already confirmed error
        if (
          errorMessage.includes('already confirmed') ||
          errorMessage.includes('already confirmed participation')
        ) {
          state = 'already_confirmed';
          errorMessage = t('alreadyConfirmedMessage');
          setEventTitle(error.response.data.participation?.event_title || '');
        }
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;

        // Check if it's invalid QR code
        if (
          errorMessage.includes('Invalid') ||
          errorMessage.includes('invalid') ||
          errorMessage.includes('inactive')
        ) {
          state = 'invalid_qr';
          errorMessage = t('invalidQRCodeMessage');
        }
      } else if (error.response?.status === 400) {
        // Check for specific error types
        if (error.response.data?.error?.includes('already confirmed')) {
          state = 'already_confirmed';
          errorMessage = t('alreadyConfirmedMessage');
          setEventTitle(error.response.data.participation?.event_title || '');
        } else if (
          error.response.data?.error?.includes('Invalid') ||
          error.response.data?.error?.includes('inactive')
        ) {
          state = 'invalid_qr';
          errorMessage = t('invalidQRCodeMessage');
        }
      }

      setFeedbackState(state);
      setFeedbackMessage(errorMessage);
      setShowFeedback(true);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setIsProcessing(false);
    setIsScanning(true);
    setShowFeedback(false);
    setFeedbackState(null);
    setFeedbackMessage('');
    setEventTitle('');
  };

  const handleFeedbackDismiss = () => {
    setShowFeedback(false);
    setFeedbackState(null);
    setFeedbackMessage('');
    setEventTitle('');

    // Reset scanner state
    setScanned(false);
    setIsProcessing(false);
    setIsScanning(true);
  };

  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size='large' color={colors.primary} />
          <Text style={[styles.text, { color: colors.foreground }]}>
            {t('requestingCameraPermission')}
          </Text>
        </View>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Feather name='camera-off' size={64} color={colors.mutedForeground} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('cameraPermissionRequired')}
          </Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>
            {t('cameraPermissionMessage')}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>
              {t('goBack')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Feather name='lock' size={64} color={colors.mutedForeground} />
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t('authenticationRequired')}
          </Text>
          <Text style={[styles.text, { color: colors.mutedForeground }]}>
            {t('qrScannerAuthMessage')}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/signin')}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {t('signIn')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.border },
              ]}
              onPress={() => router.back()}
            >
              <Text style={[styles.buttonText, { color: colors.foreground }]}>
                {t('goBack')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Feather name='arrow-left' size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {t('qrScanner')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Camera View - Full Screen */}
      <View style={styles.cameraContainer}>
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417'],
          }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Simple Overlay with Scanning Area */}
        <View style={styles.overlay}>
          {/* Top section */}
          <View
            style={[styles.overlayTop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          />

          {/* Middle section with scanning area */}
          <View style={styles.overlayMiddle}>
            <View
              style={[
                styles.overlaySide,
                { backgroundColor: 'rgba(0,0,0,0.5)' },
              ]}
            />

            <View style={styles.scanningArea}>
              {/* Corner indicators */}
              <View
                style={[
                  styles.corner,
                  styles.topLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.topRight,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomLeft,
                  { borderColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.corner,
                  styles.bottomRight,
                  { borderColor: colors.primary },
                ]}
              />
            </View>

            <View
              style={[
                styles.overlaySide,
                { backgroundColor: 'rgba(0,0,0,0.5)' },
              ]}
            />
          </View>

          {/* Bottom section */}
          <View
            style={[
              styles.overlayBottom,
              { backgroundColor: 'rgba(0,0,0,0.5)' },
            ]}
          />
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={[styles.instructionsText, { color: colors.background }]}>
            {t('qrScannerInstructions')}
          </Text>
        </View>

        {/* QR Scan Feedback */}
        {showFeedback && feedbackState && (
          <QRScanFeedback
            state={feedbackState}
            message={feedbackMessage}
            eventTitle={eventTitle}
            onDismiss={handleFeedbackDismiss}
            visible={showFeedback}
          />
        )}
      </View>

      {/* Bottom Actions */}
      <View
        style={[
          styles.bottomActions,
          { backgroundColor: colors.background, paddingBottom: insets.bottom },
        ]}
      >
        {scanned && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={resetScanner}
          >
            <Feather name='refresh-cw' size={20} color={colors.background} />
            <Text
              style={[styles.actionButtonText, { color: colors.background }]}
            >
              {t('scanAgain')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    maxWidth: 300,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 40,
  },

  // Camera styles
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayTop: {
    flex: 1,
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: 280,
  },
  overlaySide: {
    flex: 1,
  },
  overlayBottom: {
    flex: 1,
  },
  scanningArea: {
    width: 280,
    height: 280,
    position: 'relative',
    alignSelf: 'center',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 6,
  },

  // Instructions
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  // Bottom actions
  bottomActions: {
    padding: 20,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
