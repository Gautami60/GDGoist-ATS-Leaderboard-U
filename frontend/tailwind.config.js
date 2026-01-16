module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom Premium Palette
        caramel: {
          DEFAULT: '#84592B',
          light: '#9D6B3A',
          dark: '#6B4722',
        },
        batter: {
          DEFAULT: '#E8D1A7',
          light: '#F0DDB8',
          dark: '#D9C296',
        },
        wine: {
          DEFAULT: '#743014',
          light: '#8A3D1A',
          dark: '#5E2610',
        },
        olive: {
          DEFAULT: '#9D9167',
          light: '#AFA37A',
          dark: '#8B7F55',
        },
        cocoa: {
          DEFAULT: '#442D1C',
          light: '#5A3D28',
          dark: '#2E1E13',
        },
        // Neutral palette for backgrounds
        neutral: {
          50: '#FAF9F7',
          100: '#F5F3F0',
          200: '#E8E5E0',
          300: '#D4CFC7',
          400: '#B8B0A4',
          500: '#9D9167',
          600: '#84592B',
          700: '#6B4722',
          800: '#442D1C',
          900: '#2E1E13',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(68, 45, 28, 0.08)',
        'medium': '0 4px 16px rgba(68, 45, 28, 0.12)',
        'large': '0 8px 24px rgba(68, 45, 28, 0.16)',
      },
    },
  },
  plugins: [],
}
