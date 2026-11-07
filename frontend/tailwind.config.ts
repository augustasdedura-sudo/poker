import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Card-room palette. `slate` is redefined as a warm charcoal ramp so every
        // neutral in the app (page, surfaces, borders, text) shares one tint.
        slate: {
          50: "#f6f2ea",
          100: "#ede8df",
          200: "#d9d3c8",
          300: "#bdb6aa",
          400: "#a9a296",
          500: "#766f65",
          600: "#4f4943",
          700: "#38342f",
          800: "#2a2723",
          900: "#1c1a17",
          950: "#121110",
        },
        // The one accent: brass, for the dealer button, whose turn it is and your main action.
        brass: {
          200: "#f0dcae",
          300: "#e5c27f",
          400: "#d6ac5e",
          500: "#bb9046",
          600: "#957233",
          ink: "#1d1608",
        },
        // Clay: all-in and losses only.
        clay: {
          300: "#e3937c",
          400: "#d4735a",
          500: "#c4553d",
          600: "#a4432f",
        },
        win: "#4f9a68",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        // Instrument Sans for the interface (warm but exact), Plex Mono for chips,
        // stacks and the log. Both loaded in app/layout.tsx via next/font.
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      transitionTimingFunction: {
        // One easing curve for the whole app: quick start, soft landing.
        out: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
