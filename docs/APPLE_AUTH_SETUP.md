# Apple Authentication Setup Guide

## Overview
This guide explains how to configure Apple Sign In for your RostrDating app with Supabase.

## Prerequisites
- Apple Developer Account ($99/year)
- Supabase project
- Expo development build (Apple Sign In doesn't work in Expo Go)

## Step 1: Apple Developer Console Setup

### 1.1 Create App ID
1. Go to [Apple Developer Console](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles → Identifiers
3. Create a new App ID with:
   - Bundle ID: `com.yourcompany.rostrdating`
   - Enable "Sign In with Apple" capability

### 1.2 Create Service ID (for Web/Supabase)
1. Create a new Service ID
2. Identifier: `com.yourcompany.rostrdating.service`
3. Enable "Sign In with Apple"
4. Configure URLs:
   - Return URLs: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`
   - Domains: `YOUR_SUPABASE_PROJECT.supabase.co`

### 1.3 Create Private Key
1. Go to Keys section
2. Create a new key for "Sign In with Apple"
3. Download the `.p8` file (keep it secure!)
4. Note the Key ID

## Step 2: Supabase Configuration

### 2.1 Enable Apple Provider
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Apple
3. Fill in:
   - **Service ID**: `com.yourcompany.rostrdating.service`
   - **Team ID**: Found in Apple Developer account membership
   - **Key ID**: From the key you created
   - **Private Key**: Contents of the `.p8` file

### 2.2 Update Redirect URLs
1. Add authorized redirect URLs:
   - `com.yourcompany.rostrdating://`
   - `exp://YOUR_IP:PORT` (for development)

## Step 3: Expo Configuration

### 3.1 Update app.json
```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourcompany.rostrdating",
      "config": {
        "usesAppleSignIn": true
      }
    },
    "plugins": [
      "expo-apple-authentication"
    ]
  }
}
```

### 3.2 Build for iOS
```bash
# Create development build
eas build --platform ios --profile development

# Or for production
eas build --platform ios --profile production
```

## Step 4: Test the Implementation

### 4.1 Development Testing
1. Install the development build on your iOS device
2. Run `expo start --dev-client`
3. Test the Apple Sign In flow

### 4.2 Production Testing
1. Submit app to TestFlight
2. Test with real Apple IDs
3. Verify account linking works correctly

## Common Issues

### "Invalid client" error
- Verify Service ID matches in Supabase and Apple
- Check that return URLs are correctly configured

### "Sign in not available"
- Ensure you're testing on a real device (not simulator)
- Verify the device is signed in to iCloud
- Check that device supports Apple Sign In (iOS 13.0+)

### Supabase callback issues
- Ensure redirect URLs are whitelisted in Supabase
- Check that the bundle ID matches exactly

## Security Notes

1. **Never commit the `.p8` file** to version control
2. Store the private key securely in Supabase only
3. Rotate keys periodically
4. Monitor sign-in logs for suspicious activity

## Testing Checklist

- [ ] Apple Sign In button appears on iOS devices
- [ ] Clicking button shows Apple Sign In sheet
- [ ] Can sign in with Face ID/Touch ID
- [ ] Account is created/linked in Supabase
- [ ] User metadata (name, email) is saved
- [ ] Can sign out and sign back in
- [ ] Works on different iOS versions (13.0+)
- [ ] Handles cancellation gracefully
- [ ] Shows appropriate error messages

## Resources

- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Apple Auth Guide](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)