/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        nscet: {
          navy: '#0B2545',
          blue: '#133C6D',
          royal: '#1D4ED8',
          sky: '#EFF6FF',
          gold: '#C89B2B',
          goldLight: '#F4D576',
          goldSoft: '#FEF9E7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(11, 37, 69, 0.06), 0 6px 20px rgba(11, 37, 69, 0.04)',
      },
    },
  },
  plugins: [],
};
