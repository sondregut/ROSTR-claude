import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
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
          image_uri: string;
          instagram_username: string;
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
          image_uri?: string;
          instagram_username?: string;
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
          image_uri?: string;
          instagram_username?: string;
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