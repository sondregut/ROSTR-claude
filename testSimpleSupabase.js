// Simple test to verify Supabase connection with standard client
import { supabase } from './lib/supabase.ts';

async function testSimpleConnection() {
  console.log('\n🧪 Testing Simple Supabase Connection...\n');
  
  try {
    // Test 1: Auth Health Check
    console.log('1️⃣ Testing Auth Endpoint...');
    const { data: session, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth failed:', authError.message);
    } else {
      console.log('✅ Auth endpoint works!');
      console.log('Session:', session ? 'Active' : 'None');
    }
    
    // Test 2: Database Query
    console.log('\n2️⃣ Testing Database Query...');
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error hint:', error.hint);
    } else {
      console.log('✅ Database query works!');
      console.log('Response:', data);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n✅ Test complete\n');
}

// Run the test
testSimpleConnection();