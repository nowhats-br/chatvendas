import { createClient } from '@supabase/supabase-js';

// Test Supabase connection with your actual credentials
const supabaseUrl = "https://fwhcgliitnhcbtlcxnif.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aGNnbGlpdG5oY2J0bGN4bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDc1NjIsImV4cCI6MjA3NDA4MzU2Mn0.UxsTf3vRqqpG2hDhBT7j_KHw-PbE0iuc_aymyOBhu28";

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    
    // Test 1: Health check
    console.log('Test 1: Health check...');
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    console.log('Health check status:', healthResponse.status);
    if (healthResponse.ok) {
      console.log('✅ Health check passed');
    } else {
      console.log('❌ Health check failed:', await healthResponse.text());
      return false;
    }
    
    // Test 2: Basic query
    console.log('Test 2: Basic query...');
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Basic query failed:', error);
      return false;
    }
    
    console.log('✅ Basic query successful!');
    console.log('Sample query result:', data);
    
    // Test 3: Auth functionality
    console.log('Test 3: Testing auth functionality...');
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error('❌ Auth test failed:', authError);
      } else {
        console.log('✅ Auth test successful!');
        console.log('Session exists:', !!session);
      }
    } catch (authError) {
      console.error('❌ Auth test error:', authError);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Supabase connection error:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

async function testNetworkConnectivity() {
  console.log('\n=== Network Connectivity Tests ===');
  
  // Test DNS resolution
  try {
    console.log('Testing DNS resolution for Supabase...');
    const dns = await fetch(`https://cloudflare-dns.com/dns-query?name=${new URL(supabaseUrl).hostname}&type=A`, {
      headers: {
        'accept': 'application/dns-json'
      }
    });
    if (dns.ok) {
      console.log('✅ DNS resolution successful');
    } else {
      console.log('❌ DNS resolution failed');
    }
  } catch (error) {
    console.log('❌ DNS resolution error:', error);
  }
  
  // Test direct connection to Supabase
  try {
    console.log('Testing direct connection to Supabase...');
    const response = await fetch(supabaseUrl, { method: 'HEAD' });
    console.log('Direct connection status:', response.status);
    if (response.ok) {
      console.log('✅ Direct connection successful');
    } else {
      console.log('❌ Direct connection failed');
    }
  } catch (error) {
    console.log('❌ Direct connection error:', error);
  }
}

async function main() {
  console.log('=== Comprehensive Connection Test ===\n');
  
  // Test Supabase
  const success = await testSupabaseConnection();
  
  // Test network
  await testNetworkConnectivity();
  
  if (success) {
    console.log('\n✅ All tests passed! Supabase is configured correctly.');
  } else {
    console.log('\n❌ Tests failed. Please check your Supabase configuration and network connectivity.');
  }
  
  console.log('\n=== End of Test ===');
}

main();