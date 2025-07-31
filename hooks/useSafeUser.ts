import { useUser } from '@/contexts/UserContext';

/**
 * Safe version of useUser that returns null if context is not available
 * Prevents errors when components render before providers are ready
 */
export function useSafeUser() {
  try {
    return useUser();
  } catch (error) {
    // User context not available yet
    return null;
  }
}