import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { logger } from './logger';

/**
 * Pattern to identify iOS container paths that change between app launches
 */
const IOS_CONTAINER_PATTERN = /^file:\/\/.*\/Containers\/Data\/Application\/[A-F0-9-]+\//;
const OLD_CONTAINER_PATTERNS = [
  /^\/var\/mobile\/Containers\/Data\/Application\/[A-F0-9-]+\//,
  /^\/Users\/.*\/Library\/Developer\/CoreSimulator\/Devices\/.*\/data\/Containers\/Data\/Application\/[A-F0-9-]+\//
];

/**
 * Check if an image URI is a local file path
 */
export function isLocalImageUri(uri: string | null | undefined): boolean {
  if (!uri) return false;
  
  return uri.startsWith('file://') || 
         uri.startsWith('/var/') || 
         uri.startsWith('/Users/') ||
         uri.startsWith('/private/');
}

/**
 * Check if a file path is a stale iOS container path
 * These paths become invalid when the app is reinstalled or updated
 */
export function isStaleImagePath(imagePath: string | null | undefined): boolean {
  if (!imagePath || typeof imagePath !== 'string') return false;
  
  // Check if it's an iOS container path
  if (Platform.OS === 'ios' && IOS_CONTAINER_PATTERN.test(imagePath)) {
    // Get current app's container path
    const currentAppPath = FileSystem.documentDirectory;
    if (currentAppPath && !imagePath.includes(currentAppPath)) {
      // This is from a different container, so it's stale
      return true;
    }
  }
  
  // Check old patterns
  for (const pattern of OLD_CONTAINER_PATTERNS) {
    if (pattern.test(imagePath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Validate if a local image file exists
 * Returns the URI if valid, null if invalid
 */
export async function validateLocalImageUri(uri: string | null | undefined): Promise<string | null> {
  if (!uri) return null;
  
  // If it's not a local path, return as-is (e.g., http URLs)
  if (!isLocalImageUri(uri)) {
    return uri;
  }
  
  // Check if it's a stale container path
  if (isStaleImagePath(uri)) {
    logger.debug('[ImageValidation] Detected stale image path:', uri);
    return null;
  }
  
  try {
    // Check if the file exists
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (fileInfo.exists) {
      return uri;
    } else {
      logger.debug('[ImageValidation] File does not exist:', uri);
      return null;
    }
  } catch (error) {
    logger.error('[ImageValidation] Error checking file:', error);
    return null;
  }
}

/**
 * Validate an array of image URIs and return only valid ones
 */
export async function validateImageUris(uris: (string | null | undefined)[]): Promise<string[]> {
  const validationPromises = uris.map(uri => validateLocalImageUri(uri));
  const results = await Promise.all(validationPromises);
  return results.filter((uri): uri is string => uri !== null);
}

/**
 * Get a safe image URI that handles validation
 * Returns the URI if valid, or null if invalid
 */
export async function getSafeImageUri(uri: string | null | undefined, fallbackUri?: string): Promise<string | null> {
  const validatedUri = await validateLocalImageUri(uri);
  if (validatedUri) {
    return validatedUri;
  }
  
  // Try fallback if provided
  if (fallbackUri) {
    const validatedFallback = await validateLocalImageUri(fallbackUri);
    if (validatedFallback) {
      return validatedFallback;
    }
  }
  
  return null;
}

/**
 * Clean up stale image paths from an array
 * This is a synchronous version that just filters out obviously stale paths
 */
export function cleanupStaleImagePaths(paths: (string | null | undefined)[]): string[] {
  return paths.filter((path): path is string => {
    if (!path) return false;
    return !isStaleImagePath(path);
  });
}