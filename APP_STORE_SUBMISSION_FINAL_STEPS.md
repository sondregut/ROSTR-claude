# App Store Submission - Final Steps

## ✅ Completed in Code

1. **Account Deletion Feature** - READY
   - Delete function created in Supabase
   - UI button added in Settings > Account Management
   - Two-step confirmation process

2. **Demo Mode Setup** - READY
   - Demo data service created
   - Functions prepared in Supabase

## 🔧 Required Actions

### 1. Create Demo User in Supabase Dashboard

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/iiyoasqgwpbuijuagfmz/auth/users)
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `demo@rostrdating.com`
   - Password: `DemoUser2024!`
4. Click "Create user"

### 2. Populate Demo Data

After creating the demo user, run this SQL in Supabase SQL Editor:

```sql
-- Populate demo data
SELECT public.setup_demo_user_data();

-- Verify everything is set up
SELECT * FROM public.verify_demo_setup();
```

### 3. Test Account Deletion

1. Sign in to the app with a test account
2. Go to Settings > Account Management
3. Tap "Delete Account" 
4. Confirm twice to delete

### 4. Build & Submit

```bash
# Build production version with auto-submit
eas build --platform ios --profile production --auto-submit
```

### 5. Update App Store Connect

1. **Fix Screenshots**:
   - Use real iPad screenshots (not stretched)
   - Show populated demo data

2. **Update App Information**:
   - Subtitle: "Track & organize your dating life" (NO competitor names!)
   - Remove any "Strava" references

3. **Add Review Notes**:
   ```
   Demo Account for Testing:
   Email: demo@rostrdating.com
   Password: DemoUser2024!
   
   This account is pre-populated with sample data to showcase all features.
   
   Account Deletion:
   Settings > Account Management > Delete Account
   (Two-step confirmation, permanently deletes all user data)
   ```

## Verification Checklist

- [ ] Demo user created in Supabase
- [ ] Demo data populated (run setup_demo_user_data())
- [ ] Account deletion tested
- [ ] Screenshots updated (real iPad)
- [ ] Subtitle updated (no competitor names)
- [ ] Review notes added with demo credentials
- [ ] Build submitted to App Store

## SQL Functions Created

1. `delete_user_account(user_id)` - Handles account deletion
2. `setup_demo_user_data()` - Populates demo data
3. `verify_demo_setup()` - Verifies setup status

## Support

If reviewers have issues:
- Email: support@rostrdating.com
- Response time: Within 24 hours