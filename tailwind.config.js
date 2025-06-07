// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
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
        'background-primary': '#121212',
        'background-secondary': '#1E1E1E',
        'text-primary': '#E0E0E0',
        'text-secondary': '#B3B3B3',
      },
    },
  },
  plugins: [],
}