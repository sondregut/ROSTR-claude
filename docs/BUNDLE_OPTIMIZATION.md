# Bundle Size Optimization Guide for RostrDating

## Current Analysis

### Potential Issues Found
1. ❌ **@supabase/supabase-js was in devDependencies** - Fixed! Moved to dependencies
2. ⚠️ **Unused Dependencies** to investigate:
   - `react-native-otp-verify` - Check if OTP is implemented
   - `react-native-reactions` - Check if custom reactions are used
   - `expo-sms` - Check if SMS features are used
   - `expo-sharing` - Check if sharing features are implemented

### Large Dependencies to Optimize
- **Sentry** - Consider lazy loading or removing if not critical
- **expo-contacts** - Only load when user imports contacts
- **react-native-image-crop-picker** - We already use expo-image-picker

## Optimization Steps

### 1. Remove Unused Dependencies

```bash
# Check for unused dependencies
npm ls react-native-otp-verify
npm ls react-native-reactions  
npm ls expo-sms
npm ls react-native-image-crop-picker
```

### 2. Configure Metro for Better Tree Shaking

Create/update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      reduce_funcs: true,
      reduce_vars: true,
      keep_classnames: false,
      keep_fnames: false,
      keep_infinity: false,
      passes: 2,
    },
  },
};

module.exports = config;
```

### 3. Optimize Images

```javascript
// Update OptimizedImage component settings
export function OptimizedImage({
  // ... existing props
  cachePolicy = 'memory-disk',
  recyclingKey, // Add for better memory management
  allowDownscaling = true, // Add for performance
  ...props
}) {
  return (
    <Image
      {...props}
      cachePolicy={cachePolicy}
      recyclingKey={recyclingKey}
      allowDownscaling={allowDownscaling}
      contentFit={contentFit}
      placeholder={placeholder}
      placeholderContentFit="cover"
      transition={transition}
      priority={priority}
    />
  );
}
```

### 4. Lazy Load Heavy Features

```javascript
// Lazy load Sentry
let Sentry;
export const initSentry = async () => {
  if (!__DEV__ && !Sentry) {
    Sentry = await import('@sentry/react-native');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
    });
  }
};

// Lazy load contacts
let Contacts;
export const getContacts = async () => {
  if (!Contacts) {
    Contacts = await import('expo-contacts');
  }
  return Contacts;
};
```

### 5. Build Configuration

Update `app.json`:

```json
{
  "expo": {
    "experiments": {
      "tsconfigPaths": true
    },
    "build": {
      "production": {
        "env": {
          "EXPO_PUBLIC_STAGE": "production"
        }
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true,
            "useLegacyPackaging": false
          },
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ]
  }
}
```

### 6. Code Splitting Strategies

```javascript
// Split by route
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="settings"
        options={{ 
          presentation: 'modal',
          lazy: true // Lazy load settings
        }} 
      />
    </Stack>
  );
}
```

### 7. Optimize Supabase Client

```javascript
// Only import what you need
import { createClient } from '@supabase/supabase-js/dist/module/index';
import { PostgrestClient } from '@supabase/postgrest-js';
import { RealtimeClient } from '@supabase/realtime-js';
```

## Measurement Commands

```bash
# Analyze bundle size
npx expo export --platform ios --dump-sourcemap --dev false
npx expo export --platform android --dump-sourcemap --dev false

# Use source-map-explorer
npm install --save-dev source-map-explorer
npx source-map-explorer dist/bundles/ios-*.js dist/bundles/ios-*.map

# Check final app size
# iOS: Check .ipa file size
# Android: Check .aab/.apk file size
```

## Target Metrics

- **Initial JS Bundle**: < 2MB (currently likely ~3-4MB)
- **Total App Size**: 
  - iOS: < 40MB
  - Android: < 30MB
- **Time to Interactive**: < 3 seconds
- **Memory Usage**: < 150MB average

## Implementation Priority

1. **Immediate** (Do now):
   - ✅ Move @supabase/supabase-js to dependencies
   - Remove unused dependencies
   - Configure metro bundler

2. **Before Release**:
   - Lazy load heavy features (Sentry, Contacts)
   - Optimize images further
   - Enable ProGuard/R8 for Android

3. **Post-Launch**:
   - Implement code splitting by route
   - Further optimize based on user metrics
   - Consider moving to Hermes engine

## Testing After Optimization

1. Build production bundle:
   ```bash
   expo build:ios --release-channel production
   expo build:android --release-channel production
   ```

2. Test on real devices:
   - App launch time
   - Memory usage
   - Navigation performance
   - Image loading speed

3. Monitor with tools:
   - Flipper for performance profiling
   - React DevTools Profiler
   - Native profiling tools

## Red Flags to Avoid

- Don't remove dependencies without testing
- Don't over-optimize at cost of functionality
- Keep source maps for debugging
- Test on low-end devices
- Monitor crash rates after optimization