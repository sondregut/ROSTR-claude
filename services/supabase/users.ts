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
   * Upload profile image and update user record
   */
  static async uploadProfileImage(userId: string, imageUri: string): Promise<string> {
    try {
      // Import storage service dynamically to avoid circular imports
      const { StorageService } = await import('./storage');
      
      // Validate file size (max 5MB)
      const isValidSize = await StorageService.validateFileSize(imageUri, 5);
      if (!isValidSize) {
        throw new Error('Image file too large. Maximum size is 5MB.');
      }

      // Validate file type
      const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
      const isValidType = StorageService.validateFileType(imageUri, allowedTypes);
      if (!isValidType) {
        throw new Error('Invalid file type. Allowed types: JPG, PNG, WebP');
      }

      // Upload image to storage
      const uploadResult = await StorageService.uploadUserPhoto(imageUri, userId);

      // Update user record with new image URL
      const { data, error } = await supabase
        .from('users')
        .update({ 
          image_uri: uploadResult.url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('image_uri')
        .single();

      if (error) {
        // If database update fails, clean up uploaded file
        try {
          await StorageService.deleteFile('user-photos', uploadResult.path);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file:', cleanupError);
        }
        throw error;
      }

      // Clean up old photos (keep only 5 most recent)
      await StorageService.cleanupOldUserPhotos(userId, 5);

      return data.image_uri;
    } catch (error) {
      console.error('Upload profile image error:', error);
      throw error;
    }
  }

  /**
   * Add multiple photos to user profile
   */
  static async addUserPhotos(userId: string, imageUris: string[]): Promise<string[]> {
    try {
      const { StorageService } = await import('./storage');
      
      // Validate all images
      for (const uri of imageUris) {
        const isValidSize = await StorageService.validateFileSize(uri, 5);
        if (!isValidSize) {
          throw new Error('One or more images are too large. Maximum size is 5MB each.');
        }

        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        const isValidType = StorageService.validateFileType(uri, allowedTypes);
        if (!isValidType) {
          throw new Error('Invalid file type. Allowed types: JPG, PNG, WebP');
        }
      }

      // Upload all images
      const uploadResults = await StorageService.uploadUserPhotos(imageUris, userId);

      // Insert records into user_photos table
      const photoInserts = uploadResults.map((result, index) => ({
        user_id: userId,
        photo_url: result.url,
        is_primary: index === 0, // First photo is primary
        order_index: index,
      }));

      const { data, error } = await supabase
        .from('user_photos')
        .insert(photoInserts)
        .select('photo_url');

      if (error) {
        // Clean up uploaded files if database insert fails
        for (const result of uploadResults) {
          try {
            await StorageService.deleteFile('user-photos', result.path);
          } catch (cleanupError) {
            console.warn('Failed to cleanup uploaded file:', cleanupError);
          }
        }
        throw error;
      }

      return data.map(photo => photo.photo_url);
    } catch (error) {
      console.error('Add user photos error:', error);
      throw error;
    }
  }

  /**
   * Delete user photo
   */
  static async deleteUserPhoto(userId: string, photoUrl: string): Promise<void> {
    try {
      const { StorageService } = await import('./storage');
      
      // Get photo record to find storage path
      const { data: photo, error: fetchError } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId)
        .eq('photo_url', photoUrl)
        .single();

      if (fetchError || !photo) {
        throw new Error('Photo not found');
      }

      // Extract path from URL
      const urlParts = photoUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      const path = `${userId}/${filename}`;

      // Delete from storage
      await StorageService.deleteFile('user-photos', path);

      // Delete from database
      const { error: deleteError } = await supabase
        .from('user_photos')
        .delete()
        .eq('id', photo.id);

      if (deleteError) {
        throw deleteError;
      }
    } catch (error) {
      console.error('Delete user photo error:', error);
      throw error;
    }
  }

  /**
   * Set primary photo
   */
  static async setPrimaryPhoto(userId: string, photoUrl: string): Promise<void> {
    try {
      // First, set all photos as non-primary
      await supabase
        .from('user_photos')
        .update({ is_primary: false })
        .eq('user_id', userId);

      // Then set the selected photo as primary
      const { error } = await supabase
        .from('user_photos')
        .update({ is_primary: true })
        .eq('user_id', userId)
        .eq('photo_url', photoUrl);

      if (error) {
        throw error;
      }

      // Update main profile image_uri
      await supabase
        .from('users')
        .update({ 
          image_uri: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    } catch (error) {
      console.error('Set primary photo error:', error);
      throw error;
    }
  }
}