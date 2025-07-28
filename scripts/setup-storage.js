#!/usr/bin/env node

/**
 * Automated Supabase Storage Bucket Setup Script
 * 
 * This script creates the required storage buckets for RostrDating app
 * using the Supabase JavaScript client library.
 * 
 * Required Environment Variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Service role key (not anon key!)
 * 
 * Usage:
 * npm run setup-storage
 * or
 * node scripts/setup-storage.js
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuration
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create admin client with service role key
let supabaseAdmin;

// Bucket configurations
const BUCKET_CONFIGS = [
  {
    id: 'user-photos',
    name: 'user-photos',
    public: true,
    file_size_limit: 5 * 1024 * 1024, // 5MB in bytes
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },
  {
    id: 'date-entry-images',
    name: 'date-entry-images', 
    public: true,
    file_size_limit: 10 * 1024 * 1024, // 10MB in bytes
    allowed_mime_types: ['image/jpeg', 'image/png', 'image/webp']
  },
  {
    id: 'chat-media',
    name: 'chat-media',
    public: false,
    file_size_limit: 20 * 1024 * 1024, // 20MB in bytes
    allowed_mime_types: [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/mov', 'video/avi'
    ]
  }
];

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Initialize Supabase admin client
 */
function initializeSupabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  return supabaseAdmin;
}

/**
 * Check if a bucket exists
 */
async function bucketExists(bucketName) {
  try {
    const { data, error } = await supabaseAdmin.storage.getBucket(bucketName);
    if (error && error.statusCode === '404') {
      return false;
    }
    return data !== null;
  } catch (error) {
    // If we can't determine, assume it doesn't exist
    return false;
  }
}

/**
 * Create a storage bucket
 */
async function createBucket(config) {
  console.log(`${colors.blue}Creating bucket: ${config.name}${colors.reset}`);
  
  try {
    // Check if bucket already exists
    const exists = await bucketExists(config.name);
    if (exists) {
      console.log(`${colors.yellow}  ⚠️  Bucket '${config.name}' already exists, skipping...${colors.reset}`);
      return true;
    }

    // Create the bucket using Supabase client
    const { data, error } = await supabaseAdmin.storage.createBucket(config.id, {
      public: config.public,
      fileSizeLimit: config.file_size_limit,
      allowedMimeTypes: config.allowed_mime_types
    });
    
    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    console.log(`${colors.green}  ✅ Successfully created bucket '${config.name}'${colors.reset}`);
    console.log(`${colors.blue}     - Public: ${config.public}${colors.reset}`);
    console.log(`${colors.blue}     - Size limit: ${(config.file_size_limit / 1024 / 1024).toFixed(0)}MB${colors.reset}`);
    console.log(`${colors.blue}     - MIME types: ${config.allowed_mime_types.join(', ')}${colors.reset}`);
    return true;
  } catch (error) {
    console.log(`${colors.red}  ❌ Failed to create bucket '${config.name}': ${error.message}${colors.reset}`);
    return false;
  }
}

/**
 * List all buckets to verify creation
 */
async function listBuckets() {
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      throw new Error(error.message);
    }
    return data || [];
  } catch (error) {
    console.log(`${colors.red}Failed to list buckets: ${error.message}${colors.reset}`);
    return [];
  }
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const missing = [];
  
  if (!SUPABASE_URL) {
    missing.push('EXPO_PUBLIC_SUPABASE_URL');
  }
  
  if (!SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  
  if (missing.length > 0) {
    console.log(`${colors.red}${colors.bold}Missing required environment variables:${colors.reset}`);
    missing.forEach(variable => {
      console.log(`${colors.red}  - ${variable}${colors.reset}`);
    });
    console.log(`\n${colors.yellow}Please add these to your .env file:${colors.reset}`);
    console.log(`${colors.blue}EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co${colors.reset}`);
    console.log(`${colors.blue}SUPABASE_SERVICE_ROLE_KEY=your-service-role-key${colors.reset}`);
    console.log(`\n${colors.yellow}Note: You need the SERVICE ROLE key, not the anon key!${colors.reset}`);
    console.log(`${colors.yellow}Find it in: Supabase Dashboard > Settings > API > service_role${colors.reset}`);
    return false;
  }
  
  return true;
}

/**
 * Main execution function
 */
async function main() {
  console.log(`${colors.bold}${colors.blue}🚀 RostrDating Storage Bucket Setup${colors.reset}\n`);
  
  // Validate environment
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  // Initialize Supabase admin client
  try {
    initializeSupabaseAdmin();
    console.log(`${colors.green}✅ Environment variables validated${colors.reset}`);
    console.log(`${colors.green}✅ Supabase client initialized${colors.reset}`);
    console.log(`${colors.blue}📍 Supabase URL: ${SUPABASE_URL}${colors.reset}`);
    console.log(`${colors.blue}🔑 Service role key: ${SERVICE_ROLE_KEY.substring(0, 20)}...${colors.reset}\n`);
  } catch (error) {
    console.log(`${colors.red}❌ Failed to initialize Supabase client: ${error.message}${colors.reset}`);
    process.exit(1);
  }
  
  let successCount = 0;
  let totalBuckets = BUCKET_CONFIGS.length;
  
  // Create each bucket
  for (const config of BUCKET_CONFIGS) {
    const success = await createBucket(config);
    if (success) {
      successCount++;
    }
    console.log(''); // Add spacing between buckets
  }
  
  // Verify creation by listing buckets
  console.log(`${colors.bold}📋 Verification - Listing all buckets:${colors.reset}`);
  const buckets = await listBuckets();
  
  if (buckets.length > 0) {
    buckets.forEach(bucket => {
      const isOurBucket = BUCKET_CONFIGS.some(config => config.name === bucket.name);
      const icon = isOurBucket ? '✅' : '📦';
      console.log(`  ${icon} ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
    });
  } else {
    console.log(`${colors.yellow}  No buckets found or unable to retrieve list${colors.reset}`);
  }
  
  // Summary
  console.log(`\n${colors.bold}📊 Summary:${colors.reset}`);
  console.log(`${colors.green}✅ Successfully created: ${successCount}/${totalBuckets} buckets${colors.reset}`);
  
  if (successCount === totalBuckets) {
    console.log(`\n${colors.bold}${colors.green}🎉 All storage buckets created successfully!${colors.reset}`);
    console.log(`${colors.green}Your Supabase backend is now fully configured and ready to use.${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.bold}${colors.red}⚠️  Some buckets failed to create${colors.reset}`);
    console.log(`${colors.yellow}Please check the errors above and try again, or create them manually in the Supabase Dashboard.${colors.reset}`);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.log(`${colors.red}Unhandled Rejection at: ${promise}, reason: ${reason}${colors.reset}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.log(`${colors.red}Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.log(`${colors.red}Script failed: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}