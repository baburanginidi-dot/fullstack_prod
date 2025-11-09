/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#4285F4',
        'brand-secondary': '#34A853',
        'brand-accent': '#FBBC05',
        'brand-danger': '#EA4335',
        'gray-900': '#121212',
        'gray-800': '#1E1E1E',
        'gray-700': '#2C2C2C',
        'gray-600': '#3A3A3A',
        'gray-500': '#8E8E8E',
        'gray-200': '#EAEAEA',
        'gray-100': '#F5F5F5',
      },
    },
  },
  plugins: [],
}
