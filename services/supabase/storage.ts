import { supabase } from '@/lib/supabase';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

export interface UploadResult {
  url: string;
  path: string;
  fullUrl: string;
}

export class StorageService {
  private static readonly BUCKETS = {
    USER_PHOTOS: 'user-photos',
    DATE_ENTRY_IMAGES: 'date-entry-images',
    CHAT_MEDIA: 'chat-media',
  } as const;

  /**
   * Generate a unique filename for upload
   */
  private static generateUniqueFilename(userId: string, originalName: string, prefix: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${userId}/${prefix}_${timestamp}_${randomStr}.${extension}`;
  }

  /**
   * Upload user profile photo
   */
  static async uploadUserPhoto(imageUri: string, userId: string): Promise<UploadResult> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate user can upload
      if (user.id !== userId) {
        throw new Error('Cannot upload photos for other users');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const filename = this.generateUniqueFilename(userId, 'profile_photo.jpg', 'profile');

      // Convert base64 to blob
      const blob = this.base64ToBlob(base64, 'image/jpeg');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.USER_PHOTOS)
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.USER_PHOTOS)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        fullUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Upload user photo error:', error);
      throw error;
    }
  }

  /**
   * Upload multiple user photos
   */
  static async uploadUserPhotos(imageUris: string[], userId: string): Promise<UploadResult[]> {
    try {
      const uploadPromises = imageUris.map((uri, index) => 
        this.uploadUserPhoto(uri, userId)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Upload user photos error:', error);
      throw error;
    }
  }

  /**
   * Upload date entry image
   */
  static async uploadDateEntryImage(imageUri: string, userId: string): Promise<UploadResult> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate user can upload
      if (user.id !== userId) {
        throw new Error('Cannot upload images for other users');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const filename = this.generateUniqueFilename(userId, 'date_image.jpg', 'date');

      // Convert base64 to blob
      const blob = this.base64ToBlob(base64, 'image/jpeg');

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.DATE_ENTRY_IMAGES)
        .upload(filename, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKETS.DATE_ENTRY_IMAGES)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        fullUrl: urlData.publicUrl,
      };
    } catch (error) {
      console.error('Upload date entry image error:', error);
      throw error;
    }
  }

  /**
   * Upload chat media (private)
   */
  static async uploadChatMedia(
    mediaUri: string, 
    userId: string, 
    mediaType: 'image' | 'video' = 'image'
  ): Promise<UploadResult> {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate user can upload
      if (user.id !== userId) {
        throw new Error('Cannot upload media for other users');
      }

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(mediaUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Generate unique filename
      const extension = mediaType === 'video' ? 'mp4' : 'jpg';
      const filename = this.generateUniqueFilename(userId, `chat_media.${extension}`, 'chat');

      // Convert base64 to blob
      const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
      const blob = this.base64ToBlob(base64, contentType);

      // Upload to Supabase Storage (private bucket)
      const { data, error } = await supabase.storage
        .from(this.BUCKETS.CHAT_MEDIA)
        .upload(filename, blob, {
          contentType,
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // For private buckets, we'll need to generate signed URLs when accessing
      const { data: urlData } = await supabase.storage
        .from(this.BUCKETS.CHAT_MEDIA)
        .createSignedUrl(data.path, 3600); // 1 hour expiry

      if (urlData?.signedUrl) {
        return {
          url: urlData.signedUrl,
          path: data.path,
          fullUrl: urlData.signedUrl,
        };
      }

      throw new Error('Failed to generate signed URL');
    } catch (error) {
      console.error('Upload chat media error:', error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  static async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  /**
   * Get signed URL for private files
   */
  static async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data?.signedUrl || '';
    } catch (error) {
      console.error('Get signed URL error:', error);
      throw error;
    }
  }

  /**
   * Resize and compress image before upload
   */
  static async processImageForUpload(
    imageUri: string,
    maxWidth: number = 1024,
    maxHeight: number = 1024,
    quality: number = 0.8
  ): Promise<string> {
    try {
      const manipResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality,
      });

      if (!manipResult.canceled && manipResult.assets[0]) {
        return manipResult.assets[0].uri;
      }

      return imageUri;
    } catch (error) {
      console.error('Process image error:', error);
      return imageUri; // Return original if processing fails
    }
  }

  /**
   * Convert base64 string to blob
   */
  private static base64ToBlob(base64: string, mimeType: string): Blob {
    const byteString = atob(base64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uint8Array = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
      uint8Array[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeType });
  }

  /**
   * Validate file size
   */
  static async validateFileSize(uri: string, maxSizeMB: number): Promise<boolean> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && fileInfo.size) {
        const sizeMB = fileInfo.size / (1024 * 1024);
        return sizeMB <= maxSizeMB;
      }
      return false;
    } catch (error) {
      console.error('Validate file size error:', error);
      return false;
    }
  }

  /**
   * Get file extension from URI
   */
  static getFileExtension(uri: string): string {
    return uri.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Validate file type
   */
  static validateFileType(uri: string, allowedTypes: string[]): boolean {
    const extension = this.getFileExtension(uri);
    return allowedTypes.includes(extension);
  }

  /**
   * Clean up old user photos when uploading new ones
   */
  static async cleanupOldUserPhotos(userId: string, keepCount: number = 5): Promise<void> {
    try {
      // List all files for user
      const { data: files, error } = await supabase.storage
        .from(this.BUCKETS.USER_PHOTOS)
        .list(`${userId}/`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error || !files) {
        return;
      }

      // Keep only the most recent files
      const filesToDelete = files.slice(keepCount);
      
      if (filesToDelete.length > 0) {
        const pathsToDelete = filesToDelete.map(file => `${userId}/${file.name}`);
        
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKETS.USER_PHOTOS)
          .remove(pathsToDelete);

        if (deleteError) {
          console.warn('Failed to cleanup old photos:', deleteError);
        }
      }
    } catch (error) {
      console.warn('Cleanup old user photos error:', error);
    }
  }
}