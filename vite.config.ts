import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    include: ['react-is', 'recharts', 'lucide-react'],
    exclude: ['pg', 'pg-native']
  },
  
  build: {
    rollupOptions: {
      external: ['pg', 'pg-native']
    }
  },
  
  resolve: {
    alias: {
      'react-is': 'react-is'
    }
  },
  
  server: {
    host: true,
    port: 3000,
    strictPort: false,
    // Configure CORS for development
    cors: {
      origin: true,
      credentials: true
    }
  },
  
  preview: {
    host: true,
    port: 3000,
    strictPort: false,
    // Configure CORS for preview
    cors: {
      origin: true,
      credentials: true
    }
  },
  
  // ADDITIONAL CORS CONFIGURATION FOR PRODUCTION
  define: {
    global: 'globalThis',
  }
});