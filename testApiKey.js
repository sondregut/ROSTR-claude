// Quick test script to verify apikey header is being sent
import { supabase } from './lib/supabase.ts';

async function testApiKey() {
  console.log('🔍 Testing API Key Header...\n');
  
  try {
    // Test 1: Simple database query
    console.log('📊 Test 1: Database Query');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.error('Error details:', error);
      
      if (error.message.includes('No API key found')) {
        console.error('\n⚠️  CRITICAL: API key header is missing!');
        console.error('This means the header is not being sent with REST API requests.');
      }
    } else {
      console.log('✅ Database query successful!');
      console.log('Data received:', data);
    }
    
    // Test 2: Auth check (should work)
    console.log('\n🔐 Test 2: Auth Check');
    const { data: session, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth check failed:', authError.message);
    } else {
      console.log('✅ Auth check successful');
      console.log('Session:', session ? 'Active' : 'None');
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
  
  console.log('\n✅ Test complete');
}

// Run the test
testApiKey();