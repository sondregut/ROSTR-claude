// Network configuration for React Native
// Handles platform-specific network and SSL issues

import { Platform } from 'react-native';

// Platform-specific network configuration
export const networkConfig = {
  // Default timeout for network requests
  defaultTimeout: 30000,
  
  // SSL/TLS configuration
  ssl: {
    // Allow self-signed certificates in development only
    allowSelfSigned: __DEV__,
    
    // Skip certificate validation in development only
    skipCertificateValidation: __DEV__,
    
    // Retry configuration for SSL errors (enabled in both dev and production)
    sslRetry: {
      enabled: true, // Enable retry in production too
      maxAttempts: 3,
      backoffMultiplier: 1.5,
      initialDelay: 1000,
    },
  },
  
  // Platform-specific configurations
  ios: {
    // iOS often has stricter SSL requirements
    requiresCertificatePinning: false,
    allowsArbitraryLoads: __DEV__,
    
    // iOS specific headers that might help with SSL
    headers: {
      'User-Agent': 'RostrDating/1.0 (iOS)',
      'X-Platform': 'iOS',
    },
  },
  
  android: {
    // Android specific network configuration
    cleartextTrafficPermitted: __DEV__,
    
    // Android specific headers
    headers: {
      'User-Agent': 'RostrDating/1.0 (Android)',
      'X-Platform': 'Android',
    },
  },
};

// Get platform-specific configuration
export function getPlatformNetworkConfig() {
  const baseConfig = {
    ...networkConfig,
    platform: Platform.OS,
  };
  
  if (Platform.OS === 'ios') {
    return { ...baseConfig, ...networkConfig.ios };
  } else if (Platform.OS === 'android') {
    return { ...baseConfig, ...networkConfig.android };
  }
  
  return baseConfig;
}

// Helper to create fetch options with SSL handling
export function createFetchOptions(options = {}) {
  const config = getPlatformNetworkConfig();
  
  const fetchOptions = {
    ...options,
    headers: {
      ...config.headers,
      ...options.headers,
    },
  };
  
  // Add options to help with SSL and CORS issues
  // These are safe to use in production and can prevent connection issues
  fetchOptions.mode = options.mode || 'cors';
  fetchOptions.credentials = options.credentials || 'include';
  
  return fetchOptions;
}

// SSL Error detection helper
export function isSSLError(error) {
  if (!error || !error.message) return false;
  
  const errorMessage = error.message.toLowerCase();
  const sslErrorPatterns = [
    'certificate',
    'ssl',
    'tls',
    'cert',
    'self signed',
    'unable to verify',
    'certificate has expired',
    'certificate verification',
    'err_cert',
    'ssl_error',
    'certificate_verify_failed',
    'ssl handshake',
  ];
  
  return sslErrorPatterns.some(pattern => errorMessage.includes(pattern));
}

// Retry with exponential backoff for SSL errors
export async function retryWithBackoff(fn, options = {}) {
  const config = networkConfig.ssl.sslRetry;
  const maxAttempts = options.maxAttempts || config.maxAttempts;
  const initialDelay = options.initialDelay || config.initialDelay;
  const backoffMultiplier = options.backoffMultiplier || config.backoffMultiplier;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Only retry on SSL errors
      if (!isSSLError(error)) {
        throw error;
      }
      
      const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
      console.warn(`🔄 SSL retry attempt ${attempt}/${maxAttempts} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

// Test network connectivity to a specific URL
export async function testNetworkConnectivity(url) {
  try {
    const options = createFetchOptions({
      method: 'HEAD',
      timeout: 5000,
    });
    
    const response = await fetch(url, options);
    
    return {
      success: true,
      status: response.status,
      headers: response.headers,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      isSSLError: isSSLError(error),
    };
  }
}

// Export a function to diagnose network issues
export async function diagnoseNetworkIssue(url) {
  console.log('🔍 Diagnosing network issue for:', url);
  
  const results = {
    url,
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    isDevelopment: __DEV__,
  };
  
  // Test basic connectivity
  const connectivityTest = await testNetworkConnectivity(url);
  results.connectivity = connectivityTest;
  
  // If SSL error, provide more details
  if (connectivityTest.isSSLError) {
    results.sslIssue = {
      detected: true,
      message: 'SSL/Certificate validation error detected',
      recommendation: __DEV__ 
        ? 'SSL bypass is enabled in development mode. The request should retry automatically.'
        : 'Please ensure the server has a valid SSL certificate.',
    };
  }
  
  console.log('📊 Network diagnosis results:', results);
  return results;
}

// Wrapper for Supabase operations with SSL retry
export async function withSSLRetry(operation, operationName = 'Operation') {
  const config = networkConfig.ssl.sslRetry;
  
  if (!config.enabled) {
    return operation();
  }
  
  let lastError;
  
  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if it's a network/SSL error
      const errorMessage = error?.message?.toLowerCase() || '';
      const isNetworkError = errorMessage.includes('network') || 
                           errorMessage.includes('fetch') ||
                           errorMessage.includes('ssl') ||
                           errorMessage.includes('certificate') ||
                           errorMessage.includes('unable to connect');
      
      if (attempt === config.maxAttempts || !isNetworkError) {
        throw error;
      }
      
      const delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);
      console.warn(`🔄 ${operationName} retry ${attempt}/${config.maxAttempts} after ${delay}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export default {
  networkConfig,
  getPlatformNetworkConfig,
  createFetchOptions,
  isSSLError,
  retryWithBackoff,
  withSSLRetry,
  testNetworkConnectivity,
  diagnoseNetworkIssue,
};