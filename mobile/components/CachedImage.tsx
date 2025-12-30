import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { imageCacheManager } from '../lib/imageCache';
import { useTheme } from '../contexts/ThemeContext';

interface CachedImageProps {
  source: { uri: string };
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  placeholder?: React.ReactNode;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

export const CachedImage: React.FC<CachedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  fallback,
  onLoad,
  onError,
}) => {
  const { colors } = useTheme();
  const [imageSource, setImageSource] = useState<{ uri: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    loadImage();
  }, [source.uri]);

  const loadImage = async () => {
    if (!source.uri) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      // First try to get cached image
      const cachedPath = await imageCacheManager.getCachedImage(source.uri);
      
      if (cachedPath) {
        setImageSource({ uri: cachedPath });
        setIsLoading(false);
        onLoad?.();
        return;
      }

      // If not cached, try to cache it
      const newCachedPath = await imageCacheManager.cacheImage(source.uri);
      
      if (newCachedPath) {
        setImageSource({ uri: newCachedPath });
        setIsLoading(false);
        onLoad?.();
      } else {
        // Fallback to original URL if caching fails
        setImageSource(source);
        setIsLoading(false);
        onLoad?.();
      }
    } catch (error) {
      console.warn('Failed to load cached image:', error);
      setHasError(true);
      setIsLoading(false);
      onError?.();
    }
  };

  if (hasError) {
    return (
      <View style={[style, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
        {fallback || (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={colors.foreground} />
          </View>
        )}
      </View>
    );
  }

  if (isLoading && !imageSource) {
    return (
      <View style={[style, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
        {placeholder || (
          <ActivityIndicator size="small" color={colors.foreground} />
        )}
      </View>
    );
  }

  return (
    <Image
      source={imageSource || source}
      style={style}
      contentFit={contentFit}
      onLoad={onLoad}
      onError={() => {
        setHasError(true);
        onError?.();
      }}
      transition={200}
    />
  );
};

export default CachedImage;
