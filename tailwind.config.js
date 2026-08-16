/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primario: {
          DEFAULT: "#0066CC",
          50: "#F0F7FF",
          100: "#E6F0FF",
          hover: "#0052A3",
          active: "#003D7A",
        },
        secundario: "#FF6B35",
        exito: {
          DEFAULT: "#10B981",
          hover: "#059669",
          active: "#047857",
          fondo: "#ECFDF5",
          texto: "#047857",
        },
        peligro: {
          DEFAULT: "#EF4444",
          hover: "#DC2626",
          active: "#B91C1C",
          fondo: "#FEE2E2",
          texto: "#991B1B",
        },
        advertencia: {
          DEFAULT: "#FBBF24",
          fondo: "#FEF3C7",
          texto: "#92400E",
        },
        neutro: {
          oscuro: "#1F2937",
          medio: "#6B7280",
          claro: "#F3F4F6",
          ultraClaro: "#F9FAFB",
          borde: "#E5E7EB",
        },
        placeholder: "#F3E8FF",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Fira Code", "monospace"],
      },
      fontSize: {
        h1: ["32px", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.5px" }],
        h2: ["24px", { lineHeight: "1.3", fontWeight: "700", letterSpacing: "-0.25px" }],
        h3: ["20px", { lineHeight: "1.4", fontWeight: "600" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "0.5px" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0.25px" }],
        caption: ["12px", { lineHeight: "1.4" }],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "64px",
      },
      borderRadius: {
        input: "2px",
        sm: "4px",
        DEFAULT: "8px",
        lg: "12px",
      },
      boxShadow: {
        sutil: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        normal: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        fuerte: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        modalOut: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
      },
      animation: {
        "modal-in": "modalIn 100ms ease-out",
        "modal-out": "modalOut 100ms ease-in",
      },
    },
  },
  plugins: [],
};
