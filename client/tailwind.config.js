/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        cream: '#ffffff',
        charcoal: {
          DEFAULT: '#050505',
          50: '#fafafa',
          100: '#eeeeee',
          200: '#d6d6d6',
          300: '#b8b8b8',
          700: '#3d3d3d',
          800: '#242424',
          900: '#111111',
          950: '#050505',
        },
        gold: {
          DEFAULT: '#c9933a',
          light: '#ddb05c',
          dark:  '#805417',
          muted: '#f1e4ca',
        },
        blue: {
          DEFAULT: '#3b82f6',
          light:   '#60a5fa',
          dark:    '#2563eb',
          muted:   '#dbeafe',
          950:     '#172554',
        },
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
