# First Like Modal Feature

This feature displays a beautiful, animated modal when a user likes an event for the first time. The modal explains the benefits of liking events and encourages continued engagement.

## Features

- **Beautiful Animations**: Heart animation with particles, sparkles, and confetti effects
- **Haptic Feedback**: Enhanced haptic feedback sequence for emotional engagement
- **Marketing Content**: Fun and engaging text that explains the benefits of liking events
- **AsyncStorage Integration**: Tracks whether the user has seen the modal to show it only once
- **Responsive Design**: Matches the app's theme and styling
- **Internationalization**: Supports both English and Polish translations

## Components

### FirstLikeModal

- Located in `components/FirstLikeModal.tsx`
- Animated modal with heart icon, benefits list, and marketing text
- Uses React Native Reanimated for smooth animations
- Includes particle effects and confetti background

### firstLikeStorage

- Located in `lib/firstLikeStorage.ts`
- AsyncStorage utilities for tracking modal status
- Functions: `hasSeenFirstLikeModal()`, `markFirstLikeModalAsSeen()`, `resetFirstLikeModalStatus()`

### useEventActions Hook

- Updated to include first like modal logic
- Automatically shows modal on first like
- Integrates with existing like/unlike functionality

## Usage

The modal is automatically integrated into the event like functionality. When a user likes an event for the first time:

1. The like action is processed normally
2. The system checks if the user has seen the first like modal
3. If not, the modal is displayed with animations
4. The modal status is marked as seen in AsyncStorage

## Testing

For development testing, you can reset the modal status using:

```javascript
// In development mode only
global.testUtils.resetFirstLikeModal();
```

This will allow the modal to be shown again on the next like.

## Translations

The modal includes translations for:

- English (en)
- Polish (pl)

All text is stored in the i18n system and follows the app's translation patterns.

## Styling

The modal uses:

- App's theme colors and dark/light mode support
- Tailwind CSS classes for consistent styling
- Custom animations with React Native Reanimated
- Linear gradient backgrounds for visual appeal
- Proper safe area handling for different devices

## Benefits Explained

The modal explains three key benefits of liking events:

1. **Reminder Notifications**: Users get notified before events start
2. **Event Updates & Posts**: Users receive updates and important information
3. **Show Your Interest**: Helps organizers see popular events and create better experiences

The marketing text encourages continued exploration and community engagement.
