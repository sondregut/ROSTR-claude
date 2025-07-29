/**
 * Centralized export for all Supabase services
 * This makes it easy to import services throughout the app
 */

export { AuthService } from './auth';
export { UserService } from './users';
export { StorageService } from './storage';
export { ChatService } from './chat';
export { CircleChatService } from './circleChat';
export { MatchingService } from './matching';
export { CircleService } from './circles';
export { DateService } from './dates';

// Re-export the main supabase client and types
export { supabase, type Database } from '@/lib/supabase';

// Export common utilities
export * from '@/lib/supabase';