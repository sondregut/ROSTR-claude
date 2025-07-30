#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment from .env file manually
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRosterColumns() {
  try {
    console.log('🚀 Adding roster support columns to date_entries table...');
    
    // First, let's check the current table structure
    console.log('📋 Checking current table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('date_entries')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error checking table:', tableError);
      return;
    }
    
    console.log('✅ Table exists');
    
    // Since we can't execute DDL directly through the client, 
    // let's provide instructions for manual execution
    console.log('\n📝 Please run the following SQL commands in your Supabase SQL editor:');
    console.log('='.repeat(80));
    console.log(`
-- Add entry_type column to distinguish between date entries and roster additions
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS entry_type VARCHAR(50) DEFAULT 'date' 
CHECK (entry_type IN ('date', 'roster_addition'));

-- Add roster_info column to store roster-specific information
ALTER TABLE date_entries 
ADD COLUMN IF NOT EXISTS roster_info JSONB;

-- Update existing entries to have the default entry_type
UPDATE date_entries 
SET entry_type = 'date' 
WHERE entry_type IS NULL;

-- Create an index on entry_type for better query performance
CREATE INDEX IF NOT EXISTS idx_date_entries_entry_type ON date_entries(entry_type);
    `);
    console.log('='.repeat(80));
    console.log('\n🌐 Go to: ' + supabaseUrl.replace('//', '//').replace('.co', '.co/project/_/sql'));
    console.log('📋 Copy and paste the SQL commands above');
    console.log('▶️  Click "Run" to execute the migration\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

addRosterColumns();