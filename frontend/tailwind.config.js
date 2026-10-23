/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#10233F',
        royal: '#2457D6',
        teal: '#0F9D91',
        paper: '#F4F7FB',
        ink: '#1C2B3A',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 30px rgba(16, 35, 63, 0.06)',
      },
      maxWidth: {
        page: '1120px',
      },
    },
  },
  plugins: [],
};
