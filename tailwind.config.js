/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Prompt', 'sans-serif'],
        mono: ['"SF Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        earth: {
          bg: '#171412',           // Warm Espresso / Deep Earth
          card: '#231E1B',         // Warm Clay Stone
          cardSubtle: '#2E2723',   // Muted Taupe Pebble
          cardHighlight: '#3B322D',// Rich Ochre Stone
          terracotta: '#C86D51',   // Warm Terracotta Clay (Primary Accent)
          terracottaHover: '#B85E42',
          sage: '#64836B',         // Muted Organic Sage Green
          mustard: '#C9974C',      // Warm Ochre / Sunbaked Earth
          clayRed: '#C25745',      // Deep Rust Earth
          linen: '#FAF5EE',        // Warm Linen Cream (Primary Text)
          sand: '#A89E93',         // Muted Pebble Sand (Secondary Text)
          border: 'rgba(245, 235, 225, 0.08)',
        }
      }
    },
  },
  plugins: [],
}
