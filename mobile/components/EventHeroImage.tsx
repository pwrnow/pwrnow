import React from 'react';
import { View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CachedImage from './CachedImage';

interface Props {
  imageUrl: string;
  aspectRatio?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');

export const EventHeroImage: React.FC<Props> = ({ imageUrl, aspectRatio }) => {
  if (!imageUrl) return null as any;

  return (
    <View className='relative mx-4 mt-2'>
      <CachedImage
        source={{ uri: imageUrl }}
        style={{ 
          width: '100%', 
          height: screenWidth * 0.5,
          borderRadius: 12,
        }}
        contentFit='cover'
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
