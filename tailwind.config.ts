import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1d2623",
        moss: "#536b57",
        sage: "#d7e0d3",
        clay: "#b86f50",
        linen: "#f5f1e9",
        oat: "#e7dccd",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 24px 80px rgba(29, 38, 35, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
