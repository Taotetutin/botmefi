/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate(-50%, 0px)' },
          '50%': { transform: 'translate(-50%, -10px)' }
        },
        hover: {
          '0%, 100%': { transform: 'skew(-2deg)' },
          '50%': { transform: 'skew(2deg)' }
        },
        blink: {
          '0%, 90%, 100%': { transform: 'scaleY(1)' },
          '95%': { transform: 'scaleY(0.1)' }
        },
        shadow: {
          '0%, 100%': { transform: 'translate(-50%, 0) scale(1)', opacity: '0.2' },
          '50%': { transform: 'translate(-50%, 0) scale(0.8)', opacity: '0.15' }
        }
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        hover: 'hover 3s ease-in-out infinite',
        blink: 'blink 4s ease-in-out infinite',
        shadow: 'shadow 3s ease-in-out infinite'
      }
    },
  },
  plugins: [],
};