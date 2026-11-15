/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#030304",
          900: "#060608",
          850: "#09080D",
          800: "#0E0D14",
        },
        disk: {
          white: "#FFF4E0",
          gold: "#FFB347",
          amber: "#F59E0B",
          burnt: "#C2410C",
        },
        telemetry: {
          ice: "#BCD9FF",
          alert: "#EF4444",
        },
        status: {
          normal: "#10B981",
          watch: "#F59E0B",
          critical: "#EF4444",
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Geist Variable"', '"Geist"', "-apple-system", "sans-serif"],
        mono: ['"Geist Mono Variable"', '"Geist Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};
