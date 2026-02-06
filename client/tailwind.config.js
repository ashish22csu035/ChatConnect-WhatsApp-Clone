/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#25D366',
        secondary: '#128C7E',
        dark: '#075E54',
        light: '#DCF8C6',
        gray: {
          50: '#F0F2F5',
          100: '#E5E7EB',
          800: '#1F2937',
          900: '#111827'
        }
      }
    },
  },
  plugins: [],
}