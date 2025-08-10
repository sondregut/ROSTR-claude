/**
 * Script to clear invalid local image paths from user profile
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.production' });

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://iiyoasqgwpbuijuagfmz.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeW9hc3Fnd3BidWlqdWFnZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTcxMDIsImV4cCI6MjA2OTM3MzEwMn0.L6TX1WYtZBZI_pLAAWoq49M1cmuZxzN6957ka6-KdnA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearInvalidImagePath() {
  console.log('🔍 Checking for invalid image paths...');
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please ensure you are logged in to the app first.');
      console.log('ℹ️  You may need to use the service role key for this script.');
      return;
    }
    
    console.log(`✅ Authenticated as: ${user.email}`);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, username, image_uri')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return;
    }
    
    console.log(`Found profile for ${profile.username}`);
    console.log(`Current image_uri: ${profile.image_uri}`);
    
    // Check if image_uri is invalid (not a proper URL)
    if (profile.image_uri && !profile.image_uri.startsWith('http')) {
      console.log('❌ Invalid image path detected!');
      
      // Clear the invalid path
      const { error: updateError } = await supabase
        .from('users')
        .update({ image_uri: null })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('❌ Failed to clear image path:', updateError);
      } else {
        console.log('✅ Invalid image path cleared successfully');
        console.log('📸 Please upload a new profile photo in the app');
      }
    } else if (profile.image_uri) {
      console.log('✅ Image URI is valid');
    } else {
      console.log('ℹ️  No image URI set');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
  
  process.exit(0);
}

// Run the script
clearInvalidImagePath();