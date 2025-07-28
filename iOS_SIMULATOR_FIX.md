# iOS Simulator 18.4 Network Bug Fix

## Issue
iOS Simulator 18.4 has a confirmed bug that causes network requests to fail in React Native/Expo apps. This affects Supabase and other HTTPS requests.

## Solutions

### Option 1: Download iOS 18.3 Simulator (Quickest Fix)

1. Open Xcode
2. Go to **Settings** (Cmd+,) → **Platforms** tab
3. Click the **+** button at the bottom
4. Select **iOS 18.3** from the list
5. Click **Download & Install**
6. Once downloaded, create a new simulator:
   - Open **Window** → **Devices and Simulators**
   - Click **Simulators** tab
   - Click **+** to create new simulator
   - Choose any iPhone model
   - Select **iOS 18.3** as the OS Version
   - Click **Create**

### Option 2: Update Xcode for iOS 18.5 (Recommended Long-term)

1. Open App Store
2. Search for Xcode updates
3. Update to latest version (should include iOS 18.5)
4. Follow steps above to create iOS 18.5 simulator

### Option 3: Use Physical Device

Connect your iPhone via USB and run:
```bash
npx expo run:ios --device
```

### Option 4: Temporary Development Workaround

While waiting for simulator fix, you can:

1. Use the Network Diagnostics button added to the signup screen
2. Test on Android simulator: `npx expo start --android`
3. Use web version: `npx expo start --web`

## Verify Fix

After creating new simulator:

1. Stop Expo: `Ctrl+C`
2. Clear cache: `npx expo start -c`
3. Select new simulator in Expo menu

## Current Status

- **Your Xcode**: 16.4
- **Your iOS Simulator**: 18.4 (buggy)
- **Recommended**: iOS 18.3 or 18.5

The network errors will disappear once you switch to a different iOS version!