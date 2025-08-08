import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

// Dynamically import ImageCropPicker to handle cases where it's not available
let ImageCropPicker: any = null;
try {
  ImageCropPicker = require('react-native-image-crop-picker');
} catch (error) {
  console.log('react-native-image-crop-picker not available, using fallback image handling');
}


export interface PhotoUploadOptions {
  quality?: number;
  allowsEditing?: boolean;
  aspect?: [number, number];
  maxWidth?: number;
  maxHeight?: number;
}

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Request camera permissions if not already granted
 */
export const requestPermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    return false;
  }
  return true;
};

/**
 * Show action sheet to select photo source (camera or library)
 */
export const selectPhotoSource = (): Promise<'camera' | 'library' | 'cancel'> => {
  return new Promise((resolve) => {
    // For now, we'll default to library. In a full implementation,
    // you could use ActionSheetIOS or react-native-action-sheet
    resolve('library');
  });
};

/**
 * Pick image from camera or library using react-native-image-crop-picker or Expo ImagePicker as fallback
 */
export const pickImageWithCrop = async (
  source: 'camera' | 'library' = 'library',
  options: PhotoUploadOptions = {}
): Promise<{ success: boolean; uri?: string; error?: string }> => {
  // If ImageCropPicker is available, use it for cropping
  if (ImageCropPicker) {
    try {
      const cropOptions = {
        width: options.maxWidth || 800,
        height: options.maxHeight || 800,
        cropping: options.allowsEditing ?? true,
        quality: options.quality ?? 0.8,
        mediaType: 'photo' as const,
        includeBase64: false,
        includeExif: false,
        compressImageQuality: options.quality ?? 0.8,
      };

      // Handle aspect ratio
      if (options.aspect) {
        const [aspectX, aspectY] = options.aspect;
        if (aspectX === aspectY) {
          // Square aspect ratio
          cropOptions.width = 800;
          cropOptions.height = 800;
        } else if (aspectX > aspectY) {
          // Landscape (e.g., 4:3)
          cropOptions.width = 800;
          cropOptions.height = Math.round(800 * (aspectY / aspectX));
        } else {
          // Portrait (e.g., 3:4)
          cropOptions.width = Math.round(800 * (aspectX / aspectY));
          cropOptions.height = 800;
        }
      }

      let result;
      if (source === 'camera') {
        result = await ImageCropPicker.openCamera(cropOptions);
      } else {
        result = await ImageCropPicker.openPicker(cropOptions);
      }

      return {
        success: true,
        uri: result.path,
      };
    } catch (error: any) {
      // Handle user cancellation
      if (error.code === 'E_PICKER_CANCELLED') {
        return {
          success: false,
          error: 'Selection cancelled',
        };
      }
      
      console.error('Image crop picker error:', error);
      return {
        success: false,
        error: error.message || 'Failed to pick image',
      };
    }
  }

  // Fallback to Expo ImagePicker with ImageManipulator for cropping
  try {
    // Request permissions
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Camera/photo library permission denied',
      };
    }

    const defaultOptions: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disabled to prevent freezing, we'll crop manually
      quality: options.quality ?? 0.8,
    };

    let result;
    if (source === 'camera') {
      result = await ImagePicker.launchCameraAsync(defaultOptions);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(defaultOptions);
    }

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: 'Selection cancelled',
      };
    }

    let imageUri = result.assets[0].uri;

    // Note: In this fallback mode, we don't crop images to prevent complexity
    // Users will get the full image, which is better than app freezing
    console.log('Using basic image selection without cropping to prevent freezing');

    return {
      success: true,
      uri: imageUri,
    };
  } catch (error: any) {
    console.error('Expo ImagePicker error:', error);
    return {
      success: false,
      error: error.message || 'Failed to pick image',
    };
  }
};

/**
 * Legacy function for backward compatibility - uses expo image picker without editing
 */
export const pickImage = async (
  source: 'camera' | 'library' = 'library',
  options: PhotoUploadOptions = {}
): Promise<ImagePicker.ImagePickerResult> => {
  const defaultOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false, // Disabled to prevent freezing
    quality: options.quality ?? 0.8,
    ...(options.maxWidth && { width: options.maxWidth }),
    ...(options.maxHeight && { height: options.maxHeight }),
  };

  if (source === 'camera') {
    return await ImagePicker.launchCameraAsync(defaultOptions);
  } else {
    return await ImagePicker.launchImageLibraryAsync(defaultOptions);
  }
};

/**
 * Upload image to Supabase storage with timeout and non-blocking operations
 */
