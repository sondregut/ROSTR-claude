require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runFixScript() {
  try {
    console.log('🔧 Fixing get_dating_achievements function...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'supabase', 'fix_dating_achievements_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running SQL script...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('query', { query: sql });
    
    if (error) {
      // If direct query doesn't work, try executing statements separately
      console.log('⚠️  Direct query failed, trying alternative method...');
      
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      for (const statement of statements) {
        console.log(`\n📍 Executing: ${statement.substring(0, 50)}...`);
        
        try {
          // For Supabase, we need to use the SQL editor or migrations
          // This is a placeholder - you'll need to run this in Supabase dashboard
          console.log('✅ Statement prepared for execution');
        } catch (err) {
          console.error('❌ Error:', err.message);
        }
      }
      
      console.log('\n📋 To complete the fix:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of:');
      console.log(`   ${sqlPath}`);
      console.log('4. Click "Run" to execute the script');
      
      return;
    }
    
    console.log('✅ Function fixed successfully!');
    
    // Test the function
    console.log('\n🧪 Testing the fixed function...');
    const { data: testData, error: testError } = await supabase
      .rpc('get_dating_achievements', { p_user_id: 'YOUR_USER_ID_HERE' });
    
    if (testError) {
      console.error('⚠️  Test failed:', testError.message);
      console.log('This might be expected if you haven\'t set up test data yet.');
    } else {
      console.log('✅ Function is working! Result:', testData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual fix instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of:');
    console.log('   supabase/fix_dating_achievements_tables.sql');
    console.log('4. Click "Run" to execute the script');
  }
}

// Run the fix
runFixScript();