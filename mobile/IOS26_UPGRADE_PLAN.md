# iOS 26 Native Styles Upgrade Plan

## Prerequisites

### Dev Client Build Required
Native modules like `react-native-bottom-tabs` and `NativeTabs` **do not work in Expo Go**. You must switch to a dev client build.

**Option A — Physical device (ad-hoc):**
Your friend (Apple Developer account holder) runs once in interactive mode:
```bash
eas build --profile development --platform ios
```
This sets up ad-hoc signing credentials on Expo's servers. After that, you can use `--non-interactive`.

**Option B — Simulator:**
Add a `development-simulator` profile to `eas.json` with `"ios": { "simulator": true }` — no Apple signing needed.

---

## Key Facts

- **`<Tabs>` from expo-router uses `@react-navigation/bottom-tabs` (JS-based)** — it does NOT automatically get liquid glass on iOS 26.
- **`<NativeTabs>` from `expo-router/unstable-native-tabs`** is the correct component — it's backed by `react-native-bottom-tabs` and renders native UIKit tab bars.
- `react-native-bottom-tabs` is already installed in the project.
- `expo-blur` is already installed but unused.
- On iOS 18 and below, `NativeTabs` renders a standard native tab bar (graceful fallback).

---

## iOS 26 Capabilities Available in SDK 55

| Feature | Prop/API | Description |
|---------|----------|-------------|
| Liquid Glass | Automatic on iOS 26 with `NativeTabs` | Tab bar adopts translucent floating aesthetic |
| Minimize on Scroll | `minimizeBehavior="automatic"` | Tab bar shrinks on scroll down, expands on scroll up |
| Bottom Accessory | `bottomAccessory` prop | Floating view above tab bar (like Music mini player) |
| Sidebar Adaptable | `sidebarAdaptable={true}` | Tabs become sidebar on iPadOS/macOS |
| Blur Effect | `blurEffect="systemMaterial"` | Explicit blur for pre-iOS 26 devices |

---

## Phase 1: Native Tab Bar (Liquid Glass)

**File:** `app/(tabs)/_layout.tsx`

Replace `<Tabs>` with `<NativeTabs>` from `expo-router/unstable-native-tabs`.

### Changes Required
- **Icons:** Switch from Ionicons to **SF Symbols** (required by native tabs)
  - `home-outline` → `{ sf: "house" }` / `{ sf: "house.fill" }`
  - `heart-outline` → `{ sf: "heart" }` / `{ sf: "heart.fill" }`
  - `people-outline` → `{ sf: "person.2" }` / `{ sf: "person.2.fill" }`
  - `shield-outline` → `{ sf: "shield" }` / `{ sf: "shield.fill" }`
- **API change:** Uses `<NativeTabs.Trigger>` instead of `<Tabs.Screen>`

### Example Implementation
```tsx
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  const { isStaff } = useAuth();

  return (
    <NativeTabs
      minimizeBehavior="automatic"
      sidebarAdaptable={false}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon icon={{ sf: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="liked">
        <NativeTabs.Trigger.Icon icon={{ sf: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>{t('liked')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Icon icon={{ sf: 'person.2.fill' }} />
        <NativeTabs.Trigger.Label>{t('friends')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {isStaff && (
        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Icon icon={{ sf: 'shield.fill' }} />
          <NativeTabs.Trigger.Label>{t('admin')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}
```

### Platform Strategy: iOS 26+ Liquid Glass / iOS <26 Fallback / Android

The approach uses `NativeTabs` on **all iOS versions** (it renders a native `UITabBarController`), plus keeps the current JS `<Tabs>` on Android.

**How it works across platforms:**
- **iOS 26+**: `NativeTabs` automatically renders the **liquid glass** floating tab bar (no extra config — UIKit does it). `minimizeBehavior="automatic"` enables scroll-to-minimize.
- **iOS 18–25**: `NativeTabs` renders a **standard opaque native tab bar** (same as the stock Settings/App Store apps). Still native, just without the liquid glass effect. Setting `blurEffect="systemMaterial"` gives a translucent blur on these versions.
- **Android**: Keep the current JS-based `<Tabs>` from expo-router for Material design consistency.

