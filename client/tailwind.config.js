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
        cream: '#f8fafc',
        charcoal: {
          DEFAULT: '#1f2933',
          50: '#f6f7f8',
          100: '#e7eaee',
          200: '#cfd5dd',
          300: '#aeb8c4',
          400: '#7d8996',
          500: '#5f6b78',
          600: '#47515d',
          700: '#343d48',
          800: '#222a33',
          900: '#171d24',
          950: '#0f141a',
        },
        gold: {
          DEFAULT: '#8f5f19',
          light: '#d8ad5b',
          dark:  '#623d10',
          muted: '#f2e7d1',
        },
        blue: {
          DEFAULT: '#2563eb',
          light:   '#93c5fd',
          dark:    '#1d4ed8',
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
