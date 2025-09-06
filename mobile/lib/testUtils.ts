import { resetFirstLikeModalStatus } from './firstLikeStorage';

/**
 * Utility functions for testing the first like modal
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
};

// Make it available globally in development
if (__DEV__) {
  (global as any).testUtils = testUtils;
}
