/**
 * Script to fix profiles with local file:// image URIs
 * These don't work in production and should be cleared
 */

import { supabase } from '../lib/supabase';

async function fixLocalImageUris() {
  console.log('🔍 Checking for profiles with local file:// image URIs...');
  
  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, image_uri');
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users to check`);
    
    let fixedCount = 0;
    
    for (const user of users || []) {
      if (user.image_uri && user.image_uri.startsWith('file://')) {
        console.log(`📸 Found local URI for user ${user.username}: ${user.image_uri}`);
        
        // Clear the local URI
        const { error: updateError } = await supabase
          .from('users')
          .update({ image_uri: null })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`❌ Failed to fix user ${user.username}:`, updateError);
        } else {
          console.log(`✅ Fixed user ${user.username} - cleared local URI`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} profiles with local image URIs`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixLocalImageUris();