import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  
  optimizeDeps: {
    include: ['react-is', 'recharts', 'lucide-react']
  },
  
  resolve: {
    alias: {
      'react-is': 'react-is'
    }
  }
});
