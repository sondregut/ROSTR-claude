import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

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
 * Pick image from camera or library
 */
export const pickImage = async (
  source: 'camera' | 'library' = 'library',
  options: PhotoUploadOptions = {}
): Promise<ImagePicker.ImagePickerResult> => {
  const defaultOptions: ImagePicker.ImagePickerOptions = {
    mediaTypes: [ImagePicker.MediaType.Images],
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [1, 1],
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
 * Upload image to Supabase storage
 */
export const uploadImageToSupabase = async (
  uri: string,
  userId: string,
  bucket: string = 'profile-photos'
): Promise<PhotoUploadResult> => {
  try {
    // Get file extension
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${fileExt}`;

    // Convert image to blob
    const response = await fetch(uri);
    const blob = await response.blob();

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: `image/${fileExt}`,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Complete photo upload flow: pick image and upload to Supabase
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