import { imageCacheManager } from './imageCache';
import { offlineManager } from './offlineManager';
import type { Event } from '../types';

export class ImagePreloader {
  private static instance: ImagePreloader;
  private preloadingQueue: Set<string> = new Set();
  private isPreloading = false;

  private constructor() {}

  static getInstance(): ImagePreloader {
    if (!ImagePreloader.instance) {
      ImagePreloader.instance = new ImagePreloader();
    }
    return ImagePreloader.instance;
  }

  /**
   * Preload images for events that are likely to be viewed
   */
  async preloadEventImages(events: Event[], priority: 'high' | 'medium' | 'low' = 'medium'): Promise<void> {
    try {
      if (!events || !Array.isArray(events) || events.length === 0) {
        console.log('No events to preload images for');
        return;
      }

      const imageUrls = this.extractImageUrls(events);
      if (imageUrls.length === 0) {
        console.log('No image URLs found in events');
        return;
      }

      await this.preloadImages(imageUrls, priority);
    } catch (error) {
      console.error('Error in preloadEventImages:', error);
      throw error;
    }
  }

  /**
   * Preload images for a specific event (high priority)
   */
  async preloadEventImages(event: Event): Promise<void> {
    try {
      if (!event || typeof event !== 'object') {
        console.log('Invalid event provided for preloading');
        return;
      }

      const imageUrls = this.extractImageUrls([event]);
      if (imageUrls.length === 0) {
        console.log('No image URLs found in event');
        return;
      }

      await this.preloadImages(imageUrls, 'high');
    } catch (error) {
      console.error('Error in preloadEventImages (single event):', error);
      throw error;
    }
  }

  /**
   * Extract all image URLs from events
   */
  private extractImageUrls(events: Event[]): string[] {
    const urls: string[] = [];

    for (const event of events) {
      // Skip invalid events
      if (!event || typeof event !== 'object') {
        continue;
      }
      // Event image
      if (event.image_url) {
        urls.push(event.image_url);
      }

      // Organization image
      if (event.organization?.image_url) {
        urls.push(event.organization.image_url);
      }

      // Post images
      if (event.posts && Array.isArray(event.posts)) {
        for (const post of event.posts) {
          if (post.images && Array.isArray(post.images)) {
            for (const image of post.images) {
              if (image?.url) {
                urls.push(image.url);
              }
            }
          }
        }
      }
    }

    // Remove duplicates
    return [...new Set(urls)];
  }

  /**
   * Preload a list of images with priority
   */
  private async preloadImages(urls: string[], priority: 'high' | 'medium' | 'low'): Promise<void> {
    if (this.isPreloading && priority !== 'high') {
      return; // Don't start new preloading if already in progress (unless high priority)
    }

    this.isPreloading = true;

    try {
      // Filter out already cached images
      const uncachedUrls = [];
      for (const url of urls) {
        if (!this.preloadingQueue.has(url)) {
          const cached = await imageCacheManager.getCachedImage(url);
          if (!cached) {
            uncachedUrls.push(url);
            this.preloadingQueue.add(url);
          }
        }
      }

      if (uncachedUrls.length === 0) {
        return;
      }

      console.log(`Preloading ${uncachedUrls.length} images with ${priority} priority`);

      // Adjust batch size based on priority
      const batchSize = priority === 'high' ? 5 : priority === 'medium' ? 3 : 2;
      const delay = priority === 'high' ? 100 : priority === 'medium' ? 200 : 500;

      // Process in batches
      for (let i = 0; i < uncachedUrls.length; i += batchSize) {
        const batch = uncachedUrls.slice(i, i + batchSize);
        
        // Cache images in parallel
        const promises = batch.map(async (url) => {
          try {
            await imageCacheManager.cacheImage(url);
            this.preloadingQueue.delete(url);
          } catch (error) {
            console.warn(`Failed to preload image: ${url}`, error);
            this.preloadingQueue.delete(url);
          }
        });

        await Promise.allSettled(promises);

        // Delay between batches (except for the last batch)
        if (i + batchSize < uncachedUrls.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      console.log(`Completed preloading ${uncachedUrls.length} images`);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Preload images for visible events (called when events are displayed)
   */
  async preloadVisibleEvents(events: Event[]): Promise<void> {
    // Only preload first 10 events to avoid overwhelming the system
    const visibleEvents = events.slice(0, 10);
    await this.preloadEventImages(visibleEvents, 'medium');
  }

  /**
   * Preload images for upcoming events (background task)
   */
  async preloadUpcomingEvents(): Promise<void> {
    try {
      const events = await offlineManager.getCachedEvents();
      if (events.length > 0) {
        // Preload all events with low priority
        await this.preloadEventImages(events, 'low');
      }
    } catch (error) {
      console.warn('Failed to preload upcoming events:', error);
    }
  }

  /**
   * Clear preloading queue
   */
  clearQueue(): void {
    this.preloadingQueue.clear();
  }

  /**
   * Get preloading status
   */
  getStatus(): { isPreloading: boolean; queueSize: number } {
    return {
      isPreloading: this.isPreloading,
      queueSize: this.preloadingQueue.size,
    };
  }
}

export const imagePreloader = ImagePreloader.getInstance();
