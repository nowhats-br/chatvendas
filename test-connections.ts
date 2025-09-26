import { createClient } from '@supabase/supabase-js';

// Test Supabase connection
const supabaseUrl = "https://fwhcgliitnhcbtlcxnif.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3aGNnbGlpdG5oY2J0bGN4bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDc1NjIsImV4cCI6MjA3NDA4MzU2Mn0.UxsTf3vRqqpG2hDhBT7j_KHw-PbE0iuc_aymyOBhu28";

console.log('Testing Supabase connection...');
console.log('Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabase() {
  try {
    console.log('Attempting to connect to Supabase...');
    const { data, error } = await supabase.rpc('now');
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Current time from Supabase:', data);
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Test local services
async function testLocalServices() {
  const services = [
    { name: 'Baileys Service', url: 'http://localhost:3001' },
    { name: 'Web.js Service', url: 'http://localhost:3003' }
  ];
  
  for (const service of services) {
    try {
      console.log(`\nTesting ${service.name} at ${service.url}...`);
      // Simple fetch test with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log(`✅ ${service.name} is accessible! Status: ${response.status}`);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error(`❌ ${service.name} timed out - service may not be running`);
      } else {
        console.error(`❌ ${service.name} connection failed:`, error.message);
      }
    }
  }
}

async function main() {
  console.log('=== Connection Diagnostics ===\n');
  
  // Test Supabase
  await testSupabase();
  
  // Test local services
  await testLocalServices();
  
  console.log('\n=== End of Diagnostics ===');
}

main();