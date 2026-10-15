/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          800: '#18334f',
          900: '#10243a',
          950: '#0a1929',
        },
      },
    },
  },
  plugins: [],
}
