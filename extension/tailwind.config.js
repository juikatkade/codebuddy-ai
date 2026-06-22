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
          50: '#fffcf5',
          100: '#fff4e5',
          200: '#ffe5c2',
          300: '#ffd094',
          400: '#ffb55c',
          500: '#ffa116', // LeetCode Brand Orange
          600: '#e68a00',
          700: '#b36b00',
          800: '#8c5400',
          900: '#734600',
        },
        dark: {
          950: '#1a1a1a', // LeetCode background
          900: '#282828', // LeetCode layer 1 (panels)
          850: '#2d2d2d',
          800: '#333333', // LeetCode elevated / borders
          750: '#3e3e3e',
          700: '#4a4a4a', // Lighter borders / dividers
          600: '#5a5a5a',
          500: '#737373',
          400: '#8c8c8c',
          300: '#bfbfbf', // LeetCode secondary text
          200: '#eff1f6', // LeetCode primary text
        }
      }
    },
  },
  plugins: [],
}
