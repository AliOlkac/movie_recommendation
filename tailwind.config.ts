import type { Config } from "tailwindcss";

const config: Config = {


  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F2BB77", // Ana renk
          light: "#F2D0A7",   // Açık ton
          lighter: "#F2E2CE", // Daha açık ton
        },
        accent: {
          DEFAULT: "#A66E4E", // Yardımcı renk
          dark: "#594036",    // Daha koyu ton
        },
      },
    },
  },
  plugins: [require("daisyui")],
};


export default config;
