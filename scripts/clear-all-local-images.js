/**
 * Script to clear ALL invalid local image paths from all user profiles
 * Run this with service role key for admin access
 */

const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values
const supabaseUrl = 'https://iiyoasqgwpbuijuagfmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeW9hc3Fnd3BidWlqdWFnZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTcxMDIsImV4cCI6MjA2OTM3MzEwMn0.L6TX1WYtZBZI_pLAAWoq49M1cmuZxzN6957ka6-KdnA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAllLocalImages() {
  console.log('🔍 Checking all users for invalid image paths...');
  
  try {
    // Get all users with image_uri
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, image_uri')
      .not('image_uri', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users with image URIs`);
    
    let fixedCount = 0;
    
    for (const user of users || []) {
      // Check if image_uri is invalid (not a proper URL)
      if (user.image_uri && !user.image_uri.startsWith('http')) {
        console.log(`\n❌ Invalid path for ${user.username}: ${user.image_uri}`);
        
        // Clear the invalid path
        const { error: updateError } = await supabase
          .from('users')
          .update({ image_uri: null })
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`   Failed to fix: ${updateError.message}`);
        } else {
          console.log(`   ✅ Cleared invalid path`);
          fixedCount++;
        }
      }
    }
    
    console.log(`\n✨ Fixed ${fixedCount} profiles with invalid image paths`);
    
    if (fixedCount > 0) {
      console.log('📸 Users need to upload new profile photos in the app');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
  
  process.exit(0);
}

// Run the script
clearAllLocalImages();