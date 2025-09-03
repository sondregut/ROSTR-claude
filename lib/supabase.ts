import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseUrl, supabaseAnonKey, debugMode } from '@/config/env';
import logger from '@/utils/logger';

// Log configuration for debugging (only in debug mode)
if (debugMode) {
  logger.debug('🔧 Initializing Supabase client...');
  logger.debug('📍 URL:', supabaseUrl);
  logger.debug('🔑 Key:', supabaseAnonKey.substring(0, 20) + '...');
}


// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          username: string;
          bio: string;
          location: string;
          occupation: string;
          age: number;
          date_of_birth: string;
          image_uri: string;
          instagram_username: string;
          phone?: string;
          phone_verified?: boolean;
          allow_phone_discovery?: boolean;
          country_code?: string;
          total_dates: number;
          active_connections: number;
          avg_rating: number;
          interests: string[];
          dating_preferences: any;
          lifestyle_preferences: any;
          deal_breakers: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          username: string;
          bio?: string;
          location?: string;
          occupation?: string;
          age?: number;
          date_of_birth?: string;
          image_uri?: string;
          instagram_username?: string;
          phone?: string;
          phone_verified?: boolean;
          allow_phone_discovery?: boolean;
          country_code?: string;
          total_dates?: number;
          active_connections?: number;
          avg_rating?: number;
          interests?: string[];
          dating_preferences?: any;
          lifestyle_preferences?: any;
          deal_breakers?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          username?: string;
          bio?: string;
          location?: string;
          occupation?: string;
          age?: number;
          date_of_birth?: string;
          image_uri?: string;
          instagram_username?: string;
          phone?: string;
          phone_verified?: boolean;
          allow_phone_discovery?: boolean;
          country_code?: string;
          total_dates?: number;
          active_connections?: number;
          avg_rating?: number;
          interests?: string[];
          dating_preferences?: any;
          lifestyle_preferences?: any;
          deal_breakers?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      circles: {
        Row: {
          id: string;
          name: string;
          description: string;
          owner_id: string;
          is_active: boolean;
          member_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          owner_id: string;
          is_active?: boolean;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          owner_id?: string;
          is_active?: boolean;
          member_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      date_entries: {
        Row: {
          id: string;
          user_id: string;
          person_name: string;
          location: string;
          date: string;
          rating: number;
          notes: string;
          tags: string[];
          shared_circles: string[];
          is_private: boolean;
          image_uri: string;
          like_count: number;
          comment_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          person_name: string;
          location?: string;
          date: string;
          rating: number;
          notes: string;
          tags?: string[];
          shared_circles?: string[];
          is_private?: boolean;
          image_uri?: string;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          person_name?: string;
          location?: string;
          date?: string;
          rating?: number;
          notes?: string;
          tags?: string[];
          shared_circles?: string[];
          is_private?: boolean;
          image_uri?: string;
          like_count?: number;
          comment_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session?.user;
};

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Export the supabase client as default
export default supabase;