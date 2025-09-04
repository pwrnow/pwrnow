import React from 'react';
import { View, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  imageUrl: string;
  aspectRatio?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

export const EventHeroImage: React.FC<Props> = ({ imageUrl, aspectRatio }) => {
  if (!imageUrl) return null as any;

  return (
    <View className='relative mx-4 mt-2'>
      <Image
        source={{ uri: imageUrl }}
        className='w-full rounded-xl'
        style={{ height: screenWidth * 0.5 }}
        resizeMode='cover'
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 100,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      />
    </View>
  );
};

export default EventHeroImage;
