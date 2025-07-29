#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing environment variables:');
  if (!supabaseUrl) console.error('- EXPO_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceRoleKey) console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createBuckets() {
  const buckets = [
    {
      id: 'user-photos',
      name: 'user-photos',
      public: true,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    },
    {
      id: 'date-entry-images',
      name: 'date-entry-images',
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    },
    {
      id: 'chat-media',
      name: 'chat-media',
      public: false,
      fileSizeLimit: 20971520, // 20MB
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
    }
  ];

  console.log('🚀 Setting up storage buckets...\n');

  for (const bucket of buckets) {
    try {
      // Check if bucket exists
      const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error(`❌ Error listing buckets:`, listError);
        continue;
      }

      const bucketExists = existingBuckets?.some(b => b.id === bucket.id);

      if (bucketExists) {
        console.log(`✅ Bucket "${bucket.id}" already exists`);
        
        // Update bucket configuration
        const { error: updateError } = await supabase.storage.updateBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (updateError) {
          console.error(`❌ Error updating bucket "${bucket.id}":`, updateError);
        } else {
          console.log(`   Updated configuration`);
        }
      } else {
        // Create new bucket
        const { data, error: createError } = await supabase.storage.createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.fileSizeLimit,
          allowedMimeTypes: bucket.allowedMimeTypes
        });

        if (createError) {
          console.error(`❌ Error creating bucket "${bucket.id}":`, createError);
        } else {
          console.log(`✅ Created bucket "${bucket.id}"`);
          console.log(`   Public: ${bucket.public}`);
          console.log(`   Size limit: ${bucket.fileSizeLimit / 1024 / 1024}MB`);
        }
      }
    } catch (error) {
      console.error(`❌ Unexpected error with bucket "${bucket.id}":`, error);
    }
  }

  console.log('\n📦 Storage bucket setup complete!');
  console.log('\nNext steps:');
  console.log('1. Run the storage policies SQL in Supabase SQL Editor');
  console.log('2. Test file uploads in your app');
}

createBuckets().catch(console.error);