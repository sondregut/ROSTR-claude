/**
 * Script to clean up stale/invalid image paths from roster entries
 * This removes old iOS container paths that no longer exist
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use hardcoded values
const supabaseUrl = 'https://iiyoasqgwpbuijuagfmz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpeW9hc3Fnd3BidWlqdWFnZm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTcxMDIsImV4cCI6MjA2OTM3MzEwMn0.L6TX1WYtZBZI_pLAAWoq49M1cmuZxzN6957ka6-KdnA';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Pattern to identify iOS container paths
const IOS_CONTAINER_PATTERN = /^file:\/\/.*\/Containers\/Data\/Application\/[A-F0-9-]+\//;
const OLD_CONTAINER_PATTERNS = [
  /^\/var\/mobile\/Containers\/Data\/Application\/[A-F0-9-]+\//,
  /^\/Users\/.*\/Library\/Developer\/CoreSimulator\/Devices\/.*\/data\/Containers\/Data\/Application\/[A-F0-9-]+\//
];

// Check if a file path is a stale iOS container path
function isStaleImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return false;
  
  // Check if it's an iOS container path
  if (IOS_CONTAINER_PATTERN.test(imagePath)) {
    return true; // These are always considered stale as they change between app launches
  }
  
  // Check old patterns
  for (const pattern of OLD_CONTAINER_PATTERNS) {
    if (pattern.test(imagePath)) {
      return true;
    }
  }
  
  // Check if it's a local file path that doesn't exist
  if (imagePath.startsWith('file://') || imagePath.startsWith('/')) {
    // For iOS, we can't check file existence from Node.js, so consider all local paths as potentially stale
    return true;
  }
  
  return false;
}

async function cleanupRosterImages() {
  console.log('🧹 Starting roster image cleanup...');
  
  try {
    // Get all roster entries with photos
    const { data: entries, error } = await supabase
      .from('roster_entries')
      .select('id, name, photos')
      .not('photos', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching roster entries:', error);
      return;
    }
    
    console.log(`Found ${entries?.length || 0} roster entries with photos`);
    
    let totalCleaned = 0;
    let entriesModified = 0;
    
    for (const entry of entries || []) {
      if (!entry.photos || !Array.isArray(entry.photos)) continue;
      
      const originalCount = entry.photos.length;
      const cleanedPhotos = entry.photos.filter(photo => !isStaleImagePath(photo));
      const removedCount = originalCount - cleanedPhotos.length;
      
      if (removedCount > 0) {
        console.log(`\n📸 ${entry.name}:`);
        console.log(`   Removed ${removedCount} stale image path(s)`);
        console.log(`   Remaining photos: ${cleanedPhotos.length}`);
        
        // Update the roster entry
        const { error: updateError } = await supabase
          .from('roster_entries')
          .update({ 
            photos: cleanedPhotos.length > 0 ? cleanedPhotos : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', entry.id);
        
        if (updateError) {
          console.error(`   ❌ Failed to update: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated successfully`);
          totalCleaned += removedCount;
          entriesModified++;
        }
      }
    }
    
    console.log(`\n✨ Cleanup complete!`);
    console.log(`   - Entries modified: ${entriesModified}`);
    console.log(`   - Total stale paths removed: ${totalCleaned}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Add a dry-run mode to preview what would be cleaned
async function previewCleanup() {
  console.log('👀 Preview mode - no changes will be made');
  
  try {
    const { data: entries, error } = await supabase
      .from('roster_entries')
      .select('id, name, photos')
      .not('photos', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching roster entries:', error);
      return;
    }
    
    let totalStale = 0;
    let affectedEntries = 0;
    
    for (const entry of entries || []) {
      if (!entry.photos || !Array.isArray(entry.photos)) continue;
      
      const stalePhotos = entry.photos.filter(photo => isStaleImagePath(photo));
      
      if (stalePhotos.length > 0) {
        console.log(`\n📸 ${entry.name}:`);
        console.log(`   Would remove ${stalePhotos.length} stale path(s):`);
        stalePhotos.forEach(path => {
          console.log(`   - ${path.substring(0, 50)}...`);
        });
        totalStale += stalePhotos.length;
        affectedEntries++;
      }
    }
    
    console.log(`\n📊 Preview summary:`);
    console.log(`   - Entries that would be modified: ${affectedEntries}`);
    console.log(`   - Total stale paths that would be removed: ${totalStale}`);
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
const isDryRun = process.argv.includes('--preview');
if (isDryRun) {
  previewCleanup().then(() => process.exit(0));
} else {
  console.log('💡 To preview changes without modifying data, run:');
  console.log('   node scripts/cleanup-roster-images.js --preview\n');
  
  cleanupRosterImages().then(() => process.exit(0));
}