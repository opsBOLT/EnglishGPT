/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a8a0f3', // Main brand color
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          purple: '#a8a0f3',
          pink: '#ec4899',
          blue: '#3b82f6',
          green: '#10b981',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #a8a0f3 0%, #8b5cf6 100%)',
        'gradient-card': 'linear-gradient(135deg, #f5f3ff 0%, #ffffff 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(168, 160, 243, 0.1), 0 10px 20px -2px rgba(168, 160, 243, 0.05)',
        'card': '0 4px 20px -2px rgba(168, 160, 243, 0.15)',
        'card-hover': '0 8px 30px -4px rgba(168, 160, 243, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
