import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import { isDevelopment } from '@/config/env';

export async function debugSupabaseConnection() {
  if (!isDevelopment) {
    console.warn('Debug functions are disabled in production');
    return;
  }
  
  console.log('🔍 Starting Supabase debug...');
  
  try {
    // 1. Check environment variables
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log('📋 Environment variables:');
    console.log('- URL:', url ? `${url.substring(0, 30)}...` : 'NOT SET');
    console.log('- Anon Key:', anonKey ? `${anonKey.substring(0, 20)}...` : 'NOT SET');
    
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    // 2. Test basic connection
    console.log('\n🔌 Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.log('❌ Basic connection failed:', healthError);
    } else {
      console.log('✅ Basic connection successful');
    }
    
    // 3. Check auth settings
    console.log('\n🔐 Checking auth configuration...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log('❌ Session check failed:', sessionError);
    } else {
      console.log('✅ Session check successful:', session ? 'Active session' : 'No active session');
    }
    
    // 4. Test phone auth specifically
    console.log('\n📱 Testing phone auth endpoint...');
    try {
      // First test with a test number to check endpoint
      const testPhone = '+1234567890'; // Invalid number to test error response
      const { error: phoneError } = await supabase.auth.signInWithOtp({
        phone: testPhone,
        options: {
          channel: 'sms',
          shouldCreateUser: false,
        }
      });
      
      if (phoneError) {
        console.log('📱 Phone auth error (expected):', phoneError.message);
        console.log('📱 Error details:', {
          status: phoneError.status,
          name: phoneError.name,
          stack: phoneError.stack?.substring(0, 200)
        });
        
        // Check if it's a network error or a validation error
        if (phoneError.message.includes('Network request failed')) {
          console.log('❌ Network connectivity issue detected');
          console.log('🔍 Possible causes:');
          console.log('   - No internet connection');
          console.log('   - Firewall blocking requests');
          console.log('   - Incorrect Supabase URL');
          console.log('   - CORS issues (if running in browser)');
        } else if (phoneError.message.includes('Invalid phone')) {
          console.log('✅ Phone auth endpoint is reachable');
        } else if (phoneError.message.includes('Phone provider is not configured')) {
          console.log('⚠️  Phone provider not configured in Supabase');
          console.log('   - Go to Supabase Dashboard > Authentication > Providers');
          console.log('   - Enable Phone provider');
          console.log('   - Configure SMS provider (Twilio, MessageBird, etc.)');
        } else if (phoneError.message.includes('Phone Auth is disabled')) {
          console.log('⚠️  Phone authentication is disabled');
          console.log('   - Enable it in Supabase Dashboard > Authentication > Providers');
        }
      }
    } catch (e: any) {
      console.log('❌ Phone auth test exception:', e);
      console.log('Exception details:', {
        message: e.message,
        name: e.name,
        stack: e.stack?.substring(0, 200)
      });
    }
    
    // 5. Test direct fetch to Supabase URL
    console.log('\n🌐 Testing direct network connection...');
    try {
      const testUrl = `${url}/auth/v1/health`;
      console.log('Testing URL:', testUrl);
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey || '',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Response status:', response.status);
      if (response.ok) {
        console.log('✅ Direct network connection successful');
      } else {
        console.log('❌ Direct connection failed with status:', response.status);
      }
    } catch (fetchError: any) {
      console.log('❌ Direct fetch failed:', fetchError.message);
      console.log('This suggests a network connectivity issue');
    }
    
    // 6. Return summary
    const summary = {
      environmentVarsSet: !!(url && anonKey),
      basicConnectionWorks: !healthError,
      authConfigured: !sessionError,
      phoneAuthStatus: 'unknown',
      recommendation: '',
    };
    
    if (!summary.environmentVarsSet) {
      summary.recommendation = 'Check your .env file and ensure variables are loaded';
    } else if (!summary.basicConnectionWorks) {
      summary.recommendation = 'Check your Supabase URL and network connection. Try restarting Metro bundler with: npx expo start -c';
    } else {
      summary.recommendation = 'Check Supabase dashboard for phone auth settings:\n1. Go to Authentication > Providers\n2. Enable Phone provider\n3. Configure SMS provider (Twilio, MessageBird, etc.)';
    }
    
    console.log('\n📊 Debug Summary:', summary);
    console.log('\n💡 Quick fixes to try:');
    console.log('1. Restart Metro bundler: npx expo start -c');
    console.log('2. Check if you can access your Supabase URL in a browser');
    console.log('3. Disable VPN if you\'re using one');
    console.log('4. Check Supabase dashboard for any issues');
    
    return summary;
    
  } catch (error) {
    console.error('🚨 Debug error:', error);
    throw error;
  }
}

// Helper to check if phone auth is enabled in Supabase
export function getSupabasePhoneAuthInstructions() {
  return `
📱 To enable SMS/Phone authentication in Supabase:

1. Go to your Supabase Dashboard
2. Navigate to Authentication > Providers
3. Enable "Phone" provider
4. Configure SMS settings:
   - Choose a provider (Twilio, MessageBird, etc.)
   - Add your API credentials
   - Set up phone number verification

5. For testing, you can use:
   - Twilio trial account (free)
   - Test mode in Supabase (no actual SMS sent)

6. Common issues:
   - Phone auth not enabled
   - SMS provider not configured
   - Invalid phone number format
   - Rate limiting on SMS sends
   - Network/firewall blocking requests
`;
}

// Alternative authentication method for testing
export async function testEmailAuth(email: string, password: string) {
  try {
    console.log('📧 Testing email authentication...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.log('❌ Email auth error:', error);
      return { success: false, error };
    }
    
    console.log('✅ Email auth successful:', data.user?.email);
    return { success: true, data };
    
  } catch (error) {
    console.error('🚨 Email auth exception:', error);
    return { success: false, error };
  }
}