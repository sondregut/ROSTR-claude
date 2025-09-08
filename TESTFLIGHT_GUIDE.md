# TestFlight Submission Guide for RostrDating

## Current Status
- **App Version:** 1.0.3
- **EAS Project ID:** bda19927-debe-46ff-a855-28e21348c0de
- **Account:** sondre-pv

## Step 1: Build for Production

First, let's create a production build for TestFlight:

```bash
# Build for iOS production (this will auto-increment build number)
eas build --platform ios --profile production
```

This will:
- Create a production `.ipa` file
- Auto-increment the build number (handled by EAS)
- Use production environment variables
- Apply all optimizations and minification
- Take about 15-30 minutes

## Step 2: Submit to TestFlight

Once the build is complete, submit it:

```bash
# Submit the latest iOS build to TestFlight
eas submit --platform ios --latest
```

Or if you want to specify a particular build:

```bash
# List recent builds
eas build:list --platform ios --limit 5

# Submit specific build
eas submit --platform ios --id=[build-id]
```

## Step 3: Configure in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app "RostrDating"
3. Go to "TestFlight" tab

### Internal Testing (Immediate)
- Add up to 100 internal testers (your team)
- No review required
- Available immediately after processing

### External Testing (Requires Review)
1. Click "+" next to "External Groups"
2. Create groups:
   - **"Friends & Family"** - Close friends for initial testing
   - **"Beta Testers"** - Wider audience
   - **"Friend Feature Testing"** - Specific feature testing

3. For each group, add:
   - Group name
   - Tester emails (up to 10,000 total)

## Step 4: Add Test Information

### What to Test (Template)

```
Welcome to RostrDating Beta!

Please test these KEY FEATURES:

FRIEND FEATURES:
✓ Send friend requests to other testers
✓ Accept/decline friend requests
✓ Check friend notifications
✓ View friends' rosters

SWIPE GESTURES:
✓ Swipe back from any screen (from left edge)
✓ Test on different screens
✓ Report if swipe doesn't work

NOTIFICATIONS:
✓ Enable push notifications when prompted
✓ Test receiving notifications
✓ Delete notifications (swipe or button)
✓ Check notification badges

PROFILE & ROSTER:
✓ Create your profile
✓ Add people to your roster
✓ Upload photos
✓ Add comments on dates

REPORT ISSUES:
- Screenshot any errors
- Note which iPhone model you're using
- Send feedback to: [your-email]

Test Account Credentials (if needed):
- Use your real phone number for signup
- Or use test account: [provide if needed]

Thank you for testing! 🎉
```

### Beta App Description
```
RostrDating is a social dating app where you can track and share your dating experiences with friends. Create your roster, see what your friends are up to, and get the inside scoop on potential matches.

This beta focuses on testing our friend system and gesture navigation.
```

## Step 5: Monitor & Iterate

### Check Build Status
```bash
# Check build status
eas build:list --platform ios --limit 3

# View build details
eas build:view [build-id]
```

### After Submission
1. **Processing Time**: 
   - Build processing: ~10-30 minutes
   - TestFlight review (external): 24-48 hours
   - Internal testing: Available immediately

2. **In App Store Connect**:
   - Monitor crash reports
   - Check feedback from testers
   - View installation stats

## Step 6: Quick Commands Reference

```bash
# Full build and submit in one line
eas build --platform ios --profile production --auto-submit

# Check submission status
eas submit:list --platform ios

# Create new build with message
eas build --platform ios --profile production --message "Fixed friend requests and swipe gestures"
```

## Testing Checklist

Before submitting, ensure:
- [ ] Friend request acceptance works (your recent fix)
- [ ] Notification deletion works (your recent fix)  
- [ ] Swipe gestures work (your recent fix)
- [ ] No console.log statements in production
- [ ] Environment variables are correct in eas.json
- [ ] App version is correct (1.0.3)

## Common Issues & Solutions

### "Missing Compliance" Error
- Go to App Store Connect > TestFlight
- Answer export compliance questions
- Usually select "No" unless using encryption

### Build Fails
```bash
# Clear cache and retry
eas build --clear-cache --platform ios --profile production
```

### Submission Fails
- Ensure you have Admin or App Manager role in App Store Connect
- Check that app bundle ID matches
- Verify certificates are valid

## Next Steps After TestFlight

1. Collect feedback for 1-2 weeks
2. Fix critical issues
3. Submit to App Store when ready:
```bash
eas submit --platform ios --latest --production
```

---

## Quick Start (Copy & Paste)

```bash
# 1. Build for TestFlight
eas build --platform ios --profile production --auto-submit

# 2. Monitor build (takes 15-30 min)
eas build:list --platform ios --limit 1

# 3. Once complete, it auto-submits to TestFlight
# 4. Go to App Store Connect to add testers
```

That's it! Your app will be on TestFlight! 🚀