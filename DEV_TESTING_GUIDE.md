# Development Testing Guide

## Testing Authentication

### Email Sign In (Works Everywhere)
1. Click "Continue with Email"
2. Sign up with any email address
3. Use a simple password for testing

### Apple Sign In
- **Simulator**: Will show error - this is normal
- **Physical Device**: Works with development build
- **TestFlight**: Will work perfectly

## Quick Test Account
For quick testing, use:
- Email: test@example.com
- Password: Test123!

## Common Issues

### "Apple Sign In Failed"
This is expected on simulator. Use email sign in instead.

### "Network Error"
Check that your `.env` file has the correct Supabase URL and key.

## Building for TestFlight
When ready for TestFlight:
```bash
eas build --platform ios --profile production
```

Apple Sign In will work correctly in TestFlight builds.