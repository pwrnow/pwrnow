import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILE_PICTURE_FEATURE_KEY = 'profile_picture_feature_seen';

/**
 * Check if the user has already seen the profile picture feature modal
 */
export const hasSeenProfilePictureFeatureModal = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(PROFILE_PICTURE_FEATURE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking profile picture feature modal status:', error);
    return false;
  }
};

/**
 * Mark that the user has seen the profile picture feature modal
 */
export const markProfilePictureFeatureModalAsSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PROFILE_PICTURE_FEATURE_KEY, 'true');
  } catch (error) {
    console.error('Error marking profile picture feature modal as seen:', error);
  }
};

/**
 * Reset the profile picture feature modal status (useful for testing)
 */
export const resetProfilePictureFeatureModalStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(PROFILE_PICTURE_FEATURE_KEY);
  } catch (error) {
    console.error('Error resetting profile picture feature modal status:', error);
  }
};






