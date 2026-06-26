import type { Config } from "tailwindcss";
const config: Config = { content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"], theme: { extend: { colors: { ink: "#17231f", forest: "#243a32", moss: "#596b52", sand: "#d8c8aa", linen: "#f4efe5", clay: "#a56643", stone: "#7b766b" }, fontFamily: { serif: ["Georgia", "serif"], sans: ["Inter", "ui-sans-serif", "system-ui"] } } }, plugins: [] };
export default config;
