import { useColorScheme as useNativeColorScheme } from 'react-native';

export function useColorScheme(): 'light' | 'dark' {
  // Try to use theme context if available
  try {
    const { useTheme } = require('@/contexts/ThemeContext');
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    // Fallback to native color scheme
    const nativeScheme = useNativeColorScheme();
    return nativeScheme ?? 'light';
  }
}
