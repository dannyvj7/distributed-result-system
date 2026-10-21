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
        primary: "#1D4ED8",
        sidebar: "#1E3A8A",
        bgLight: "#F8FAFC",
        cardBg: "#FFFFFF",
        textColor: "#0F172A",
        successColor: "#16A34A",
        warningColor: "#F59E0B",
        errorColor: "#DC2626",
      },
    },
  },
  plugins: [],
};
