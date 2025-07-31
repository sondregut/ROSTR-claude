import React, { Suspense, lazy, ComponentType, useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LazyComponentProps<T> {
  loader: () => Promise<{ default: ComponentType<T> }>;
  props?: T;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LazyComponent<T extends object>({ 
  loader, 
  props = {} as T, 
  fallback,
  delay = 300 
}: LazyComponentProps<T>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Show loader after delay to avoid flash for fast loads
    const timer = setTimeout(() => setShowLoader(true), delay);
    
    // Load component
    loader().then(module => {
      clearTimeout(timer);
      setComponent(() => module.default);
    });

    return () => clearTimeout(timer);
  }, [loader, delay]);

  if (!Component) {
    if (fallback) return <>{fallback}</>;
    
    return (
      <View style={styles.container}>
        {showLoader && <ActivityIndicator size="small" color={colors.primary} />}
      </View>
    );
  }

  return (
    <Suspense 
      fallback={
        fallback || (
          <View style={styles.container}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )
      }
    >
      <Component {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});