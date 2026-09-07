/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Taken from the Raso wordmark: navy #000060 and gold #D8B430.
        brand: {
          50: '#EEF1FA',
          100: '#DBE1F4',
          200: '#B8C3E9',
          300: '#8B9BD8',
          400: '#5D6FC2',
          500: '#3B4CA4',
          600: '#2A3785',
          700: '#1E276B',
          800: '#151B52',
          900: '#0D1139',
          950: '#070A24',
        },
        gold: {
          50: '#FDF8E7',
          100: '#FAEFC4',
          200: '#F4DE8C',
          300: '#EBC94F',
          400: '#D8B430',
          500: '#BC9A22',
          600: '#96791B',
          700: '#6F5915',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
