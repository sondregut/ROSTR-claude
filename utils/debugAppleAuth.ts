import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { isDevelopment } from '@/config/env';

export async function debugAppleAuth() {
  if (!isDevelopment) {
    console.warn('Debug functions are disabled in production');
    return;
  }
  
  console.log('\n=== DEBUGGING APPLE AUTH ===\n');
  
  // 1. Check availability
  const isAvailable = await AppleAuthentication.isAvailableAsync();
  console.log('1. Apple Auth Available:', isAvailable);
  
  if (!isAvailable) {
    console.log('❌ Apple Auth not available on this device');
    return;
  }
  
  try {
    // 2. Try to get credential
    console.log('2. Requesting Apple credential...');
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    
    console.log('3. Credential received:');
    console.log('   - User ID:', credential.user);
    console.log('   - Email:', credential.email || 'Not provided');
    console.log('   - Identity Token:', credential.identityToken ? `${credential.identityToken.substring(0, 50)}...` : 'MISSING');
    console.log('   - Authorization Code:', credential.authorizationCode ? 'Present' : 'Missing');
    
    if (!credential.identityToken) {
      console.log('❌ No identity token received from Apple');
      return;
    }
    
    // 3. Test Supabase exchange
    console.log('\n4. Testing Supabase token exchange...');
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
      console.log('   Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Success! User:', data.user?.id);
    }
    
  } catch (error: any) {
    console.log('\n❌ Error during Apple Auth:');
    console.log('   Code:', error.code);
    console.log('   Message:', error.message);
    console.log('   Full error:', JSON.stringify(error, null, 2));
  }
  
  console.log('\n=== END DEBUG ===\n');
}