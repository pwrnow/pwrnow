import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { useTheme } from '../contexts/ThemeContext';

interface CachedImageProps {
  source: { uri: string };
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * CachedImage component that leverages expo-image's built-in caching.
 * expo-image automatically caches images on disk and in memory for optimal performance.
 * No need for custom caching logic - expo-image handles it efficiently.
 */
export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  fallback,
  onLoad,
  onError,
  priority = 'normal',
}) => {
  const { colors } = useTheme();
  const [hasError, setHasError] = React.useState(false);

  // Reset error state when source changes
  React.useEffect(() => {
    setHasError(false);
  }, [source.uri]);

  if (!source.uri) {
    return (
      <View style={[style, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
        {fallback}
      </View>
    );
  }

  if (hasError) {
    return (
      <View style={[style, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
        {fallback || null}
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      contentFit={contentFit}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
      transition={150}
      // expo-image caching options - use disk cache for persistence
      cachePolicy="disk"
      // Priority for loading
      priority={priority}
      // Use blurhash placeholder for smooth loading if available
      placeholder={placeholder ? undefined : { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      placeholderContentFit="cover"
    />
  );
};

export default CachedImage;
