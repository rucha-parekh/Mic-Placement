/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43'
        },
        cream: {
          50: '#fffefb',
          100: '#fefcf6',
          200: '#fef9ed',
          300: '#fdf5e0',
          400: '#fcf0d1',
          500: '#faeab8',
          600: '#f7e09e',
          700: '#f4d580',
          800: '#f0c85c',
          900: '#ecba33'
        }
      },
      fontFamily: {
        santiago: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        bogota: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    }
  },
  plugins: []
};