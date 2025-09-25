// Diagnostic tool to check authentication issues
console.log('=== ChatVendas Authentication Diagnostic ===');

// Check environment variables
console.log('Environment Variables:');
console.log('- VITE_SUPABASE_URL:', (import.meta as any).env?.VITE_SUPABASE_URL || 'NOT SET');
console.log('- VITE_SUPABASE_ANON_KEY:', (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('- VITE_NODE_ENV:', (import.meta as any).env?.VITE_NODE_ENV || 'NOT SET');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('Browser Environment:');
  console.log('- User Agent:', navigator.userAgent);
  console.log('- Online Status:', navigator.onLine);
  console.log('- Location:', window.location.href);
}

// Check if required modules are available
try {
  const supabaseModule = await import('./src/lib/supabase');
  console.log('Supabase Module: Loaded successfully');
} catch (error) {
  console.error('Supabase Module: Failed to load', error);
}

console.log('=== End Diagnostic ===');