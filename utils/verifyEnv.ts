/**
 * Verify environment variables are loaded correctly
 */
export function verifyEnvironmentVariables() {
  console.log('🔍 Verifying environment variables...');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('Environment check:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? `✅ ${supabaseUrl}` : '❌ Not set');
  console.log('- EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? `✅ ${supabaseKey.substring(0, 20)}...` : '❌ Not set');
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required environment variables. Please check your .env file.');
  }
  
  if (!supabaseUrl.startsWith('https://')) {
    throw new Error('Invalid Supabase URL format. Must start with https://');
  }
  
  if (!supabaseKey.startsWith('eyJ')) {
    throw new Error('Invalid Supabase anon key format. Must be a JWT token starting with eyJ');
  }
  
  console.log('✅ Environment variables verified successfully!');
  return true;
}