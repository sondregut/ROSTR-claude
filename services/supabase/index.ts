/**
 * Centralized export for all Supabase services
 * This makes it easy to import services throughout the app
 */

export { AuthService } from './auth';
export { UserService } from './users';

// Re-export the main supabase client and types
export { supabase, type Database } from '@/lib/supabase';

// Export common utilities
export * from '@/lib/supabase';