# RostrDating Publishing Checklist

## ✅ Completed
- [x] User authentication (email and phone)
- [x] Profile setup flow
- [x] Database schema fixes

## 🔄 Current: App Icons & Splash Screens

### Current Status:
- ✅ icon.png (1024x1024) - Exists
- ✅ splash-icon.png (1024x1024) - Exists  
- ✅ adaptive-icon.png (1024x1024) - Exists

### TODO:
1. **Replace default icons with RostrDating branding**
   - Design/get app icon (1024x1024 PNG, no transparency)
   - Design splash screen icon
   - Update adaptive icon for Android

2. **Configure splash screen in app.json**
   - Background color
   - Resize mode
   - Duration

## 📱 Next Steps (In Order):

### 1. App Store Metadata
- [ ] App name (already set: RostrDating)
- [ ] App description (short & long)
- [ ] Keywords for ASO
- [ ] App category (Social/Dating)
- [ ] Screenshots (5.5", 6.5", 12.9" iPad)
- [ ] App preview video (optional)
- [ ] Age rating (17+ for dating apps)

### 2. Production Environment
- [ ] Create production Supabase project
- [ ] Set production environment variables
- [ ] Enable Row Level Security (RLS)
- [ ] Set up production database backups

### 3. Legal Requirements  
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] GDPR compliance
- [ ] Data deletion policy

### 4. iOS App Store Setup
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect setup
- [ ] Bundle identifier: com.sondregut.rostrdating
- [ ] Provisioning profiles
- [ ] Push notification certificates

### 5. Production Build
- [ ] EAS Build setup
- [ ] Production signing
- [ ] Build for TestFlight
- [ ] Internal testing

### 6. Final Testing
- [ ] Test on multiple devices
- [ ] Performance testing
- [ ] Crash reporting setup
- [ ] Analytics setup

### 7. Submission
- [ ] Submit to TestFlight
- [ ] Beta testing feedback
- [ ] Submit for App Store review
- [ ] Monitor review status

## 🚀 Quick Commands

```bash
# Build for iOS production
eas build --platform ios --profile production

# Submit to App Store
eas submit -p ios

# Build for Android production  
eas build --platform android --profile production

# Submit to Google Play
eas submit -p android
```

## 📝 Notes
- iOS review typically takes 24-48 hours
- Dating apps require 17+ age rating
- Need to demonstrate moderation/safety features
- Phone auth may require additional review