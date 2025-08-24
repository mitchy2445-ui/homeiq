import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],

  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#F0FAF4",
          100: "#DCF4E7",
          200: "#BDE8D0",
          300: "#93D9B4",
          400: "#64C792",
          500: "#3FB877",
          600: "#2E8B57", // Forest green (primary)
          700: "#247448",
          800: "#1B5A3A",
          900: "#14452E",
        },
      },
      boxShadow: {
        card: "0 6px 20px rgba(0,0,0,0.06)",
        hover: "0 10px 24px rgba(0,0,0,0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
