/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#F3F6EC',
          100: '#E7ECD8',
          200: '#DCE6C4',
          300: '#B9C995',
          400: '#81945A',
          500: '#586A36',
          600: '#4B5E30',
          700: '#3F512A',
          800: '#354323',
          900: '#2F3D2A',
          DEFAULT: '#586A36',
        },
        'deep-olive': '#3F512A',
        leaf: '#DCE6C4',
        daylight: '#F7F2E8',
        paper: '#FFFEFA',
        terracotta: {
          50: '#FCF3EE',
          100: '#F7E5DA',
          200: '#F1D5C3',
          500: '#D97747',
          600: '#C8663A',
          700: '#A74E2A',
          DEFAULT: '#D97747',
        },
        clay: '#F1D5C3',
        ink: '#2F3D2A',
        muted: '#74806F',
        sand: '#F7F2E8',
        cream: '#FFFEFA',
      },
      fontFamily: {
        sans: ['"DM Sans Variable"', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces Variable"', 'Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        campus: '14px',
        story: '22px',
      },
      boxShadow: {
        daylight: '0 18px 48px rgba(63, 81, 42, 0.08)',
        card: '0 10px 30px rgba(63, 81, 42, 0.09)',
        lift: '0 20px 50px rgba(47, 61, 42, 0.16)',
      },
      keyframes: {
        'campus-reveal': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'campus-dialog': {
          from: { opacity: '0', transform: 'translateY(10px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'campus-reveal': 'campus-reveal 280ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'campus-dialog': 'campus-dialog 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
}
