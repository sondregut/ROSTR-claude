# RostrDating Troubleshooting Guide

## Network Request Failed Error (SMS OTP)

If you're experiencing "Network request failed" errors when trying to send SMS OTP, follow these steps:

### Quick Fixes

1. **Restart Metro Bundler**
   ```bash
   npx expo start -c
   ```
   The `-c` flag clears the cache which often resolves network issues.

2. **Check Internet Connection**
   - Ensure your device has a stable internet connection
   - Try accessing https://www.google.com in your browser
   - Disable VPN if you're using one

3. **Use Network Diagnostics**
   - In the phone auth screen, tap "Network Diagnostics"
   - Run "Quick Network Test" to check connectivity
   - Run "Full Debug" for detailed diagnostics

### Common Causes and Solutions

#### 1. Phone Auth Not Configured in Supabase

**Symptoms:**
- Network request fails immediately
- Error mentions "Phone provider is not configured"

**Solution:**
1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Authentication > Providers
3. Enable "Phone" provider
4. Configure SMS provider:
   - **Twilio** (recommended for production)
   - **MessageBird**
   - **TextLocal**
   - **Vonage**

**Twilio Setup Example:**
```
1. Create a Twilio account (free trial available)
2. Get your Account SID and Auth Token
3. In Supabase: Authentication > Providers > Phone
4. Add Twilio credentials
5. Configure phone number format and messaging service
```

#### 2. iOS Network Configuration Issues

**Symptoms:**
- Works on Android but not iOS
- Network requests fail with no clear error

**Solution:**
The app includes a custom Expo plugin that configures iOS network settings. If issues persist:

1. Clear all caches:
   ```bash
   npx expo start -c
   rm -rf node_modules
   npm install
   ```

2. For Expo Go users:
   - The custom plugin only works in development builds
   - Consider using email authentication as a fallback

#### 3. Development Environment Issues

**Symptoms:**
- Works in production but not locally
- Intermittent failures

**Solutions:**
1. Check Supabase URL in `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Ensure environment variables are loaded:
   ```bash
   # Restart Metro after changing .env
   npx expo start -c
   ```

3. Check if Supabase project is paused (free tier):
   - Go to Supabase Dashboard
   - Check project status
   - Unpause if necessary

### Alternative Authentication Methods

If SMS authentication continues to fail:

1. **Use Email Authentication**
   - The app automatically suggests email auth when SMS fails
   - Click "Use Email" in the error dialog

2. **Implement Magic Link Authentication**
   - No SMS provider required
   - Works via email
   - Better for testing

### Debugging Commands

```bash
# Check if environment variables are set
npx expo env:info

# Clear all caches
npx expo start -c

# Run with verbose logging
DEBUG=* npx expo start

# Test Supabase connection directly
curl -I https://your-project.supabase.co/rest/v1/
```

### Network Helper Features

The app includes automatic retry logic:
- 3 retry attempts with exponential backoff
- Custom fetch wrapper with better error handling
- Network connectivity checks

### For Developers

To disable retry logic during development:
```typescript
// In services/supabase/auth.ts
const maxRetries = 1; // Change from 3 to 1
```

To add more detailed logging:
```typescript
// In utils/networkHelper.ts
console.log('Network request details:', {
  url,
  headers,
  method,
  // Add more details as needed
});
```

## Other Common Issues

### "Too many requests" Error
- Wait 60 seconds before trying again
- Supabase has rate limits on SMS sending
- Consider implementing a cooldown timer in UI

### Invalid Phone Number Format
- Ensure phone number includes country code
- Format: +1234567890 (no spaces or special characters)
- The app automatically cleans phone numbers

### Session Persistence Issues
- The app uses AsyncStorage for session persistence
- Clear app data if session is corrupted
- Check AsyncStorage permissions

## Need More Help?

1. Check Supabase logs: Dashboard > Logs > Auth
2. Enable debug mode in Supabase client (already enabled in development)
3. File an issue with:
   - Error message
   - Network diagnostic results
   - Platform (iOS/Android)
   - Expo SDK version