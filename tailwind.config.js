module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // src/app içindeki dosyalar
    "./pages/**/*.{js,ts,jsx,tsx}", // pages içindeki dosyalar
    "./src/**/*.{js,ts,jsx,tsx}", // src içindeki dosyalar
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
