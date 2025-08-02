#!/bin/bash

echo "🚀 Building RostrDating for production..."

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Login to EAS (if not already logged in)
echo "📱 Checking EAS login status..."
eas whoami || eas login

# Clear cache
echo "🧹 Clearing cache..."
npx expo start --clear --no-dev &
sleep 5
kill $!

# Build for iOS (App Store)
echo "📱 Building for iOS..."
eas build --platform ios --profile production

echo "✅ Build submitted! Check your EAS dashboard for build status."
echo "📋 Next steps:"
echo "1. Wait for build to complete"
echo "2. Download the .ipa file"
echo "3. Upload to App Store Connect using Transporter"