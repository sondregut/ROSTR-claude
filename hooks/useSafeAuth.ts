import { useAuth } from '@/contexts/SimpleAuthContext';

/**
 * Safe version of useAuth that returns null if context is not available
 * Prevents errors when components render before providers are ready
 */
export function useSafeAuth() {
  try {
    return useAuth();
  } catch (error) {
    // Auth context not available yet
    return null;
  }
}