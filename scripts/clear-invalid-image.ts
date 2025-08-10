/**
 * Script to clear invalid local image paths from user profile
 */

import { supabase } from '../lib/supabase';

async function clearInvalidImagePath() {
  console.log('🔍 Checking for invalid image paths...');
  
  try {
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError);
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
        console.log('📸 Please upload a new profile photo');
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