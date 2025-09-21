import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react-is', 'recharts']
  },
  
  resolve: {
    alias: {
      'react-is': 'react-is'
    }
  }
});
