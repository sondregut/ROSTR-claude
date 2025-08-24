import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '@/utils/logger';
import { diagnoseNetworkIssue } from '@/utils/networkConfig';
import { validateLocalImageUri, isStaleImagePath } from '@/utils/imageValidation';


interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string | { uri: string };
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  recyclingKey?: string;
  onError?: (error?: any) => void;
  showLoading?: boolean;
  enableRetry?: boolean;
  maxRetries?: number;
  showFallback?: boolean;
}

// Blurhash placeholder for loading state
const blurhash = 'LGF5]+xbH.Dx}_NfIU%MtRR%MWWB';

export function OptimizedImage({
  source,
  style,
  contentFit = 'cover',
  placeholder = blurhash,
  transition = 300,
  priority = 'normal',
  cachePolicy = 'memory-disk',
  recyclingKey,
  onError,
  showLoading = false,
  enableRetry = true,
  maxRetries = 3,
  showFallback = true,
}: OptimizedImageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = useState(showLoading);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const isMountedRef = useRef(true);
  
  // Validate image URI
  const sourceUri = typeof source === 'object' && 'uri' in source ? source.uri : null;
  const [isValidUri, setIsValidUri] = useState(true);
  
  // Check for stale image paths on mount and source changes
  React.useEffect(() => {
    if (sourceUri) {
      // Check if it's a stale iOS container path
      if (isStaleImagePath(sourceUri)) {
        logger.warn('[OptimizedImage] Detected stale image path:', sourceUri);
        setIsValidUri(false);
        setHasError(true);
        return;
      }
      
      // Validate local URIs
      if (sourceUri.startsWith('file://')) {
        validateLocalImageUri(sourceUri).then(isValid => {
          if (!isValid && isMountedRef.current) {
            logger.warn('[OptimizedImage] Local image not found:', sourceUri);
            setIsValidUri(false);
            setHasError(true);
          }
        });
      }
    }
  }, [sourceUri]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const handleError = useCallback(async (error?: any) => {
    if (!isMountedRef.current) return;
    
    const sourceUri = typeof source === 'object' && 'uri' in source ? source.uri : null;
    
    // Check if this is a temporary file that no longer exists
    const isTempFile = sourceUri && (
      sourceUri.includes('/tmp/') || 
      sourceUri.includes('/Caches/') || 
      sourceUri.includes('react-native-image-crop-picker') ||
      sourceUri.includes('ImagePicker')
    );
    
    if (isTempFile) {
      // Don't retry for temporary files that no longer exist
      logger.warn('[OptimizedImage] Temporary file no longer exists:', sourceUri);
      setHasError(true);
      onError?.(new Error('Temporary file no longer exists'));
      return;
    }
    
    // Check if this might be a Cloudflare/CDN error
    const isSupabaseUrl = sourceUri && sourceUri.includes('.supabase.co/');
    const isCdnError = isSupabaseUrl && 
                       (error?.message?.includes('Unable to decode') || 
                        error?.message?.includes('Invalid image data') ||
                        error?.message?.includes('Network request failed'));
    
    if (isCdnError) {
      logger.warn('[OptimizedImage] Detected possible CDN/Cloudflare error for:', sourceUri);
      
      // Try to switch to direct storage URL if it's a CDN URL
      if (sourceUri.includes('/storage/v1/object/public/')) {
        // Already a direct URL, add cache buster
        if (enableRetry && retryCount < 1) {
          const cacheBustUrl = sourceUri.includes('?') 
            ? `${sourceUri}&cb=${Date.now()}`
            : `${sourceUri}?cb=${Date.now()}`;
          
          logger.info('[OptimizedImage] Retrying direct URL with cache buster:', cacheBustUrl);
          
          // Update source to use cache-busted URL
          if (typeof source === 'object' && 'uri' in source) {
            source.uri = cacheBustUrl;
          }
          
          setRetryCount(prev => prev + 1);
          setHasError(false);
          setIsLoading(true);
          return;
        }
      } else {
        // Try to construct direct URL from CDN URL
        const urlMatch = sourceUri.match(/https:\/\/([^.]+)\.supabase\.co\/storage\/v1\/object\/public\/(.+)/);
        if (urlMatch && enableRetry && retryCount < 1) {
          const [_, projectId, path] = urlMatch;
          const directUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${path}`;
          
          logger.info('[OptimizedImage] Switching from CDN to direct URL:', directUrl);
          
          // Update source to use direct URL
          if (typeof source === 'object' && 'uri' in source) {
            source.uri = directUrl;
          }
          
          setRetryCount(prev => prev + 1);
          setHasError(false);
          setIsLoading(true);
          return;
        }
      }
      
      // Try to verify if URL returns HTML instead of image
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(sourceUri, {
          method: 'HEAD',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });
        
        clearTimeout(timeout);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          logger.error('[OptimizedImage] URL returns HTML instead of image:', {
            uri: sourceUri,
            contentType,
            status: response.status,
          });
        }
      } catch (verifyError) {
        logger.error('[OptimizedImage] Failed to verify image URL:', verifyError);
      }
    }
    
    // Log detailed error information
    logger.error('[OptimizedImage] Failed to load image:', {
      uri: sourceUri,
      error: error?.toString() || 'Unknown error',
      retryCount,
      maxRetries,
      isCloudflareError,
    });
    
    // Diagnose network issues for URLs
    if (sourceUri && sourceUri.startsWith('http') && !isCloudflareError) {
      try {
        const diagnosis = await diagnoseNetworkIssue(sourceUri);
        logger.error('[OptimizedImage] Network diagnosis:', diagnosis);
      } catch (diagError) {
        logger.error('[OptimizedImage] Failed to diagnose network:', diagError);
      }
    }
    
    setHasError(true);
    
    // Attempt retry if enabled and within retry limit
    if (enableRetry && retryCount < maxRetries && sourceUri && !isTempFile && !isCdnError) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff with max 10s
      logger.info(`[OptimizedImage] Retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      
      retryTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          setRetryCount(prev => prev + 1);
          setHasError(false);
          setIsLoading(true);
        }
      }, delay);
    }
    
    // Call the provided onError callback
    if (onError) {
      onError(error);
    }
  }, [source, retryCount, maxRetries, enableRetry, onError]);

  const handleRetryPress = useCallback(() => {
    setRetryCount(0);
    setHasError(false);
    setIsLoading(true);
  }, []);

  // Show error fallback if image failed to load and retries exhausted or invalid URI
  if ((hasError && retryCount >= maxRetries && showFallback) || (!isValidUri && showFallback)) {
    return (
      <Pressable 
        style={[style, styles.errorContainer, { backgroundColor: colors.card }]}
        onPress={isValidUri ? handleRetryPress : undefined}
        disabled={!isValidUri}
      >
        <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {!isValidUri ? 'Image not found' : 'Failed to load image'}
        </Text>
        {isValidUri && (
          <Text style={[styles.retryText, { color: colors.primary }]}>Tap to retry</Text>
        )}
      </Pressable>
    );
  }

  // Use source directly - cache busting is now handled at upload time
  const processedSource = source;

  return (
    <View style={[style, styles.container]}>
      <Image
        key={`${JSON.stringify(processedSource)}-${retryCount}`} // Force re-render on retry
        source={processedSource}
        style={[StyleSheet.absoluteFill, style]}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        priority={priority}
        cachePolicy={cachePolicy}
        recyclingKey={recyclingKey}
        onError={handleError}
        onLoadStart={() => {
          if (isMountedRef.current) {
            setIsLoading(true);
            setHasError(false);
          }
        }}
        onLoadEnd={() => {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }}
        onLoad={() => {
          if (isMountedRef.current) {
            setHasError(false);
            setRetryCount(0);
          }
        }}
      />
      {isLoading && showLoading && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 8,
  },
  retryText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});