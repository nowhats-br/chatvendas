import { createClient } from '@supabase/supabase-js';

// Test Supabase connection with your actual credentials
const supabaseUrl = "https://fwhcgliitnhcbtlcxnif.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aGNnbGlpdG5oY2J0bGN4bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDc1NjIsImV4cCI6MjA3NDA4MzU2Mn0.UxsTf3vRqqpG2hDhBT7j_KHw-PbE0iuc_aymyOBhu28";

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test a simple query instead of rpc('now')
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase query failed:', error);
      // Try to get more details about the error
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Sample query result:', data);
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

async function main() {
  console.log('=== Supabase Connection Test ===\n');
  
  // Test Supabase
  const success = await testSupabase();
  
  if (success) {
    console.log('\n✅ All tests passed! Supabase is configured correctly.');
  } else {
    console.log('\n❌ Tests failed. Please check your Supabase configuration.');
  }
  
  console.log('\n=== End of Test ===');
}

main();