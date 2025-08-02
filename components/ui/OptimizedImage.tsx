import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: any;
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  placeholder?: string | { uri: string };
  transition?: number;
  priority?: 'low' | 'normal' | 'high';
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  recyclingKey?: string;
  onError?: () => void;
  showLoading?: boolean;
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
}: OptimizedImageProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [isLoading, setIsLoading] = React.useState(showLoading);

  return (
    <View style={[style, styles.container]}>
      <Image
        source={source}
        style={[StyleSheet.absoluteFill, style]}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        priority={priority}
        cachePolicy={cachePolicy}
        recyclingKey={recyclingKey}
        onError={onError}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
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
});