```tsx
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../lib/i18n';

export default function TabsLayout() {
  const { isStaff } = useAuth();

  if (Platform.OS === 'ios') {
    return <IOSNativeTabs isStaff={isStaff} />;
  }

  return <AndroidTabs isStaff={isStaff} />;
}

// iOS: Native UITabBarController — liquid glass on iOS 26+, standard native on <26
function IOSNativeTabs({ isStaff }: { isStaff: boolean }) {
  return (
    <NativeTabs
      minimizeBehavior="automatic"
      sidebarAdaptable={false}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon icon={{ sf: 'house.fill' }} />
        <NativeTabs.Trigger.Label>{t('home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="liked">
        <NativeTabs.Trigger.Icon icon={{ sf: 'heart.fill' }} />
        <NativeTabs.Trigger.Label>{t('liked')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Icon icon={{ sf: 'person.2.fill' }} />
        <NativeTabs.Trigger.Label>{t('friends')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {isStaff && (
        <NativeTabs.Trigger name="admin">
          <NativeTabs.Trigger.Icon icon={{ sf: 'shield.fill' }} />
          <NativeTabs.Trigger.Label>{t('admin')}</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}

// Android: JS-based tabs with Ionicons (Material design)
function AndroidTabs({ isStaff }: { isStaff: boolean }) {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#FFFFFF' : '#000000',
        tabBarInactiveTintColor: isDark ? '#6B7280' : '#9CA3AF',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: isDark ? '#374151' : '#E5E7EB',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="liked"
        options={{
          title: t('liked'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: t('friends'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: t('admin'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-outline" size={size} color={color} />
          ),
          href: isStaff ? undefined : null,
        }}
      />
    </Tabs>
  );
}
```

### Visual Summary

| Platform | iOS 26+ | iOS 18–25 | Android |
|----------|---------|-----------|---------|
| Component | `NativeTabs` | `NativeTabs` | `Tabs` (JS) |
| Tab bar style | Liquid glass (automatic) | Standard native + optional blur | Material bottom tabs |
| Minimize on scroll | Yes (`minimizeBehavior`) | No (ignored) | No |
| Icons | SF Symbols | SF Symbols | Ionicons |
| Bottom accessory | Supported | Not supported | Not applicable |

---

## Phase 2: Translucent Navigation Header

**File:** `app/_layout.tsx`

Add glass header to the Stack navigator:

```tsx
<Stack
  screenOptions={{
    headerTransparent: true,
    headerBlurEffect: 'systemMaterial', // iOS glass header
    headerStyle: {
      backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.background,
    },
  }}
>
```

Already supported by React Navigation — no extra library needed.

---

## Phase 3: BlurView Modals

**Files (~9 modal components):**
- `components/SelectionModal.tsx`
- `components/FirstLikeModal.tsx`
- `components/ProfilePictureFeatureModal.tsx`
- `components/UsernameSelectionModal.tsx`
- `components/FriendsInterestedModal.tsx`
- `components/OrganizationListModal.tsx`
- `components/VerifyEventModal.tsx`
- `components/SignInRequiredModal.tsx`
- `components/QRScanFeedback.tsx`

Replace `backgroundColor: 'rgba(0, 0, 0, 0.5)'` overlays with:

```tsx
import { BlurView } from 'expo-blur';

<BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
  {/* modal content */}
</BlurView>
```

`expo-blur` is already installed.

---

## Phase 4: Scroll Edge Appearance

**Files:** `components/EventFeed.tsx`, `app/(tabs)/_layout.tsx`

- FlatLists already have `scrollEventThrottle={16}` and `onScroll` callbacks
- `minimizeBehavior="automatic"` on `NativeTabs` handles tab bar minimize/expand automatically based on scroll
- Add `contentInsetAdjustmentBehavior="automatic"` to ScrollViews/FlatLists for proper safe area handling with translucent bars

---

## What NOT to Change
- **NativeWind/Tailwind** — keep for component styling
- **ThemeContext** — keep for non-system colors
- **Reanimated animations** — independent of iOS version
- **Ionicons** — keep for non-tab-bar icons throughout the app

---

## Files Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `app/(tabs)/_layout.tsx` | Replace `<Tabs>` with `<NativeTabs>`, SF Symbol icons |
| 2 | `app/_layout.tsx` | Add `headerTransparent` + `headerBlurEffect` |
| 3 | 9x `components/*Modal.tsx` | Replace RGBA overlays with `<BlurView>` |
| 4 | `components/EventFeed.tsx` | Add `contentInsetAdjustmentBehavior` |
| 0 | `eas.json` | Simulator build profile (if needed) |

---

## Verification
1. Build dev client: `eas build --profile development --platform ios`
2. On iOS 26: tab bar shows liquid glass, minimizes on scroll
3. On iOS 18: tab bar shows standard native appearance (graceful fallback)
4. Headers are translucent with blur on iOS
5. Modals have blur backdrop instead of solid overlay
6. Android still works with standard Material tabs
