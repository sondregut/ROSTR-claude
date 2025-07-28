// Utility to test SSL connection to Supabase
// This helps diagnose SSL certificate issues

import { Platform } from 'react-native';
import { diagnoseNetworkIssue, testNetworkConnectivity } from './networkConfig';
import { supabase } from '@/lib/supabase';

export async function testSupabaseSSLConnection() {
  console.log('🔍 Testing Supabase SSL connection...');
  console.log('====================================');
  console.log('Platform:', Platform.OS);
  console.log('Development mode:', __DEV__ ? 'Yes' : 'No');
  
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('❌ Supabase URL not configured');
    return false;
  }
  
  // Test 1: Basic connectivity to Supabase URL
  console.log('\n📡 Test 1: Basic connectivity');
  const basicTest = await testNetworkConnectivity(supabaseUrl);
  console.log('Result:', JSON.stringify(basicTest, null, 2));
  
  // Test 2: Diagnose any network issues
  console.log('\n🔬 Test 2: Network diagnosis');
  const diagnosis = await diagnoseNetworkIssue(supabaseUrl);
  
  // Test 3: Direct fetch test
  console.log('\n🌐 Test 3: Direct fetch test');
  try {
    const testUrl = `${supabaseUrl}/auth/v1/health`;
    console.log('Testing URL:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('✅ Direct fetch successful');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
  } catch (fetchError) {
    console.error('❌ Direct fetch failed:', fetchError.message);
    console.error('Error type:', fetchError.constructor.name);
  }
  
  // Test 4: Try a simple Supabase query
  console.log('\n📊 Test 4: Supabase database query');
  console.log('Testing with proper apikey header...');
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database query failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      // If it's the apikey error, provide specific guidance
      if (error.message.includes('No API key found')) {
        console.error('\n⚠️  API Key Issue Detected!');
        console.error('The apikey header is not being sent with database requests.');
        console.error('Check the fetch logs above to see if headers are being passed correctly.');
      }
    } else {
      console.log('✅ Database query successful');
      console.log('Response:', data ? 'Data received' : 'No data');
    }
  } catch (queryError) {
    console.error('❌ Database query exception:', queryError.message);
    console.error('Stack:', queryError.stack);
  }
  
  // Test 5: Auth endpoint
  console.log('\n🔐 Test 5: Auth endpoint');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Auth check failed:', error.message);
    } else {
      console.log('✅ Auth endpoint accessible');
      console.log('Session:', data.session ? 'Active' : 'None');
    }
  } catch (authError) {
    console.error('❌ Auth check exception:', authError.message);
  }
  
  console.log('\n====================================');
  console.log('🏁 SSL connection test complete');
  
  // Show recommendations
  if (basicTest.isSSLError || diagnosis.connectivity?.isSSLError) {
    console.log('\n⚠️  SSL Issues Detected');
    console.log('Recommendations:');
    console.log('1. The SSL bypass has been updated and should handle these errors');
    console.log('2. Try restarting the Metro bundler with: npx expo start -c');
    console.log('3. If issues persist, check your network connection');
    console.log('4. Ensure your Supabase project is accessible');
  } else {
    console.log('\n✅ No SSL issues detected');
  }
  
  return !diagnosis.connectivity?.isSSLError;
}

// Function to manually trigger SSL test
export async function runSSLDiagnostics() {
  console.log('🚀 Running comprehensive SSL diagnostics...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    environment: __DEV__ ? 'development' : 'production',
    tests: [],
  };
  
  // Test different Supabase endpoints
  const endpoints = [
    { name: 'Main URL', url: process.env.EXPO_PUBLIC_SUPABASE_URL },
    { name: 'Auth', url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health` },
    { name: 'Rest API', url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/` },
  ];
  
  for (const endpoint of endpoints) {
    if (!endpoint.url) continue;
    
    console.log(`\n🔍 Testing ${endpoint.name}: ${endpoint.url}`);
    const result = await diagnoseNetworkIssue(endpoint.url);
    results.tests.push({
      endpoint: endpoint.name,
      url: endpoint.url,
      ...result,
    });
  }
  
  console.log('\n📋 Full diagnostic results:', JSON.stringify(results, null, 2));
  
  // Provide recommendations
  console.log('\n💡 Recommendations:');
  
  const hasSSLIssues = results.tests.some(test => test.connectivity?.isSSLError);
  
  if (hasSSLIssues) {
    console.log('⚠️  SSL certificate issues detected');
    if (__DEV__) {
      console.log('✅ SSL bypass is enabled for development');
      console.log('✅ Requests should automatically retry with relaxed SSL settings');
    } else {
      console.log('❌ SSL issues in production - please check server certificates');
    }
  } else {
    console.log('✅ No SSL issues detected');
  }
  
  return results;
}