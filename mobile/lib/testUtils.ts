import { resetFirstLikeModalStatus } from './firstLikeStorage';
import { resetProfilePictureFeatureModalStatus } from './profilePictureFeatureStorage';

/**
 * Utility functions for testing modals
 * These should only be used in development
 */
export const testUtils = {
  /**
   * Reset the first like modal status so it can be shown again
   * Useful for testing the modal functionality
   */
  resetFirstLikeModal: async () => {
    if (__DEV__) {
      await resetFirstLikeModalStatus();
      console.log(
        'First like modal status reset. The modal will show on the next like.'
      );
    } else {
      console.warn('resetFirstLikeModal can only be used in development mode');
    }
  },
  /**
   * Reset the profile picture feature modal status so it can be shown again
   * Useful for testing the modal functionality
   */
  resetProfilePictureFeatureModal: async () => {
    if (__DEV__) {
      await resetProfilePictureFeatureModalStatus();
      console.log(
        'Profile picture feature modal status reset. The modal will show on the next app launch for authenticated users.'
      );
    } else {
      console.warn('resetProfilePictureFeatureModal can only be used in development mode');
    }
  },
};

// Make it available globally in development
if (__DEV__) {
  (globalThis as any).testUtils = testUtils;
}
