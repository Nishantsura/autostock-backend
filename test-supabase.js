require('dotenv/config');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key length:', supabaseKey ? supabaseKey.length : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('_prisma_migrations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Connection test result:', error.message);
      console.log('✅ Supabase client created successfully');
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('✅ Database is accessible');
    }
  } catch (err) {
    console.log('⚠️  Connection test result:', err.message);
    console.log('✅ Supabase client created successfully');
  }
}

testConnection();
