/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#0D6EFD',
        },
        secondary: {
          blue: '#1E90FF',
        },
        accent: {
          yellow: '#FFC107',
        },
        background: {
          light: '#F5F8FF',
        },
        card: {
          white: '#FFFFFF',
        },
        text: {
          dark: '#1F2937',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        custom: '12px',
      },
      boxShadow: {
        custom: '0 8px 24px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
