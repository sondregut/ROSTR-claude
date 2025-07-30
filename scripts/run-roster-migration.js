#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running roster feed support migration...');
    
    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '../supabase/add_roster_feed_support.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Error executing statement:', error);
        throw error;
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Test the new columns
    console.log('🔍 Testing new columns...');
    const { data, error } = await supabase
      .from('date_entries')
      .select('entry_type, roster_info')
      .limit(1);
    
    if (error) {
      console.error('❌ Error testing columns:', error);
    } else {
      console.log('✅ New columns are working correctly');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();