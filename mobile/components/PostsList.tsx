import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Props {
  posts: Array<{
    id: string;
    author: string;
    content: string | null;
    timestamp: string;
    images: string[];
  }>;
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
  const renderImages = (images: string[]) => {
    if (!images || images.length === 0) return null;

    if (images.length === 1) {
      return (
        <TouchableOpacity
          className='mt-3 rounded-lg overflow-hidden'
          onPress={() => onImagePress(images, 0)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: images[0] }}
            className='w-full rounded-lg'
            style={{ height: 200 }}
            resizeMode='cover'
          />
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View className='mt-3 flex-row gap-2'>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() => onImagePress(images, index)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: image }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (images.length >= 3) {
      return (
        <View className='mt-3 gap-2'>
          <View className='flex-row gap-2'>
            <TouchableOpacity
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() => onImagePress(images, 0)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[0] }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </TouchableOpacity>
            <TouchableOpacity
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() => onImagePress(images, 1)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[1] }}
                className='w-full rounded-lg'
                style={{ height: 150 }}
                resizeMode='cover'
              />
            </TouchableOpacity>
          </View>
          <View className='flex-row gap-2'>
            <TouchableOpacity
              className='flex-1 rounded-lg overflow-hidden'
              onPress={() => onImagePress(images, 2)}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: images[2] }}
                className='w-full rounded-lg'
                style={{ height: 100 }}
                resizeMode='cover'
              />
            </TouchableOpacity>
            {images.length > 3 && (
              <TouchableOpacity
                className='flex-1 rounded-lg overflow-hidden relative'
                onPress={() => onImagePress(images, 3)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: images[3] }}
                  className='w-full rounded-lg'
                  style={{ height: 100 }}
                  resizeMode='cover'
                />
                {images.length > 4 && (
                  <View className='absolute inset-0 bg-black/50 rounded-lg items-center justify-center'>
                    <Text className='text-white font-groteskSemibold text-sm'>
                      +{images.length - 4}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }
  };

  return (
    <View className='space-y-4'>
      {posts.map((post, index) => (
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
                  {getInitials(post.author)}
                </Text>
              )}
            </View>
            <View className='flex-1'>
              <Text className='text-black dark:text-white font-groteskMedium text-sm'>
                {post.author}
              </Text>
              <Text className='text-black/50 dark:text-white/50 font-grotesk text-xs'>
                {formatPostTime(post.timestamp)}
              </Text>
            </View>
          </View>

          {post.content && (
            <Text className='text-black/90 dark:text-white/90 font-grotesk text-sm leading-5'>
              {post.content}
            </Text>
          )}

          {renderImages(post.images)}
        </Animated.View>
      ))}
    </View>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(PostsList);
