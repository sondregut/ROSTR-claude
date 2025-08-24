# App Store Submission Guide for RostrDating

## Prerequisites

### 1. Apple Developer Account
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Complete all agreements in App Store Connect
- [ ] Set up banking and tax information

### 2. App Requirements
- [ ] App is fully tested and bug-free
- [ ] All features work in production mode
- [ ] No crashes or major issues
- [ ] Performance is optimized

## Step-by-Step Submission Process

### Step 1: Prepare App Assets

#### App Icon
- [ ] 1024x1024px App Store icon (no transparency, no rounded corners)
- [ ] All required icon sizes in your app

#### Screenshots
Required for each device size you support:
- [ ] iPhone 6.7" (iPhone 15 Pro Max): 1290 × 2796
- [ ] iPhone 6.5" (iPhone 14 Plus): 1284 × 2778 or 1242 × 2688
- [ ] iPhone 5.5": 1242 × 2208 (if supporting older devices)
- [ ] iPad Pro 12.9": 2048 × 2732 (if iPad app)

**Screenshot Requirements:**
- Show your app's key features
- Include 2-10 screenshots per device size
- First 3 screenshots are most important
- No status bar required in screenshots

#### App Preview Video (Optional)
- 15-30 seconds
- Show app in action
- Same sizes as screenshots

### Step 2: App Information

#### Basic Information
```
App Name: RostrDating
Subtitle: Track Your Dating Journey
Primary Category: Lifestyle
Secondary Category: Social Networking
```

#### Age Rating
Answer questionnaire honestly about:
- User-generated content
- Social features
- Account creation requirements

#### Privacy Policy
Create a privacy policy covering:
- What data you collect
- How you use the data
- Data storage and security
- User rights
- Contact information

**Required URL format:**
```
https://rostrdating.com/privacy-policy
```

### Step 3: Build for Production

#### 1. Update app.json
```json
{
  "expo": {
    "name": "RostrDating",
    "slug": "rostrdating",
    "version": "1.0.0",
    "ios": {
      "buildNumber": "1",
      "bundleIdentifier": "com.yourcompany.rostrdating",
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "RostrDating needs access to your photos to upload profile pictures and date photos.",
        "NSCameraUsageDescription": "RostrDating needs camera access to take profile photos and capture date moments."
      }
    }
  }
}
```

#### 2. Create Production Build
```bash
# Install EAS CLI if not already installed
npm install -g eas-cli

# Login to Expo account
eas login

# Configure EAS
eas build:configure

# Create production build
eas build --platform ios --profile production
```

#### 3. Submit to App Store
```bash
# After build completes
eas submit -p ios
```

### Step 4: App Store Connect Setup

1. **Create New App**
   - Go to App Store Connect
   - Click "+" → "New App"
   - Select iOS platform
   - Enter app information

2. **Version Information**
   - What's New (version notes)
   - Promotional Text (170 chars)
   - Description (up to 4000 chars)
   - Keywords (100 chars, comma-separated)

3. **App Review Information**
   - Demo account credentials
   - Contact information
   - Notes for reviewer

### Step 5: Required Compliance

#### Content Rights
- [ ] Confirm you have rights to all content
- [ ] No copyrighted material without permission
- [ ] User-generated content guidelines

#### Export Compliance
- [ ] Uses encryption? (HTTPS counts as yes)
- [ ] If yes, may need to submit year-end self classification report

#### Data Collection
Declare what data you collect:
- [ ] Contact Info (Name)
- [ ] Photos
- [ ] User Content
- [ ] Usage Data
- [ ] Identifiers

### Step 6: Testing

#### TestFlight Beta Testing
1. Upload build to TestFlight
2. Add internal testers (up to 100)
3. Add external testers (up to 10,000)
4. Gather feedback and fix issues

### Step 7: Submit for Review

1. **Review Checklist**
   - [ ] All information filled out
   - [ ] Screenshots uploaded
   - [ ] Build selected
   - [ ] Pricing set (Free)
   - [ ] Availability selected (countries)

2. **Common Rejection Reasons to Avoid**
   - Crashes or bugs
   - Broken links
   - Placeholder content
   - Inappropriate content
   - Missing privacy policy
   - Unclear app purpose
   - Sign-in required without justification

3. **Submit**
   - Click "Submit for Review"
   - Review typically takes 24-48 hours
   - May take up to 7 days

### Step 8: Post-Submission

#### If Approved
- App goes live immediately or on scheduled date
- Monitor crash reports
- Respond to user reviews
- Plan updates

#### If Rejected
- Read rejection reason carefully
- Fix issues mentioned
- Respond to review team if clarification needed
- Resubmit

## Important Notes

### Dating App Specific Requirements
1. **User Safety**
   - Report/block functionality
   - Community guidelines
   - Age verification (18+)

2. **Privacy**
   - Clear data handling
   - Profile visibility controls
   - Data deletion options

3. **Content Moderation**
   - Plan for inappropriate content
   - User reporting system

### Production Environment Setup
```bash
# Switch to production environment
cp .env.production .env

# Ensure production APIs are configured
EXPO_PUBLIC_SUPABASE_URL=your-production-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-key
```

### Helpful Commands
```bash
# Check build status
eas build:list

# Download build
eas build:download

# Submit specific build
eas submit -p ios --id=<build-id>
```

## Timeline
- App Review: 24-48 hours typically
- First-time submission: May take longer
- Updates: Usually faster
- Expedited review available for critical issues

## Resources
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [App Store Connect Help](https://developer.apple.com/help/app-store-connect/)
- [Expo EAS Documentation](https://docs.expo.dev/build/introduction/)