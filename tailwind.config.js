/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#fdf6f0',
          100: '#f9e9dd',
          200: '#f3d3bb',
          300: '#eab794',
          400: '#df9568',
          500: '#d47a4a',
          600: '#b85f3a',
          700: '#964c32',
          800: '#7a3d2b',
          900: '#633226',
        }
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
} 