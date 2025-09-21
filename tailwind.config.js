/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Habilitar modo escuro
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'whatsapp-green': '#25D366',
        'whatsapp-teal': '#075E54',
        'whatsapp-light': '#DCF8C6',
        'institutional-blue': '#34B7F1',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
