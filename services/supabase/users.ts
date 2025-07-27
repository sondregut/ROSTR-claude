import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type UserProfile = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export class UserService {
  /**
   * Create a new user profile
   */
  static async createProfile(profileData: UserInsert): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Create profile error:', error);
      throw error;
    }
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: UserUpdate): Promise<UserProfile> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned, username is available
          return true;
        }
        throw error;
      }

      // Username exists
      return false;
    } catch (error) {
      console.error('Check username error:', error);
      return false;
    }
  }

  /**
   * Search users by name or username
   */
  static async searchUsers(query: string): Promise<UserProfile[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, username, image_uri')
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .limit(20);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Search users error:', error);
      return [];
    }
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId: string) {
    try {
      // This would typically be a complex query or view
      // For now, we'll get the basic stats from the user profile
      const profile = await this.getProfile(userId);
      
      if (!profile) {
        return null;
      }

      return {
        totalDates: profile.total_dates,
        activeConnections: profile.active_connections,
        avgRating: profile.avg_rating,
        circles: 0, // This would come from a circles count query
      };
    } catch (error) {
      console.error('Get user stats error:', error);
      return null;
    }
  }

  /**
   * Upload profile image
   */
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      // This is a placeholder - actual implementation would handle file upload
      // For now, we'll just update the image_uri field
      const { data, error } = await supabase
        .from('users')
        .update({ image_uri: imageUri })
        .eq('id', userId)
        .select('image_uri')
        .single();

      if (error) {
        throw error;
      }

      return data.image_uri;
    } catch (error) {
      console.error('Upload profile image error:', error);
      throw error;
    }
  }
}