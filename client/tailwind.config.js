/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kingsley: {
          50: '#f5f7fb',
          100: '#e7ecf6',
          500: '#3854a4',
          600: '#2d4789',
          700: '#243a6f',
          900: '#172347',
        },
      },
    },
  },
  plugins: [],
};
