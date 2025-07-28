import { Platform } from 'react-native';

/**
 * Development-only network debugging utilities
 */

// Track all network requests for debugging
export function installNetworkLogger() {
  if (!__DEV__) return;

  const originalFetch = global.fetch;
  let requestId = 0;

  global.fetch = async (url, options = {}) => {
    const id = ++requestId;
    const startTime = Date.now();
    
    console.log(`🔵 [${id}] ${options.method || 'GET'} ${url}`);
    if (options.body) {
      console.log(`📦 [${id}] Body:`, options.body.substring(0, 200));
    }

    try {
      const response = await originalFetch(url, options);
      const duration = Date.now() - startTime;
      
      console.log(`🟢 [${id}] ${response.status} (${duration}ms)`);
      
      // Clone response to log body without consuming it
      const clonedResponse = response.clone();
      try {
        const text = await clonedResponse.text();
        console.log(`📥 [${id}] Response:`, text.substring(0, 200));
      } catch (e) {
        // Ignore if we can't read the body
      }
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`🔴 [${id}] Failed (${duration}ms):`, error.message);
      
      // Log detailed error information
      console.log(`🔍 [${id}] Error details:`, {
        name: error.name,
        message: error.message,
        url: url,
        platform: Platform.OS,
        // Check if it's an SSL error
        isSSL: url.toString().startsWith('https'),
        // Check if it's localhost
        isLocalhost: url.toString().includes('localhost') || url.toString().includes('127.0.0.1'),
      });
      
      throw error;
    }
  };

  console.log('🔧 Network logger installed');
}

/**
 * Test various network endpoints to diagnose issues
 */
export async function runNetworkDiagnostics() {
  console.log('🏥 Running network diagnostics...');
  
  const tests = [
    {
      name: 'Google (HTTP)',
      url: 'http://www.google.com/generate_204',
      expected: 204,
    },
    {
      name: 'Google (HTTPS)',
      url: 'https://www.google.com/generate_204',
      expected: 204,
    },
    {
      name: 'Supabase API',
      url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`,
      expected: 200,
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
      },
    },
    {
      name: 'Supabase Auth Health',
      url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`,
      expected: 200,
    },
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const start = Date.now();
      const response = await fetch(test.url, {
        method: 'GET',
        headers: test.headers || {},
      });
      const duration = Date.now() - start;
      
      results.push({
        name: test.name,
        success: response.status === test.expected,
        status: response.status,
        duration,
      });
    } catch (error: any) {
      results.push({
        name: test.name,
        success: false,
        error: error.message,
      });
    }
  }
  
  console.log('📊 Diagnostic Results:');
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}:`, result);
  });
  
  return results;
}

/**
 * Get debugging information about the current environment
 */
export function getEnvironmentInfo() {
  return {
    platform: Platform.OS,
    version: Platform.Version,
    isDev: __DEV__,
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    // Check if running in Expo Go
    isExpoGo: !!(global as any).expo,
  };
}

// Auto-install in development
if (__DEV__) {
  installNetworkLogger();
}