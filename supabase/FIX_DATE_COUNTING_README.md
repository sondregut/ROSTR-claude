# Fix Date Counting

## Problem
The date counter was incorrectly counting roster additions and planned dates as actual dates. Only logged dates with ratings should be counted in the user's total dates statistic.

## Solution
The `fix_date_counting.sql` file creates:

1. **`calculate_user_date_count(user_id)`** - Function that counts only actual dates (excluding roster additions and plans)
2. **`update_user_stats(user_id)`** - Function that updates all user statistics including:
   - `total_dates` - Count of actual logged dates only
   - `avg_rating` - Average rating from actual dates
   - `active_connections` - Count of active roster entries
3. **Triggers** - Automatically update stats when:
   - Date entries are added/updated/deleted
   - Roster entries are added/updated/deleted

## How to Apply

1. Run the SQL file in your Supabase SQL editor:
   ```sql
   -- Copy and paste the contents of fix_date_counting.sql
   ```

2. The migration will:
   - Create the necessary functions
   - Set up automatic triggers
   - Recalculate stats for all existing users

## What Changes

- **Before**: Total dates included roster additions and planned dates
- **After**: Total dates only counts actual logged dates with ratings > 0

## Verification

After running the migration, you can verify a user's stats:

```sql
-- Check a specific user's actual date count
SELECT calculate_user_date_count('user-id-here');

-- Manually recalculate a user's stats
SELECT update_user_stats('user-id-here');

-- View updated stats
SELECT id, name, total_dates, avg_rating, active_connections 
FROM users 
WHERE id = 'user-id-here';
```

## App Changes

The app will automatically recalculate stats when:
- User profile is loaded (ensures accuracy)
- New dates are logged
- Roster entries are modified

This ensures the date count always reflects only actual logged dates.