export const uploadImageToSupabase = async (
  uri: string,
  userId: string,
  bucket: string = 'user-photos'
): Promise<PhotoUploadResult> => {
  try {
    console.log('[uploadImageToSupabase] Starting upload...');
    console.log('[uploadImageToSupabase] Bucket:', bucket);
    console.log('[uploadImageToSupabase] User ID:', userId);
    
    // Verify authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[uploadImageToSupabase] Not authenticated:', authError);
      return {
        success: false,
        error: 'Please sign in to upload photos',
      };
    }
    
    console.log('[uploadImageToSupabase] Authenticated as:', user.email);
    
    // Verify user ID matches
    if (user.id !== userId) {
      console.error('[uploadImageToSupabase] User ID mismatch:', user.id, 'vs', userId);
      return {
        success: false,
        error: 'Invalid user session',
      };
    }
    // Get file extension
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    // Include user folder in the path structure
    const fileName = `${userId}/profile_${Date.now()}.${fileExt}`;

    // Create upload with timeout to prevent watchdog kills
    const uploadPromise = new Promise<PhotoUploadResult>(async (resolve, reject) => {
      try {
        // Fetch with timeout to prevent blocking
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(uri, { signal: controller.signal });
        clearTimeout(timeout);
        
        // Convert to blob asynchronously
        const blob = await response.blob();

        // Yield to main thread before upload
        await new Promise(r => setTimeout(r, 0));

        // Upload to Supabase storage
        console.log(`Uploading to bucket: ${bucket}, filename: ${fileName}`);
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false,
            contentType: `image/${fileExt}`,
          });

        if (error) {
          console.error('[uploadImageToSupabase] Upload error:', error);
          console.error('[uploadImageToSupabase] Error details:', {
            message: error.message,
            statusCode: error.statusCode,
            error: error.error,
            bucket: bucket,
            fileName: fileName
          });
          
          // Provide more specific error messages
          let errorMessage = error.message;
          if (error.message?.includes('storage/object-not-found')) {
            errorMessage = 'Storage bucket not found. Please contact support.';
          } else if (error.message?.includes('storage/unauthorized')) {
            errorMessage = 'You do not have permission to upload photos.';
          } else if (error.message?.includes('Bucket not found')) {
            errorMessage = 'Storage not properly configured. Please contact support.';
          }
          
          resolve({
            success: false,
            error: errorMessage,
          });
          return;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(data.path);

        resolve({
          success: true,
          url: urlData.publicUrl,
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          resolve({
            success: false,
            error: 'Image fetch timed out',
          });
        } else {
          reject(error);
        }
      }
    });

    // Add 5-second timeout to prevent watchdog kills
    const timeoutPromise = new Promise<PhotoUploadResult>((resolve) => {
      setTimeout(() => {
        resolve({
          success: false,
          error: 'Upload timed out after 5 seconds',
        });
      }, 5000);
    });

    // Race between upload and timeout
    const result = await Promise.race([uploadPromise, timeoutPromise]);
    return result;
  } catch (error: any) {
    console.error('Upload error:', error);
    
    // Handle specific storage errors
    if (error?.message?.includes('Bucket not found')) {
      return {
        success: false,
        error: 'Storage not configured. Please contact support.',
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Complete photo upload flow with cropping: pick image and upload to Supabase
 */
export const uploadPhotoWithCrop = async (
  userId: string,
  source: 'camera' | 'library' = 'library',
  options: PhotoUploadOptions = {}
): Promise<PhotoUploadResult> => {
  try {
    // Pick and crop image
    const result = await pickImageWithCrop(source, options);
    
    if (!result.success || !result.uri) {
      return {
        success: false,
        error: result.error || 'Image selection cancelled',
      };
    }

    // Upload to Supabase
    return await uploadImageToSupabase(result.uri, userId);
  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Complete photo upload flow: pick image and upload to Supabase (legacy without cropping)
 */
export const uploadProfilePhoto = async (
  userId: string,
  source: 'camera' | 'library' = 'library',
  options: PhotoUploadOptions = {}
): Promise<PhotoUploadResult> => {
  try {
    // Request permissions
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return {
        success: false,
        error: 'Camera/photo library permission denied',
      };
    }

    // Pick image
    const result = await pickImage(source, options);
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return {
        success: false,
        error: 'Image selection cancelled',
      };
    }

    const imageUri = result.assets[0].uri;

    // Upload to Supabase
    return await uploadImageToSupabase(imageUri, userId);
  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};