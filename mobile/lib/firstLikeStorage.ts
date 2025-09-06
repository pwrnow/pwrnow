import AsyncStorage from '@react-native-async-storage/async-storage';

const FIRST_LIKE_KEY = 'first_like_completed';

/**
 * Check if the user has already seen the first like modal
 */
export const hasSeenFirstLikeModal = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(FIRST_LIKE_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error checking first like modal status:', error);
    return false;
  }
};

/**
 * Mark that the user has seen the first like modal
 */
export const markFirstLikeModalAsSeen = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(FIRST_LIKE_KEY, 'true');
  } catch (error) {
    console.error('Error marking first like modal as seen:', error);
  }
};

/**
 * Reset the first like modal status (useful for testing)
 */
export const resetFirstLikeModalStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(FIRST_LIKE_KEY);
  } catch (error) {
    console.error('Error resetting first like modal status:', error);
  }
};
