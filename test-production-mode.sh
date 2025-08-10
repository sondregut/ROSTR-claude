#!/bin/bash

echo "🧪 Testing RostrDating in Production Mode"
echo "========================================"
echo ""
echo "This script will run the app in production mode to test the image loading fixes."
echo ""

# Set production environment variables
export EXPO_PUBLIC_ENV=production
export EXPO_PUBLIC_DEBUG_MODE=true  # Enable debug logging in production
export EXPO_PUBLIC_ANALYTICS_ENABLED=false
export EXPO_PUBLIC_ENABLE_TEST_USERS=false
export EXPO_PUBLIC_SHOW_DEV_MENU=false

echo "✅ Environment variables set:"
echo "   - EXPO_PUBLIC_ENV=production"
echo "   - EXPO_PUBLIC_DEBUG_MODE=true (for debugging)"
echo "   - EXPO_PUBLIC_ANALYTICS_ENABLED=false"
echo ""

echo "📱 Starting Expo in production mode..."
echo "   - Minification enabled"
echo "   - Dev mode disabled"
echo ""
echo "⚠️  Watch for:"
echo "   1. Console error recursion (should be fixed)"
echo "   2. Image loading errors with retry attempts"
echo "   3. Network diagnostics in logs"
echo "   4. Fallback UI for failed images"
echo ""

# Run Expo in production mode
npx expo start --no-dev --minify