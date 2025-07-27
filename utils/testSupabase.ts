import { supabase } from '@/lib/supabase';

/**
 * Test Supabase connection and basic functionality
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔧 Testing Supabase connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase
      .from('test')
      .select('*')
      .limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 is "relation does not exist"
      throw new Error(`Connection failed: ${error.message}`);
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Test 2: Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    console.log('👤 Current session:', session ? 'Authenticated' : 'Not authenticated');
    
    // Test 3: Test environment variables
    console.log('🔑 Environment variables loaded:');
    console.log('  - SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('  - SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    
    return {
      success: true,
      message: 'Supabase connection is working properly!'
    };
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Test real-time connection
 */
export async function testRealtimeConnection() {
  try {
    console.log('🔧 Testing Supabase real-time connection...');
    
    const channel = supabase
      .channel('test-channel')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('📡 Real-time test successful:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });
    
    // Send a test broadcast
    setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'test',
        payload: { message: 'Hello from real-time!' }
      });
    }, 1000);
    
    // Cleanup after 3 seconds
    setTimeout(() => {
      supabase.removeChannel(channel);
      console.log('🧹 Real-time test channel cleaned up');
    }, 3000);
    
    return {
      success: true,
      message: 'Real-time connection test initiated'
    };
    
  } catch (error) {
    console.error('❌ Real-time connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown real-time error'
    };
  }
}