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
          blue: '#00BFFF',
        },
        secondary: {
          blue: '#00BFFF',
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
          capri: '#00BFFF',
        },
        border: {
          capri: '#00BFFF',
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
