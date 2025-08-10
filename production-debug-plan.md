# Production Build Debugging Plan

## Problem
The app works fine in development builds but has issues in production builds.

## Common Causes Identified

### 1. Code Minification & Optimization
- Aggressive minification settings in metro.config.js
- Function name mangling and variable reduction
- Code transformations that might break certain patterns

### 2. Environment Variable Differences
- `EXPO_PUBLIC_DEBUG_MODE=false` in production
- `EXPO_PUBLIC_ANALYTICS_ENABLED=true` in production
- `EXPO_PUBLIC_ENABLE_TEST_USERS=false` in production
- `EXPO_PUBLIC_SHOW_DEV_MENU=false` in production

### 3. Console Logging Disabled
- logger.ts only logs in development (__DEV__)
- Errors might be happening but not visible
- Debugging information is suppressed

### 4. React Native Optimizations
- Production builds use release mode optimizations
- Different memory management
- More aggressive garbage collection
- Stricter timing constraints

### 5. Build Properties (Android)
- `enableProguardInReleaseBuilds: true` - Code obfuscation
- `enableShrinkResourcesInReleaseBuilds: true` - Resource removal

### 6. Watchdog Timeout Issues
- References to watchdog timeouts (0x8badf00d) in code
- Production builds have stricter app launch time limits
- Modal animations were removed to fix these issues

## Action Plan

### Step 1: Enable Production Debugging ✅ [COMPLETED]
- [x] Temporarily enable console logging in production by modifying logger.ts
  - Enhanced logger with production debug mode support
  - Added error reporting functionality
  - Stores recent logs for debugging
  - Always logs errors even in production
- [x] Add error boundary components to catch and report runtime errors
  - Enhanced existing ErrorBoundary to use new logger
  - Shows recent logs in error UI when in debug mode
  - Reports errors with full context
- [x] Enable global error handlers in _layout.tsx
  - Catches unhandled promise rejections
  - Intercepts console.error calls
  - Handles global React Native errors
  - All errors are logged even in production

### Step 2: Test Production Build Locally
- [ ] Run `expo start --no-dev --minify` to test production mode locally
- [ ] Use `eas build --platform ios --profile preview` for testing builds
- [ ] Monitor console for any errors or warnings

### Step 3: Address Common Issues ✅ [COMPLETED]
- [x] Check for code that relies on `__DEV__` flag
  - Found usage in networkConfig.js - SSL/certificate validation only in dev mode
  - devSkipAuth function in AuthContext only works in dev (not called in production)
  - Logger already enhanced to work in production debug mode
- [x] Ensure all async operations have proper error handling
  - All Supabase operations already have proper try-catch blocks
  - photoUpload.ts has comprehensive error handling with timeouts
  - AuthContext has proper error handling for all auth operations
  - UserService has proper error handling for all database operations
- [x] Add try-catch blocks around Supabase operations
  - Already implemented across all services
- [x] Verify all environment variables are properly set
  - Environment variables are hardcoded in app.config.js
  - Proper fallback mechanism in config/env.ts
  - Non-throwing verification in verifyEnv.ts

### Step 4: Optimize App Startup
- [ ] Defer heavy operations until after app launch
- [ ] Use lazy loading for non-critical components
- [ ] Implement proper loading states

### Step 5: Review Minification Settings
- [ ] Consider less aggressive minification in metro.config.js
- [ ] Test with `reduce_funcs: true` and `reduce_vars: true`
- [ ] Ensure critical function names aren't being mangled

### Step 6: Add Production Monitoring
- [ ] Implement crash reporting with proper error boundaries
- [ ] Add performance monitoring for slow operations
- [ ] Log critical errors even in production mode

## Key Findings

### Potential Production Issues Identified

1. **Network Configuration (networkConfig.js)** ✅ [FIXED]
   - SSL certificate validation is disabled only in dev mode
   - In production, strict SSL validation could cause connection issues
   - CORS mode and credentials are only set in development
   - **FIX APPLIED:**
     - Enabled SSL retry logic in production (was dev-only)
     - Always set CORS mode and credentials for fetch operations
     - Added `withSSLRetry` wrapper for network operations
     - Network errors will now retry 3 times with exponential backoff

2. **Profile Image Loading Errors** ✅ [FIXED]
   - Console error recursion causing infinite loop when images fail
   - No retry logic for failed image loads
   - Poor error visibility and diagnostics
   - **FIX APPLIED:**
     - Fixed console.error recursion in _layout.tsx with guard flag
     - Enhanced OptimizedImage component with retry logic (3 attempts)
     - Added network diagnostics for failed image loads
     - Implemented fallback UI for failed images
     - Created imageLoader.ts utility for Supabase image handling
     - Added prefetch capability with SSL retry

3. **Temporary Image File Issues** ✅ [FIXED]
   - Image picker creates temporary files that get deleted
   - App tries to load these files causing retry loops
   - **FIX APPLIED:**
     - Added detection for temporary file paths
     - Skip retry attempts for temp files that no longer exist
     - Prevent unnecessary network diagnostics for local files
     - Log warning instead of error for expected temp file issues

4. **All Critical Components Have Error Handling**
   - photoUpload.ts: Comprehensive error handling with timeouts
   - AuthContext: Proper try-catch blocks for all auth operations
   - UserService: Error handling for all database operations
   - Environment variables: Hardcoded fallbacks prevent missing config issues

3. **Production-Safe Features**
   - Logger enhanced to work in production debug mode
   - Error boundaries capture and report all errors
   - Environment verification doesn't throw, only logs warnings
   - Global error handlers catch unhandled rejections

### Recommended Next Steps

1. **Test with Production Build**
   - Use `npx expo run:ios --configuration Release` for local production testing
   - Or create a preview build with `eas build --platform ios --profile preview`
   - Enable EXPO_PUBLIC_DEBUG_MODE=true temporarily for production debugging

2. **Monitor Network Issues**
   - SSL/certificate errors may occur in production
   - Watch for connection timeouts or refused connections
   - Check if Supabase URL is accessible from production environment

3. **Performance Monitoring**
   - App startup time (watchdog timeout prevention)
   - Heavy operations during launch
   - Memory usage patterns

## Notes
- Recent commits show fixes for watchdog timeout crashes and modal animations
- The app uses Supabase for backend services
- Environment configuration is handled through expo-constants and app.config.js
- All critical paths have proper error handling implemented