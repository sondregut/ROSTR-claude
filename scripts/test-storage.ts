import { supabase } from '../lib/supabase';

async function testStorageSetup() {
  console.log('🔍 Testing Supabase Storage Setup...\n');

  try {
    // 1. Check authentication
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated:', authError?.message || 'No user found');
      console.log('💡 Make sure you are logged in before uploading photos');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
    console.log('');

    // 2. List storage buckets
    console.log('2️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      console.log('💡 This might mean storage is not enabled in your Supabase project');
      return;
    }

    console.log('📦 Available buckets:');
    buckets?.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    console.log('');

    // 3. Check specific buckets we need
    const requiredBuckets = ['user-photos', 'date-entry-images', 'chat-media'];
    const existingBuckets = buckets?.map(b => b.name) || [];
    
    console.log('3️⃣ Checking required buckets...');
    requiredBuckets.forEach(bucketName => {
      if (existingBuckets.includes(bucketName)) {
        console.log(`   ✅ ${bucketName} exists`);
      } else {
        console.log(`   ❌ ${bucketName} is MISSING`);
      }
    });
    console.log('');

    // 4. Test upload permissions
    console.log('4️⃣ Testing upload permissions...');
    const testBucket = 'user-photos';
    
    if (existingBuckets.includes(testBucket)) {
      // Create a simple test file
      const testContent = new Blob(['test'], { type: 'text/plain' });
      const testFileName = `${user.id}/test_${Date.now()}.txt`;
      
      console.log(`   Attempting to upload to ${testBucket}/${testFileName}...`);
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(testBucket)
        .upload(testFileName, testContent, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error(`   ❌ Upload failed:`, uploadError.message);
        console.log(`   💡 This might mean:`);
        console.log(`      - The bucket doesn't have proper RLS policies`);
        console.log(`      - Your user doesn't have permission to upload`);
        console.log(`      - The bucket is not configured correctly`);
      } else {
        console.log(`   ✅ Upload successful!`);
        console.log(`   📄 File path:`, uploadData.path);
        
        // Try to get public URL
        const { data: urlData } = supabase.storage
          .from(testBucket)
          .getPublicUrl(uploadData.path);
        
        console.log(`   🔗 Public URL:`, urlData.publicUrl);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from(testBucket)
          .remove([testFileName]);
        
        if (!deleteError) {
          console.log(`   🧹 Test file cleaned up`);
        }
      }
    } else {
      console.log(`   ⚠️  Cannot test upload - ${testBucket} bucket doesn't exist`);
    }
    
    console.log('\n📋 Summary:');
    console.log('   - Make sure all required buckets exist in Supabase dashboard');
    console.log('   - Run the SQL scripts in supabase/ folder to set up policies');
    console.log('   - Ensure RLS is enabled on storage.objects table');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testStorageSetup();