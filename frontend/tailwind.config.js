/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          dark: '#0B132B',
          navy: '#1C2541',
          steel: '#3A506B',
          accent: '#5BC0BE',
          light: '#6FFFE9',
          card: '#162238',
          border: '#2A3B53',
        },
        dept: {
          civil: '#10B981',       // Emerald Green (Engineering/P-Way)
          trd: '#F59E0B',         // Amber (TRD Electrical)
          snt: '#6366F1',         // Indigo/Violet (Signal & Telecom)
          mech: '#EC4899',        // Rose/Pink (Mechanical/Bridge)
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
