# Production Testing Guide for RostrDating

## Pre-Production Checklist

### Environment Setup
- [ ] Production Supabase project configured
- [ ] Environment variables updated in .env.production
- [ ] Bundle optimizations applied
- [ ] Privacy Policy and Terms of Service URLs live
- [ ] App Store assets prepared

## Real-Time Features Testing

### 1. Feed Real-Time Updates
**Test Scenario**: Two users viewing the same feed

**Steps**:
1. Sign in as User A on Device 1
2. Sign in as User B on Device 2 (friend of User A)
3. User A creates a new date entry
4. Verify User B sees "New posts" indicator within 2 seconds
5. User B taps indicator - feed updates without full refresh

**Expected Results**:
- Real-time indicator appears quickly
- Feed updates smoothly
- No duplicate posts
- Scroll position maintained

### 2. Comment Real-Time Updates
**Test Scenario**: Live commenting without feed disruption

**Steps**:
1. Both users viewing same post
2. User A adds comment
3. Verify User B sees comment appear
4. User B adds comment
5. Verify neither user's feed scrolls to top

**Expected Results**:
- Comments appear in real-time
- Comment count updates
- No feed refresh/scroll
- Optimistic updates work

### 3. Circle Chat Real-Time
**Test Scenario**: Real-time messaging in circles

**Steps**:
1. Create test circle with 3+ members
2. All members open circle chat
3. Send messages from different users
4. Test typing indicators
5. Test message ordering

**Expected Results**:
- Messages appear instantly (<500ms)
- No duplicate messages
- Typing indicators work
- Messages stay in order
- Auto-scroll to new messages

### 4. Reactions & Likes
**Test Scenario**: Real-time engagement updates

**Steps**:
1. Multiple users viewing same posts
2. User adds reaction/like
3. Other users see update
4. Remove reaction
5. Verify update propagates

**Expected Results**:
- Like counts update instantly
- Reaction emojis appear/disappear
- No feed refresh
- Counts stay accurate

## Performance Testing

### 1. App Launch Time
- Cold start: < 3 seconds
- Warm start: < 1 second
- Time to interactive: < 2 seconds

### 2. Memory Usage
- Initial load: < 100MB
- After 10 min use: < 150MB
- After viewing 50+ images: < 200MB
- No memory leaks

### 3. Network Performance
- API calls complete < 1 second
- Images load progressively
- Offline handling graceful
- No failed requests in normal use

### 4. Bundle Size Verification
```bash
# Check production bundle size
npx expo export --platform ios --dump-sourcemap --dev false
npx expo export --platform android --dump-sourcemap --dev false

# Target sizes:
# iOS .ipa: < 40MB
# Android .aab: < 30MB
```

## Cross-Platform Testing

### iOS Testing (iPhone & iPad)
- [ ] All features work on iOS 15+
- [ ] Keyboard handling correct
- [ ] Safe area respected
- [ ] Haptics work properly
- [ ] Push notifications work

### Android Testing
- [ ] All features work on Android 10+
- [ ] Back button handling correct
- [ ] Status bar styling correct
- [ ] Permissions requests work
- [ ] App doesn't crash on older devices

## Edge Cases & Error Handling

### 1. Network Interruptions
- Start action with good connection
- Disable network mid-action
- Verify graceful failure
- Re-enable network
- Verify recovery

### 2. Concurrent Updates
- Two users edit same data
- Verify last-write-wins
- No data corruption
- UI stays consistent

### 3. Large Data Sets
- User with 100+ dates
- User with 50+ roster entries
- Circle with 20+ members
- Feed with 100+ posts
- All should perform well

### 4. Authentication Edge Cases
- Token expiry handling
- Session timeout
- Multiple device sign-in
- Sign out clears all data

## Security Testing

### 1. Data Privacy
- [ ] Private posts not visible to non-circle members
- [ ] Deleted content actually deleted
- [ ] No data leaks in API responses
- [ ] Image URLs require authentication

### 2. Input Validation
- [ ] XSS attempts blocked
- [ ] SQL injection impossible
- [ ] File upload size limits enforced
- [ ] Rate limiting works

## Stress Testing

### Load Testing Scenarios
1. **Heavy Image Usage**
   - Upload 50 photos rapidly
   - View feed with 100+ images
   - Memory should stay stable

2. **Rapid Navigation**
   - Switch tabs quickly 20 times
   - Open/close modals rapidly
   - No crashes or freezes

3. **Background/Foreground**
   - Use app for 5 minutes
   - Background for 10 minutes
   - Return to app
   - State preserved correctly

## Production Monitoring Setup

### 1. Error Tracking (Sentry)
- [ ] Sentry configured for production
- [ ] Source maps uploaded
- [ ] Error alerts configured
- [ ] Performance monitoring enabled

### 2. Analytics
- [ ] User flows tracked
- [ ] Performance metrics captured
- [ ] Crash-free rate > 99.5%
- [ ] Daily active users tracked

### 3. Supabase Monitoring
- [ ] Database performance alerts
- [ ] API rate limit monitoring
- [ ] Storage usage tracking
- [ ] Real-time connection monitoring

## Final Production Checklist

### Before App Store Submission
- [ ] All tests pass on physical devices
- [ ] No console.log statements in production
- [ ] API endpoints point to production
- [ ] Bundle size optimized
- [ ] All assets high quality
- [ ] Version number updated
- [ ] Release notes prepared

### Post-Launch Monitoring (First 48 Hours)
- [ ] Monitor crash reports
- [ ] Check user feedback
- [ ] Verify analytics working
- [ ] Monitor API performance
- [ ] Check real-time stability
- [ ] Review early user reviews

## Rollback Plan

If critical issues found:
1. Prepare hotfix branch
2. Test fix thoroughly
3. Submit expedited review if needed
4. Communicate with users
5. Monitor fix deployment

## Test User Accounts

Create these test accounts for App Store review:
1. **Demo User 1**: demo1@rostr-test.com
2. **Demo User 2**: demo2@rostr-test.com
3. **Demo Circle**: "App Reviewers"

Ensure test accounts have:
- Populated roster (5+ people)
- Recent dates (10+ entries)
- Active circles with messages
- Various content types