# Secrets Management Guide

## Overview
This guide explains how to properly manage secrets and environment variables in the RostrDating app.

## Environment Files

### `.env` (Local Development)
- **NEVER** commit this file to version control
- Contains your actual API keys and secrets
- Copy from `.env.example` and fill in your values
- Already in `.gitignore`

### `.env.example` (Template)
- Safe to commit
- Contains placeholder values
- Used as a template for new developers
- Documents all required environment variables

### `.env.development` / `.env.production`
- Safe to commit
- Contains environment-specific settings (no secrets)
- Feature flags and configuration options

## Required Environment Variables

### Supabase Configuration
```bash
# Required for all environments
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Only for server-side scripts (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional Services
```bash
# Error tracking
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Analytics (future)
EXPO_PUBLIC_ANALYTICS_KEY=your-analytics-key
```

## Security Best Practices

### 1. Never Commit Secrets
- Always check `git status` before committing
- Use `git add -p` to review changes
- If you accidentally commit secrets:
  1. Remove the file/changes
  2. Commit the removal
  3. Rotate the exposed keys immediately

### 2. Use Different Keys for Each Environment
- Development: Use a separate Supabase project
- Staging: Use a staging Supabase project
- Production: Use production keys only in CI/CD

### 3. Service Role Key Security
- **NEVER** use service role key in client code
- Only use in:
  - Database migration scripts
  - Server-side admin tools
  - CI/CD pipelines
- Store securely in:
  - GitHub Secrets (for Actions)
  - EAS Secrets (for builds)

### 4. Key Rotation
- Rotate keys regularly (every 3-6 months)
- Rotate immediately if exposed
- Update all environments when rotating

## EAS Build Configuration

### Setting Secrets for EAS Build
```bash
# Set secrets for production builds
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key"

# List all secrets
eas secret:list

# Delete a secret
eas secret:delete --scope project --name SECRET_NAME
```

### Using Secrets in eas.json
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_ENV": "production",
        "EXPO_PUBLIC_ANALYTICS_ENABLED": "true"
      }
    }
  }
}
```

## GitHub Actions Configuration

### Setting Secrets in GitHub
1. Go to Settings → Secrets → Actions
2. Add these secrets:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for migrations)

### Using in Workflows
```yaml
env:
  EXPO_PUBLIC_SUPABASE_URL: ${{ secrets.EXPO_PUBLIC_SUPABASE_URL }}
  EXPO_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.EXPO_PUBLIC_SUPABASE_ANON_KEY }}
```

## Local Development Setup

### First Time Setup
```bash
# 1. Copy the example file
cp .env.example .env

# 2. Edit .env with your values
# Get these from Supabase Dashboard → Settings → API

# 3. Verify configuration
npm run verify-env
```

### Troubleshooting
- **Missing environment variable error**: Check `.env` exists and has all required values
- **Invalid Supabase URL**: Ensure URL includes `https://` and ends with `.supabase.co`
- **Authentication errors**: Verify anon key is correct and not the service role key

## Production Deployment Checklist

- [ ] All secrets stored in EAS Secrets
- [ ] Production Supabase project created
- [ ] Row Level Security enabled and tested
- [ ] Service role key NOT exposed to client
- [ ] Environment validation passing
- [ ] Sentry DSN configured (optional)
- [ ] Analytics enabled (optional)

## Emergency Response

### If Secrets Are Exposed:
1. **Immediately** rotate the exposed keys in Supabase Dashboard
2. Update all environments with new keys
3. Check logs for any unauthorized access
4. Notify the team
5. Conduct security audit

### Supabase Key Rotation:
1. Go to Supabase Dashboard → Settings → API
2. Click "Regenerate anon key" or "Regenerate service role key"
3. Update all environments:
   - Local `.env` files
   - EAS Secrets
   - GitHub Secrets
   - Any CI/CD pipelines
4. Deploy new builds with updated keys

## Additional Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Expo EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)
- [GitHub Encrypted Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)