#!/usr/bin/env node

/**
 * Test script to check Supabase database connection and table existence
 * Run with: node scripts/test-database.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - EXPO_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing Supabase Database Connection...\n');
  
  try {
    // Test basic connection
    console.log('1. Testing basic connection...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(0);
    
    if (error) {
      console.error('❌ Basic connection failed:', error.message);
      return false;
    }
    console.log('✅ Basic connection successful');
    
    // Check required tables
    console.log('\n2. Checking required tables...');
    const requiredTables = [
      'users',
      'circles', 
      'circle_members',
      'messages',
      'typing_indicators',
      'circle_message_reads'
    ];
    
    for (const table of requiredTables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.error(`❌ Table '${table}' not accessible:`, tableError.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.error(`❌ Error checking table '${table}':`, err.message);
      }
    }
    
    // Test real-time capabilities
    console.log('\n3. Testing real-time capabilities...');
    try {
      const channel = supabase.channel('test-channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages'
        }, (payload) => {
          console.log('📡 Real-time test received:', payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Real-time subscription successful');
            setTimeout(() => {
              channel.unsubscribe();
              console.log('✅ Database test complete!\n');
            }, 2000);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Real-time subscription failed');
          }
        });
    } catch (realtimeError) {
      console.error('❌ Real-time test failed:', realtimeError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    return false;
  }
}

async function createTestData() {
  console.log('🏗️  Creating test data for chat...\n');
  
  try {
    // Create test user if doesn't exist
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User',
        username: 'testuser'
      });
    
    if (userError) {
      console.error('❌ Failed to create test user:', userError.message);
      return;
    }
    console.log('✅ Test user created/updated');
    
    // Create test circle
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        name: 'Test Circle',
        description: 'Test circle for chat functionality',
        owner_id: testUserId
      })
      .select()
      .single();
    
    if (circleError) {
      console.error('❌ Failed to create test circle:', circleError.message);
      return;
    }
    console.log('✅ Test circle created/updated');
    
    // Add user to circle
    const { error: memberError } = await supabase
      .from('circle_members')
      .upsert({
        circle_id: circle.id,
        user_id: testUserId,
        role: 'owner'
      });
    
    if (memberError) {
      console.error('❌ Failed to add user to circle:', memberError.message);
      return;
    }
    console.log('✅ User added to circle');
    
    console.log('\n✅ Test data setup complete!');
    console.log('🎯 You can now test chat functionality with:');
    console.log(`   - User ID: ${testUserId}`);
    console.log(`   - Circle ID: ${circle.id}`);
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error.message);
  }
}

// Run tests
async function main() {
  const dbConnected = await testDatabaseConnection();
  
  if (dbConnected) {
    await createTestData();
  } else {
    console.log('\n💡 To fix database issues:');
    console.log('1. Run the SQL schema files in Supabase SQL Editor:');
    console.log('   - supabase/schema.sql');
    console.log('   - supabase/rls_policies.sql'); 
    console.log('   - supabase/circle_chat_schema.sql');
    console.log('2. Enable Realtime for messages table in Supabase dashboard');
    console.log('3. Check your environment variables in .env file');
  }
  
  process.exit(0);
}

main().catch(console.error);