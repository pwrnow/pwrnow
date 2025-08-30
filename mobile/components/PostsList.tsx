import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { Post } from '../types';

interface Props {
  posts: Post[];
  organizationImageUrl?: string;
  formatPostTime: (timestamp: string) => string;
  getInitials: (name: string) => string;
  onImagePress: (images: string[], initialIndex: number) => void;
}

const PostsList: React.FC<Props> = ({
  posts,
  organizationImageUrl,
  formatPostTime,
  getInitials,
  onImagePress,
}) => {
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
    const displayRatio = Math.min(Math.max(aspectRatio, 0.5), 3);

    return (
      <TouchableOpacity
        className='mt-3 rounded-lg overflow-hidden'
        onPress={() => onImagePress([image.url], index)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: image.url }}
          className='w-full rounded-lg'
          style={{ aspectRatio: displayRatio }}
          resizeMode='cover'
        />
      </TouchableOpacity>
    );
  };

  const renderStackedImages = (
    images: { url: string; aspect_ratio?: string | null }[]
  ) => {
    return (
      <View className='mt-3 gap-2'>
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
            <Image
              source={{ uri: image.url }}
              className='w-full rounded-lg'
              style={{
                aspectRatio: Math.min(
                  Math.max(parseAspectRatio(image.aspect_ratio), 0.7),
                  1.5
                ),
              }}
              resizeMode='cover'
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
      <View className='mt-3 flex-row gap-2'>
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
              <Image
                source={{ uri: image.url }}
                className='w-full rounded-lg'
                style={{
                  aspectRatio: orientation === 'portrait' ? 0.75 : 1.2,
                }}
                resizeMode='cover'
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
      <View className='mt-3 gap-2'>
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
          <Image
            source={{ uri: displayImages[0].url }}
            className='w-full rounded-lg'
            style={{
              aspectRatio: Math.min(
                Math.max(parseAspectRatio(displayImages[0].aspect_ratio), 0.8),
                2
              ),
            }}
            resizeMode='cover'
          />
        </TouchableOpacity>

        {/* Remaining images in a row */}
        {displayImages.length > 1 && (
          <View className='flex-row gap-2'>
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
                <Image
                  source={{ uri: image.url }}
                  className='w-full rounded-lg'
                  style={{ aspectRatio: 1 }}
                  resizeMode='cover'
                />
                {index === 2 && images.length > 4 && (
                  <View className='absolute inset-0 bg-black/50 rounded-lg items-center justify-center'>
                    <Text className='text-white font-groteskSemibold text-sm'>
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
      <View className='mt-3 gap-2'>
        <View className='flex-row gap-2'>
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
              <Image
                source={{ uri: image.url }}
                className='w-full rounded-lg'
                style={{ aspectRatio: 1.2 }}
                resizeMode='cover'
              />
            </TouchableOpacity>
          ))}
        </View>

        {displayImages.length > 2 && (
          <View className='flex-row gap-2'>
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
                <Image
                  source={{ uri: image.url }}
                  className='w-full rounded-lg'
                  style={{ aspectRatio: 1 }}
                  resizeMode='cover'
                />
                {index === 1 && images.length > 4 && (
                  <View className='absolute inset-0 bg-black/50 rounded-lg items-center justify-center'>
                    <Text className='text-white font-groteskSemibold text-sm'>
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
    <View className='space-y-4'>
      {posts.map((post, index) => {
        const images = post.images || [];
        const authorName = post.organization?.name || '';
        const timestamp = post.created_at;
        const content = post.text;
        return (
          <Animated.View
            key={post.id}
            entering={FadeInDown.duration(200).delay(index * 50)}
            className='bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-xl p-4 mb-3'
          >
            <View className='flex-row items-center mb-3'>
              <View className='w-8 h-8 rounded-full overflow-hidden bg-accentBlue/20 items-center justify-center mr-3'>
                {organizationImageUrl ? (
                  <Image
                    source={{ uri: organizationImageUrl }}
                    className='w-full h-full'
                    resizeMode='cover'
                  />
                ) : (
                  <Text className='text-accentBlue font-groteskSemibold text-xs'>
                    {getInitials(authorName)}
                  </Text>
                )}
              </View>
              <View className='flex-1'>
                <Text className='text-black dark:text-white font-groteskMedium text-sm'>
                  {authorName}
                </Text>
                <Text className='text-black/50 dark:text-white/50 font-grotesk text-xs'>
                  {formatPostTime(timestamp)}
                </Text>
              </View>
            </View>

            {content && (
              <Text className='text-black/90 dark:text-white/90 font-grotesk text-sm leading-5'>
                {content}
              </Text>
            )}

            {renderImages(images)}
          </Animated.View>
        );
      })}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PostsList);
