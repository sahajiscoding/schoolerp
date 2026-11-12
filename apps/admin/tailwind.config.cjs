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
        forest: {
          950: '#0D1E17',
          900: '#12271E',
          800: '#173027',
          DEFAULT: '#173027',
        },
        parchment: '#ECE8DC',
        paper: '#FCFAF4',
        gold: '#E4CF83',
        moss: '#6D7D42',
        ink: '#172219',
        muted: '#5E6B62',
        border: 'rgba(28, 43, 32, 0.12)',
        olive: '#6D7D42',
        terracotta: '#A94F36',
        sand: '#ECE8DC',
        cream: '#FCFAF4',
      },
      fontFamily: {
        display: ['Newsreader Variable', 'Newsreader', 'Georgia', 'serif'],
        sans: ['Manrope Variable', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        heritage: '14px',
        editorial: '20px',
      },
      boxShadow: {
        card: '0 10px 35px rgba(13, 30, 23, 0.07)',
        lift: '0 18px 50px rgba(13, 30, 23, 0.13)',
        rail: '18px 0 48px rgba(13, 30, 23, 0.12)',
      },
      keyframes: {
        reveal: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        reveal: 'reveal 280ms cubic-bezier(0.23, 1, 0.32, 1) both',
        'dialog-in': 'dialog-in 220ms cubic-bezier(0.23, 1, 0.32, 1) both',
      },
    },
  },
  plugins: [],
};
