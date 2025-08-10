/**
 * Script to check and optionally clear Supabase image URIs
 */

const { createClient } = require('@supabase/supabase-js');

// Use hardcoded values
const supabaseUrl = 'https://iiyoasqgwpbuijuagfmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeW9hc3Fnd3BidWlqdWFnZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTcxMDIsImV4cCI6MjA2OTM3MzEwMn0.L6TX1WYtZBZI_pLAAWoq49M1cmuZxzN6957ka6-KdnA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkImageUris() {
  console.log('🔍 Checking image URIs in database...');
  
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
    
    let supabaseUriCount = 0;
    let localUriCount = 0;
    
    for (const user of users || []) {
      if (user.image_uri.startsWith('http')) {
        supabaseUriCount++;
        console.log(`\n📸 ${user.username}: Supabase URL`);
        console.log(`   ${user.image_uri}`);
        
        // Check if it's a 0-byte file
        try {
          const response = await fetch(user.image_uri, { method: 'HEAD' });
          const contentLength = response.headers.get('content-length');
          if (contentLength === '0') {
            console.log(`   ⚠️  WARNING: This is a 0-byte file!`);
          } else {
            console.log(`   ✅ File size: ${contentLength} bytes`);
          }
        } catch (fetchError) {
          console.log(`   ❌ Failed to check file size`);
        }
      } else {
        localUriCount++;
        console.log(`\n📱 ${user.username}: Local URI`);
        console.log(`   ${user.image_uri}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   - Supabase URLs: ${supabaseUriCount}`);
    console.log(`   - Local URIs: ${localUriCount}`);
    
    if (supabaseUriCount > 0) {
      console.log('\n💡 To clear Supabase URLs and force local storage, run:');
      console.log('   node scripts/check-image-uris.js --clear-supabase');
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

async function clearSupabaseUris() {
  console.log('🧹 Clearing Supabase image URIs...');
  
  try {
    // Get all users with Supabase image URIs
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, image_uri')
      .not('image_uri', 'is', null)
      .like('image_uri', 'http%');
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return;
    }
    
    console.log(`Found ${users?.length || 0} users with Supabase URIs to clear`);
    
    let clearedCount = 0;
    
    for (const user of users || []) {
      console.log(`\n🗑️  Clearing ${user.username}'s Supabase URL...`);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ image_uri: null })
        .eq('id', user.id);
      
      if (updateError) {
        console.error(`   ❌ Failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Cleared`);
        clearedCount++;
      }
    }
    
    console.log(`\n✨ Cleared ${clearedCount} Supabase URLs`);
    console.log('📸 Users need to upload new profile photos in the app');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
const shouldClear = process.argv.includes('--clear-supabase');
if (shouldClear) {
  clearSupabaseUris().then(() => process.exit(0));
} else {
  checkImageUris().then(() => process.exit(0));
}