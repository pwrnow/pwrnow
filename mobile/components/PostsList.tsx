import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Post } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';
import CachedImage from './CachedImage';

interface Props {
  posts: Post[];
  organizationImageUrl?: string;
  formatPostTime: (timestamp: string) => string;
  getInitials: (name: string) => string;
  onImagePress: (images: string[], initialIndex: number) => void;
  focusPostId?: string;
}

const PostsList: React.FC<Props> = ({
  posts,
  organizationImageUrl,
  formatPostTime,
  getInitials,
  onImagePress,
  focusPostId,
}) => {
  const { colors } = useThemeColors();
  const scrollViewRef = useRef<ScrollView>(null);
  const postRefs = useRef<{ [key: string]: any }>({});

  // Scroll to focused post when focusPostId changes
  useEffect(() => {
    if (focusPostId && posts && posts.length > 0) {
      // Find the index of the focused post
      const postIndex = posts.findIndex((post) => post.id === focusPostId);
      if (postIndex !== -1) {
        // Wait for the next frame to ensure the post is rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: postIndex * 200, // Approximate height per post
            animated: true,
          });
        }, 100);
      }
    }
  }, [focusPostId, posts]);

  // Parse aspect ratio string to number
  const parseAspectRatio = (ratio?: string | null): number => {
    if (!ratio) return 16 / 9;

    if (ratio.includes(':')) {
      const [width, height] = ratio.split(':').map(Number);
      return width / height;
    }

    return parseFloat(ratio) || 16 / 9;
  };

  // Determine if an image is portrait, square, or landscape
  const getImageOrientation = (ratio?: string | null) => {
    const aspectRatio = parseAspectRatio(ratio);
    if (Math.abs(aspectRatio - 1) <= 0.1) return 'square';
    return aspectRatio < 1 ? 'portrait' : 'landscape';
  };

  // Smart layout algorithm based on aspect ratios
  const determineOptimalLayout = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    if (images.length === 1) return 'single';
    if (images.length === 2) {
      const orientations = images.map((img) =>
        getImageOrientation(img.aspect_ratio)
      );
      // If both are portrait, stack vertically; otherwise side by side
      return orientations.every((o) => o === 'portrait')
        ? 'stacked'
        : 'side-by-side';
    }
    if (images.length >= 3) {
      const orientations = images.map((img) =>
        getImageOrientation(img.aspect_ratio)
      );
      const landscapeCount = orientations.filter(
        (o) => o === 'landscape'
      ).length;
      const portraitCount = orientations.filter((o) => o === 'portrait').length;

      // If mostly portraits, use a more vertical layout
      if (portraitCount > landscapeCount) return 'vertical-grid';
      // If mostly landscapes, use horizontal layout
      return 'horizontal-grid';
    }
    return 'grid';
  };

  const renderImages = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    if (!images || images.length === 0) return null;

    const layout = determineOptimalLayout(images);
    const maxDisplayImages = Math.min(images.length, 4);

    switch (layout) {
      case 'single':
        return renderSingleImage(images[0], 0);

      case 'stacked':
        return renderStackedImages(images);

      case 'side-by-side':
        return renderSideBySideImages(images);

      case 'vertical-grid':
        return renderVerticalGrid(images);

      case 'horizontal-grid':
      default:
        return renderHorizontalGrid(images);
    }
  };

  const renderSingleImage = (
    image: { url: string; aspect_ratio?: string | null },
    index: number
  ) => {
    const aspectRatio = parseAspectRatio(image.aspect_ratio);
    const orientation = getImageOrientation(image.aspect_ratio);

    // Limit extreme aspect ratios for better UX
    const displayRatio = Math.min(Math.max(aspectRatio, 0.6), 2);

    return (
      <TouchableOpacity
        className='mt-2 rounded-lg overflow-hidden'
        onPress={() => onImagePress([image.url], index)}
        activeOpacity={0.8}
      >
        <CachedImage
          source={{ uri: image.url }}
          style={{ 
            width: '100%', 
            aspectRatio: displayRatio,
            borderRadius: 8,
          }}
          contentFit='cover'
        />
      </TouchableOpacity>
    );
  };

  const renderStackedImages = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    return (
      <View className='mt-2 gap-1.5'>
        {images.slice(0, 2).map((image, index) => (
          <TouchableOpacity
            key={index}
            className='rounded-lg overflow-hidden'
            onPress={() =>
              onImagePress(
                images.map((img) => img.url),
                index
              )
            }
            activeOpacity={0.8}
          >
            <CachedImage
              source={{ uri: image.url }}
              style={{
                width: '100%',
                aspectRatio: Math.min(
                  Math.max(parseAspectRatio(image.aspect_ratio), 0.8),
                  1.3
                ),
                borderRadius: 8,
              }}
              contentFit='cover'
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderSideBySideImages = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    return (
      <View className='mt-2 flex-row gap-1.5'>
        {images.slice(0, 2).map((image, index) => {
          const aspectRatio = parseAspectRatio(image.aspect_ratio);
          const orientation = getImageOrientation(image.aspect_ratio);

          return (
            <TouchableOpacity
              key={index}
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() =>
                onImagePress(
                  images.map((img) => img.url),
                  index
                )
              }
              activeOpacity={0.8}
            >
              <CachedImage
                source={{ uri: image.url }}
                style={{
                  width: '100%',
                  aspectRatio: orientation === 'portrait' ? 0.85 : 1.1,
                  borderRadius: 8,
                }}
                contentFit='cover'
              />
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderVerticalGrid = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    const displayImages = images.slice(0, 4);

    return (
      <View className='mt-2 gap-1.5'>
        {/* First image full width */}
        <TouchableOpacity
          className='rounded-lg overflow-hidden'
          onPress={() =>
            onImagePress(
              images.map((img) => img.url),
              0
            )
          }
          activeOpacity={0.8}
        >
          <CachedImage
            source={{ uri: displayImages[0].url }}
            style={{
              width: '100%',
              aspectRatio: Math.min(
                Math.max(parseAspectRatio(displayImages[0].aspect_ratio), 0.8),
                1.6
              ),
              borderRadius: 8,
            }}
            contentFit='cover'
          />
        </TouchableOpacity>

        {/* Remaining images in a row */}
        {displayImages.length > 1 && (
          <View className='flex-row gap-1.5'>
            {displayImages.slice(1).map((image, index) => (
              <TouchableOpacity
                key={index + 1}
                className='flex-1 rounded-lg overflow-hidden relative'
                onPress={() =>
                  onImagePress(
                    images.map((img) => img.url),
                    index + 1
                  )
                }
                activeOpacity={0.8}
              >
                <CachedImage
                  source={{ uri: image.url }}
                  style={{ 
                    width: '100%', 
                    aspectRatio: 1,
                    borderRadius: 8,
                  }}
                  contentFit='cover'
                />
                {index === 2 && images.length > 4 && (
                  <View
                    className='absolute inset-0 rounded-lg items-center justify-center'
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <Text
                      className='font-groteskSemibold text-sm'
                      style={{ color: colors.background }}
                    >
                      +{images.length - 4}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHorizontalGrid = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    const displayImages = images.slice(0, 4);

    return (
      <View className='mt-2 gap-1.5'>
        <View className='flex-row gap-1.5'>
          {displayImages.slice(0, 2).map((image, index) => (
            <TouchableOpacity
              key={index}
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() =>
                onImagePress(
                  images.map((img) => img.url),
                  index
                )
              }
              activeOpacity={0.8}
              >
                <CachedImage
                  source={{ uri: image.url }}
                  style={{ 
                    width: '100%', 
                    aspectRatio: 1.1,
                    borderRadius: 8,
                  }}
                  contentFit='cover'
                />
              </TouchableOpacity>
          ))}
        </View>

        {displayImages.length > 2 && (
          <View className='flex-row gap-1.5'>
            {displayImages.slice(2).map((image, index) => (
              <TouchableOpacity
                key={index + 2}
                className='flex-1 rounded-lg overflow-hidden relative'
                onPress={() =>
                  onImagePress(
                    images.map((img) => img.url),
                    index + 2
                  )
                }
                activeOpacity={0.8}
              >
                <CachedImage
                  source={{ uri: image.url }}
                  style={{ 
                    width: '100%', 
                    aspectRatio: 1,
                    borderRadius: 8,
                  }}
                  contentFit='cover'
                />
                {index === 1 && images.length > 4 && (
                  <View
                    className='absolute inset-0 rounded-lg items-center justify-center'
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  >
                    <Text
                      className='font-groteskSemibold text-sm'
                      style={{ color: colors.background }}
                    >
                      +{images.length - 4}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      className='flex-1'
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <View className='space-y-4'>
        {posts.map((post, index) => {
          const images = post.images || [];
          const authorName = post.organization?.name || '';
          const timestamp = post.created_at;
          const content = post.text;
          return (
            <Animated.View
              key={post.id}
              ref={(ref) => {
                postRefs.current[post.id] = ref;
              }}
              entering={FadeInDown.duration(200).delay(index * 50)}
              className='rounded-xl p-3 mb-2'
              style={{
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderWidth: 1,
              }}
            >
              <View className='flex-row items-center mb-4'>
                <View
                  className='w-8 h-8 rounded-full overflow-hidden items-center justify-center mr-3'
                  style={{ backgroundColor: `${colors.accent}20` }}
                >
                  {organizationImageUrl ? (
                    <CachedImage
                      source={{ uri: organizationImageUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit='cover'
                    />
                  ) : (
                    <Text
                      className='font-groteskSemibold text-xs'
                      style={{ color: colors.accent }}
                    >
                      {getInitials(authorName)}
                    </Text>
                  )}
                </View>
                <View className='flex-1'>
                  <Text
                    className='font-groteskMedium text-sm'
                    style={{ color: colors.foreground }}
                  >
                    {authorName}
                  </Text>
                  <Text
                    className='font-grotesk text-xs'
                    style={{ color: colors.mutedForeground }}
                  >
                    {formatPostTime(timestamp)}
                  </Text>
                </View>
              </View>

              {content && (
                <Text
                  className='font-grotesk text-sm leading-5'
                  style={{ color: colors.foreground }}
                >
                  {content}
                </Text>
              )}

              {renderImages(images)}
            </Animated.View>
          );
        })}
      </View>
    </ScrollView>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PostsList);
