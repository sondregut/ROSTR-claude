/**
 * Image loading utilities with network retry logic
 * Handles Supabase storage URLs with SSL/network error recovery
 */

import { logger } from './logger';
import { withSSLRetry, diagnoseNetworkIssue } from './networkConfig';
import { supabaseUrl } from '@/config/env';

interface ImageLoadResult {
  success: boolean;
  url?: string;
  error?: string;
  diagnostics?: any;
}

/**
 * Validates a Supabase storage URL
 */
export function isValidSupabaseUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.includes('supabase.co') || parsedUrl.hostname.includes('supabase.io');
  } catch {
    return false;
  }
}

/**
 * Prefetch an image with network retry logic
 * This helps ensure the image is cached before display
 */
export async function prefetchImageWithRetry(url: string): Promise<ImageLoadResult> {
  if (!url) {
    return { success: false, error: 'No URL provided' };
  }

  logger.info('[ImageLoader] Prefetching image:', url);

  try {
    // Use SSL retry wrapper for network operations
    const result = await withSSLRetry(async () => {
      const response = await fetch(url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'RostrDating/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    }, 'Image prefetch');

    logger.info('[ImageLoader] Image prefetch successful:', url);
    return { success: true, url };
  } catch (error) {
    logger.error('[ImageLoader] Image prefetch failed:', {
      url,
      error: error?.toString() || 'Unknown error',
    });

    // Run network diagnostics for Supabase URLs
    let diagnostics;
    if (isValidSupabaseUrl(url)) {
      try {
        diagnostics = await diagnoseNetworkIssue(url);
        logger.error('[ImageLoader] Network diagnostics:', diagnostics);
      } catch (diagError) {
        logger.error('[ImageLoader] Diagnostics failed:', diagError);
      }
    }

    return {
      success: false,
      error: error?.toString() || 'Failed to prefetch image',
      diagnostics,
    };
  }
}

/**
 * Construct a proper Supabase storage URL
 */
export function constructSupabaseImageUrl(bucket: string, path: string): string {
  if (!supabaseUrl || !bucket || !path) {
    logger.error('[ImageLoader] Invalid parameters for URL construction:', {
      supabaseUrl: !!supabaseUrl,
      bucket,
      path,
    });
    return '';
  }

  // Remove any leading slashes from path
  const cleanPath = path.replace(/^\/+/, '');
  
  // Construct the full URL
  const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${cleanPath}`;
  
  logger.debug('[ImageLoader] Constructed URL:', url);
  return url;
}

/**
 * Validate and potentially fix a Supabase image URL
 */
export function validateAndFixImageUrl(url: string): string {
  if (!url) return '';

  // Check if it's already a valid URL
  try {
    new URL(url);
    return url; // URL is valid
  } catch {
    // Not a valid URL, might be a path
  }

  // If it looks like a Supabase path, construct the full URL
  if (url.includes('user-photos/') || url.includes('profile_')) {
    const match = url.match(/(?:user-photos\/)?([\w-]+\/profile_\d+\.\w+)$/);
    if (match) {
      return constructSupabaseImageUrl('user-photos', match[1]);
    }
  }

  // Return as-is if we can't fix it
  return url;
}

/**
 * Get a fallback image URL for failed loads
 */
export function getFallbackImageUrl(): string {
  // Return a data URI for a simple placeholder
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2UwZTBlMCIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD4KPC9zdmc+';
}

export default {
  isValidSupabaseUrl,
  prefetchImageWithRetry,
  constructSupabaseImageUrl,
  validateAndFixImageUrl,
  getFallbackImageUrl,
};