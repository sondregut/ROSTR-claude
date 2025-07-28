import { supabase } from '@/lib/supabase';

/**
 * Test Supabase connection directly
 */
export async function testSupabaseConnection() {
  console.log('🧪 Testing Supabase connection...');
  
  const results = {
    basicConnection: false,
    authHealth: false,
    directFetch: false,
    phoneAuthTest: false,
  };
  
  // Test 1: Basic connection
  try {
    console.log('\n1️⃣ Testing basic connection...');
    const { data, error } = await supabase.from('test_table_that_does_not_exist').select('*').limit(1);
    
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Basic connection works (table not found as expected)');
      results.basicConnection = true;
    } else if (!error) {
      console.log('✅ Basic connection works');
      results.basicConnection = true;
    } else {
      console.log('❌ Basic connection failed:', error.message);
    }
  } catch (error: any) {
    console.log('❌ Basic connection exception:', error.message);
  }
  
  // Test 2: Auth health check
  try {
    console.log('\n2️⃣ Testing auth health...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!error) {
      console.log('✅ Auth module is accessible');
      results.authHealth = true;
    } else {
      console.log('❌ Auth health check failed:', error.message);
    }
  } catch (error: any) {
    console.log('❌ Auth health exception:', error.message);
  }
  
  // Test 3: Direct fetch to Supabase
  try {
    console.log('\n3️⃣ Testing direct fetch to Supabase...');
    const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`;
    console.log('Testing URL:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Direct fetch works');
      results.directFetch = true;
    } else {
      console.log('❌ Direct fetch failed with status:', response.status);
    }
  } catch (error: any) {
    console.log('❌ Direct fetch exception:', error.message);
    console.log('Error type:', error.constructor.name);
    
    if (error.message === 'Network request failed') {
      console.log('🔍 This is a network/SSL issue. Possible causes:');
      console.log('- SSL certificate validation failing');
      console.log('- Network/firewall blocking HTTPS');
      console.log('- iOS App Transport Security blocking request');
    }
  }
  
  // Test 4: Phone auth configuration
  try {
    console.log('\n4️⃣ Testing phone auth...');
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: '+1234567890', // Invalid number to test
      options: {
        channel: 'sms',
        shouldCreateUser: false,
      }
    });
    
    if (error) {
      if (error.message.includes('Phone provider is not configured')) {
        console.log('⚠️  Phone auth not configured in Supabase');
      } else if (error.message.includes('Invalid phone')) {
        console.log('✅ Phone auth endpoint is reachable');
        results.phoneAuthTest = true;
      } else if (error.message.includes('Network request failed')) {
        console.log('❌ Network issue preventing phone auth');
      } else {
        console.log('❓ Unexpected error:', error.message);
      }
    }
  } catch (error: any) {
    console.log('❌ Phone auth test exception:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('- Basic Connection:', results.basicConnection ? '✅' : '❌');
  console.log('- Auth Health:', results.authHealth ? '✅' : '❌');
  console.log('- Direct Fetch:', results.directFetch ? '✅' : '❌');
  console.log('- Phone Auth:', results.phoneAuthTest ? '✅' : '❌');
  
  return results;
}

/**
 * Test raw network connectivity
 */
export async function testRawNetwork() {
  console.log('🌐 Testing raw network connectivity...');
  
  const tests = [
    { name: 'Google HTTP', url: 'http://www.google.com' },
    { name: 'Google HTTPS', url: 'https://www.google.com' },
    { name: 'Supabase', url: process.env.EXPO_PUBLIC_SUPABASE_URL! },
  ];
  
  for (const test of tests) {
    try {
      console.log(`\nTesting ${test.name}: ${test.url}`);
      const response = await fetch(test.url, {
        method: 'HEAD',
        cache: 'no-cache',
      });
      console.log(`✅ ${test.name}: Status ${response.status}`);
    } catch (error: any) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
}

/**
 * Direct test for phone authentication
 * Run this to diagnose network and configuration issues
 */
export async function testPhoneAuth(phoneNumber: string) {
  console.log('=== Starting Phone Auth Test ===');
  console.log('Phone number:', phoneNumber);
  console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
  
  try {
    // Test 1: Check if Supabase client exists
    console.log('\n1. Checking Supabase client...');
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }
    console.log('✅ Supabase client is initialized');
    
    // Test 2: Try a simple request first
    console.log('\n2. Testing basic Supabase connection...');
    const { error: pingError } = await supabase.from('_test_').select('*').limit(1);
    if (pingError && !pingError.message.includes('relation "_test_" does not exist')) {
      console.log('❌ Basic connection failed:', pingError.message);
      throw new Error('Cannot connect to Supabase. Check your network and URL.');
    }
    console.log('✅ Basic Supabase connection works');
    
    // Test 3: Check auth configuration
    console.log('\n3. Checking auth configuration...');
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Auth module is accessible');
    
    // Test 4: Attempt phone OTP
    console.log('\n4. Attempting to send OTP...');
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phoneNumber,
      options: {
        channel: 'sms',
        shouldCreateUser: true,
      }
    });
    
    if (error) {
      console.log('❌ OTP send failed:', error.message);
      console.log('Error details:', {
        status: error.status,
        name: error.name,
      });
      
      // Provide specific guidance based on error
      if (error.message.includes('Network request failed')) {
        console.log('\n🔍 Network Issue Detected:');
        console.log('- Check your internet connection');
        console.log('- If using a VPN, try disabling it');
        console.log('- Check if Supabase URL is accessible in browser');
        console.log('- Metro bundler might need restart: npx expo start -c');
      } else if (error.message.includes('Phone provider is not configured')) {
        console.log('\n⚙️ Configuration Issue:');
        console.log('1. Go to Supabase Dashboard > Authentication > Providers');
        console.log('2. Enable "Phone" provider');
        console.log('3. Configure SMS provider (Twilio/MessageBird)');
        console.log('4. For testing, you can use Twilio trial account');
      }
      
      throw error;
    }
    
    console.log('✅ OTP sent successfully!');
    console.log('Response:', data);
    
    return { success: true, data };
    
  } catch (error: any) {
    console.log('\n❌ Test failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Alternative: Test with email auth to verify general auth works
 */
export async function testEmailAuth(email: string, password: string) {
  console.log('=== Testing Email Auth ===');
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Email auth failed:', error.message);
      return { success: false, error };
    }
    
    console.log('✅ Email auth successful');
    return { success: true, data };
    
  } catch (error: any) {
    console.log('❌ Email auth error:', error.message);
    return { success: false, error };
  }
}