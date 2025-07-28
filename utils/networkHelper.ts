import { Platform } from 'react-native';

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  timeout?: number;
}

interface FetchWithRetryOptions extends RequestInit, RetryOptions {}

/**
 * Custom fetch wrapper with retry logic and better error handling
 * Specifically designed to handle React Native network issues
 */
export async function fetchWithRetry(
  url: string,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    timeout = 30000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Add custom headers for React Native
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...fetchOptions.headers,
      };

      // Platform-specific adjustments
      if (Platform.OS === 'ios') {
        // iOS specific headers that might help with network issues
        headers['Cache-Control'] = 'no-cache';
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!response.ok && response.status !== 400) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error: any) {
      lastError = error;
      
      console.log(`Network request attempt ${attempt + 1} failed:`, error.message);

      // Don't retry on certain errors
      if (
        error.name === 'AbortError' ||
        error.message?.includes('400') ||
        error.message?.includes('401') ||
        error.message?.includes('403')
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw new Error(
          `Network request failed after ${maxRetries + 1} attempts: ${error.message}`
        );
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, maxDelay)));
      delay *= backoffMultiplier;
    }
  }

  throw lastError || new Error('Network request failed');
}

/**
 * Test network connectivity to a specific URL
 */
export async function testNetworkConnectivity(url: string): Promise<{
  success: boolean;
  latency?: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    const response = await fetchWithRetry(url, {
      method: 'HEAD',
      maxRetries: 0,
      timeout: 5000,
    });
    
    const latency = Date.now() - startTime;
    
    return {
      success: response.ok,
      latency,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if we have general internet connectivity
 */
export async function checkInternetConnection(): Promise<boolean> {
  try {
    // Try to reach a reliable endpoint
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      cache: 'no-cache',
    });
    return response.status === 204;
  } catch {
    return false;
  }
}

/**
 * Create a custom fetch function for Supabase with retry logic
 */
export function createSupabaseFetch() {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString();
    
    // Log the request for debugging
    console.log('🌐 Supabase request:', {
      url: url.substring(0, 50) + '...',
      method: init?.method || 'GET',
    });

    try {
      const response = await fetchWithRetry(url, {
        ...init,
        maxRetries: 3,
        initialDelay: 1000,
        timeout: 30000,
      });

      console.log('✅ Supabase request successful:', response.status);
      return response;
    } catch (error: any) {
      console.error('❌ Supabase request failed:', error.message);
      
      // Check if it's a network error
      if (error.message?.includes('Network request failed')) {
        // Try to determine the cause
        const hasInternet = await checkInternetConnection();
        
        if (!hasInternet) {
          throw new Error('No internet connection. Please check your network settings.');
        } else {
          throw new Error('Cannot connect to Supabase. This might be a network configuration issue.');
        }
      }
      
      throw error;
    }
  };
}