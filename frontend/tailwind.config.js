/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#e50914',
          hover: '#f40b17',
          dark: '#b80710',
        },
        dark: {
          bg: '#0b0f19',
          card: '#161d30',
          border: '#232d45',
          text: '#f3f4f6',
          muted: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
