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
    
    // Log detailed error information
    logger.error('[OptimizedImage] Failed to load image:', {
      uri: sourceUri,
      error: error?.toString() || 'Unknown error',
      retryCount,
      maxRetries,
    });
    
    // Diagnose network issues for URLs
    if (sourceUri && sourceUri.startsWith('http')) {
      try {
        const diagnosis = await diagnoseNetworkIssue(sourceUri);
        logger.error('[OptimizedImage] Network diagnosis:', diagnosis);
      } catch (diagError) {
        logger.error('[OptimizedImage] Failed to diagnose network:', diagError);
      }
    }
    
    setHasError(true);
    
    // Attempt retry if enabled and within retry limit
    if (enableRetry && retryCount < maxRetries && sourceUri && !isTempFile) {
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

  return (
    <View style={[style, styles.container]}>
      <Image
        key={`${source}-${retryCount}`} // Force re-render on retry
        source={source}
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