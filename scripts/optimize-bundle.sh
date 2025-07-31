#!/bin/bash

echo "🚀 Starting bundle optimization..."

# Unused dependencies to remove
echo "📦 Removing unused dependencies..."
npm uninstall react-native-otp-textinput react-native-otp-verify

# Dependencies we're keeping:
# - react-native-reactions (used in DateCard, PlanCard, RosterCard)
# - expo-sms (used in ContactService and invite-friends)
# - react-native-image-crop-picker (used as fallback in photoUpload.ts)

# Install expo-build-properties for additional optimizations
echo "📦 Installing build optimization tools..."
npm install --save-dev expo-build-properties

# Clear caches
echo "🧹 Clearing caches..."
rm -rf node_modules/.cache
npx expo start -c

echo "✅ Bundle optimization complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npm install' to ensure dependencies are updated"
echo "2. Test the app thoroughly"
echo "3. Build production bundle to measure size reduction"
echo ""
echo "To measure bundle size:"
echo "npx expo export --platform ios --dump-sourcemap --dev false"
echo "npx expo export --platform android --dump-sourcemap --dev false"