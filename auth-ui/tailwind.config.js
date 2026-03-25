/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e6fff0',
          100: '#b3ffd6',
          200: '#80ffbd',
          300: '#4dffa3',
          400: '#1aff8a',
          500: '#00ed64',
          600: '#00c853',
          700: '#009940',
          800: '#006b2d',
          900: '#003d1a',
        },
        surface: {
          900: '#0b1117',
          800: '#111920',
          700: '#1c2a35',
          600: '#2d3d4a',
          500: '#3d4d5a',
          400: '#667788',
          300: '#889397',
          200: '#c1c7cd',
          100: '#e8edee',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'spin-slow': 'spin 1.5s linear infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
