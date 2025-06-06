// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // Tambahkan ini
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        '4xl': '2rem',
      },
      colors: {
        // Anda bisa definisikan palet warna dark mode di sini jika perlu
        'background-primary': '#121212',
        'background-secondary': '#1E1E1E',
        'text-primary': '#E0E0E0',
        'text-secondary': '#B3B3B3',
      },
    },
  },
  plugins: [],
}