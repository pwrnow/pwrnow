import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { AppStartup } from '../lib/appStartup';
import { useThemeColors } from '../hooks/useThemeColors';

interface AppStartupProps {
  children: React.ReactNode;
  onStartupComplete?: () => void;
}

export default function AppStartupComponent({
  children,
  onStartupComplete,
}: AppStartupProps) {
  const queryClient = useQueryClient();
  const { colors } = useThemeColors();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        setInitializationError(null);

        const initializer = new AppStartup(queryClient);
        await initializer.initialize();

        console.log('🎉 App startup completed successfully');
        onStartupComplete?.();
      } catch (error) {
        console.error('💥 App initialization failed:', error);
        setInitializationError(
          error instanceof Error ? error.message : 'Unknown error'
        );
        // Continue with app even if initialization fails
        onStartupComplete?.();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, [queryClient, onStartupComplete]);

  // Show loading indicator during initialization
  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size='large' color={colors.primary} />
      </View>
    );
  }

  // Show error state if initialization failed (but still render children)
  if (initializationError) {
    console.warn(
      'App initialization had errors, but continuing with cached data:',
      initializationError
    );
  }

  // Render children once initialization is complete
  return <>{children}</>;
}
