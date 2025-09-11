# Offline Caching Implementation

This document describes the comprehensive offline caching system implemented in the PWrNow mobile app.

## Overview

The app now supports full offline functionality with intelligent caching of events data and images. When the app starts or refreshes, it checks for internet connectivity and handles data accordingly.

## Features

### 1. Network State Management
- Real-time network connectivity monitoring
- Automatic detection of online/offline status
- Graceful handling of network state changes

### 2. Data Caching
- **Events Data**: Cached using AsyncStorage with React Query integration
- **Images**: Cached locally using expo-file-system with intelligent cleanup
- **Categories**: Cached alongside events for complete offline experience

### 3. Offline UI Components
- **OfflineScreen**: Full-screen message when offline without cached data (extreme scenario only)
- **CachedImage**: Smart image component that uses cached images when offline

### 4. Professional Data Flow
- **Online**: Silently downloads and caches all data (events + images), shows events without any messages
- **Offline with Cache**: Silently shows cached events without any notifications or messages
- **Offline without Cache**: Shows offline screen with pull-to-refresh option (extreme scenario)

### 5. Optimized Image Caching Strategy
- **Proactive Preloading**: Images cached during initial sync for main page display
- **Smart Batching**: Images cached in optimized batches to prevent system overload
- **Priority System**: High priority for visible events, medium for upcoming, low for background
- **Deduplication**: Same images cached only once across events and posts
- **Automatic Fallback**: All image components use CachedImage for seamless offline experience

## Architecture

### Core Components

#### 1. ImageCacheManager (`lib/imageCache.ts`)
- Manages local image caching using expo-file-system
- Automatic cleanup of old/expired images
- Size-based cache management (100MB limit)
- URL-based image deduplication

#### 2. OfflineManager (`lib/offlineManager.ts`)
- Central coordinator for offline functionality
- Handles data synchronization
- Manages cache state and statistics
- Provides fallback data access

#### 3. ImagePreloader (`lib/imagePreloader.ts`)
- Intelligent image preloading system
- Priority-based caching (high/medium/low)
- Batch processing for optimal performance
- Deduplication to prevent redundant downloads

#### 4. OfflineProvider (`providers/offline.tsx`)
- App-wide offline state management
- Handles app initialization and data sync
- Manages offline UI display logic

### UI Components

#### 1. OfflineScreen
```tsx
<OfflineScreen
  onRefresh={handleRefresh}
  isRefreshing={isRefreshing}
/>
```

#### 2. CachedImage
```tsx
<CachedImage
  source={{ uri: imageUrl }}
  style={imageStyle}
  contentFit="cover"
/>
```

## Usage

### App Initialization
The app automatically handles offline state during startup:

1. **Online**: Silently downloads and caches events + images, shows events without messages
2. **Offline with Cache**: Silently shows cached events without any notifications
3. **Offline without Cache**: Shows offline screen with pull-to-refresh (extreme scenario)

### Manual Refresh
Users can manually refresh data:
- **Online**: Syncs fresh data from server
- **Offline**: Uses cached data (no network request)

### Image Caching
Images are automatically cached when:
- Events are loaded
- User views event details
- Images are displayed in the app

## Configuration

### Cache Settings
```typescript
// Image cache limits
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Data cache settings (in queryConfig.ts)
maxAge: 24 * 60 * 60 * 1000, // 24 hours
```

### Network Behavior
```typescript
// Network request timeout
const timeout = 3000; // 3 seconds

// Retry settings
maxAttempts: 1, // Single retry for faster UX
```

## File Structure

```
mobile/
├── lib/
│   ├── imageCache.ts          # Image caching manager
│   ├── imagePreloader.ts      # Intelligent image preloading
│   ├── offlineManager.ts      # Offline state coordinator
│   └── network.ts             # Network state utilities
├── components/
│   ├── OfflineNotification.tsx # Offline popup
│   ├── OfflineScreen.tsx      # Offline full screen
│   ├── CachedImage.tsx        # Smart image component
│   ├── EventCard.tsx          # Updated to use CachedImage
│   └── PostsList.tsx          # Updated to use CachedImage
├── providers/
│   └── offline.tsx            # Offline provider
└── hooks/
    ├── useOfflineManager.ts   # Offline state hook
    ├── useImagePreloading.ts  # Image preloading hook
    └── useAppRefresh.ts       # App refresh hook
```

## Integration Points

### 1. App Layout
The `OfflineProvider` is integrated into the app layout to provide app-wide offline functionality.

### 2. Data Queries
All data queries (`useEvents`, `useCategories`, `useEventBySlug`) now include offline fallback logic.

### 3. Image Components
All image components (`EventCard`, `EventHeroImage`, `PostsList`) now use `CachedImage` for automatic offline support.

## Benefits

1. **Improved UX**: App works seamlessly offline
2. **Reduced Data Usage**: Images cached locally
3. **Faster Loading**: Cached data loads instantly
4. **Reliability**: Graceful degradation when offline
5. **Smart Caching**: Automatic cleanup prevents storage bloat

## Monitoring

### Cache Statistics
```typescript
// Get cache stats
const stats = offlineManager.getCacheStats();
console.log('Data cache:', stats.data);
console.log('Image cache:', stats.images);
```

### Debug Information
The system logs important events:
- Network state changes
- Cache sync operations
- Offline state transitions
- Image caching operations

## Future Enhancements

1. **Selective Sync**: Only sync changed data
2. **Background Sync**: Sync when app becomes active
3. **Cache Compression**: Compress cached images
4. **User Preferences**: Allow users to manage cache size
5. **Analytics**: Track offline usage patterns
