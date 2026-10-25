import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        safari: "#00A651",
        "safari-dark": "#078344",
        ink: "#17231d",
        mist: "#f5f8f5"
      },
      boxShadow: {
        card: "0 12px 36px rgba(17, 42, 27, 0.08)"
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(90deg, rgba(11, 28, 18, 0.82) 0%, rgba(11, 28, 18, 0.42) 53%, rgba(11, 28, 18, 0.08) 100%)"
      }
    }
  },
  plugins: []
};

export default config;
