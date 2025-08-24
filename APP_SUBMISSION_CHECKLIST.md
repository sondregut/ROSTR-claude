# App Store Submission Checklist

## Before You Start
- [ ] Apple Developer Account ($99/year)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Production Supabase instance ready

## Required Assets

### App Icon
- [ ] 1024x1024px icon (PNG, no transparency)

### Screenshots (2-10 per size)
- [ ] iPhone 6.7" (1290 × 2796)
- [ ] iPhone 6.5" (1284 × 2778)

### App Information
- [ ] App Name: "RostrDating"
- [ ] Subtitle (30 chars) - "Track & organize your dating life" (NO competitor names!)
- [ ] Keywords (100 chars)
- [ ] Description (4000 chars)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)

### Legal
- [ ] Privacy Policy written and hosted
- [ ] Terms of Service
- [ ] Age rating questionnaire completed

## Build Process

### 1. Update Configuration
```bash
# Update app.json with production values
# - version: "1.0.0"
# - buildNumber: "1"
# - bundleIdentifier: "com.yourcompany.rostrdating"
```

### 2. Create Production Build
```bash
# Login to Expo
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile production
```

### 3. Submit to App Store
```bash
# After build completes
eas submit -p ios
```

## Testing
- [ ] Test all features in production mode
- [ ] Test with production API
- [ ] Test on real device
- [ ] No crashes or errors
- [ ] Photos upload and display correctly

## App Store Connect
- [ ] Create app in App Store Connect
- [ ] Upload screenshots
- [ ] Fill in all metadata
- [ ] Set up TestFlight (optional)
- [ ] Add demo account for reviewers

## Review Preparation
- [ ] Demo account credentials provided (demo@rostrdating.com / DemoUser2024!)
- [ ] Review notes explain any complex features
- [ ] All external links work
- [ ] No placeholder content
- [ ] No test data visible
- [ ] Account deletion feature implemented (Settings > Account Management)

## Common Issues to Fix
- [ ] Remove all console.log statements
- [ ] Ensure proper error handling
- [ ] Add loading states
- [ ] Handle offline scenarios
- [ ] Implement proper permissions requests

## Final Steps
- [ ] Select build in App Store Connect
- [ ] Review all information
- [ ] Submit for review
- [ ] Monitor email for updates

## Post-Submission
- [ ] Be ready to respond to reviewer feedback
- [ ] Have fixes ready for common issues
- [ ] Plan for next update

Remember: First submission usually takes longer (2-7 days)