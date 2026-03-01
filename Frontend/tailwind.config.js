/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pantri: {
          primary: '#A67051', 
          bc: '#C89F87',
          dark: '#8C5E43',
        },
        sage: {
          DEFAULT: '#8F9E82',
          light: '#B7C1AD',
        },
        cream: {
          DEFAULT: '#F9F8F4',
          darker: '#F0EFEA',
        },
        charcoal: '#3E3A35',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
       backgroundImage: {
        'paper-texture': "url('https://www.transparenttextures.com/patterns/cream-paper.png')",
      }
    },
  },
  plugins: [],
}