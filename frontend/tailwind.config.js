/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinemai: {
          bg: "#FEFCE8",          // Soft pale yellow background
          surface: "#FFFBEB",     // Warm cream card / surface background
          border: "#FECDD3",      // Subtle pale red / rose accent border
          borderLight: "#FCA5A5", // Input border & alert boundary
          crimson: "#881337",     // Deep crimson for readable headers and text
          rose: "#E11D48",        // Primary accent & button pale red / rose
          roseDark: "#BE123C",    // Primary button hover state
          roseLight: "#FFE4E6",   // Highlight badges & soft pill container
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
