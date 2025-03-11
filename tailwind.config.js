/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  variants: {
    extend: {
      backgroundColor: ({ after }) => after(["dark"]),
      textColor: ({ after }) => after(["dark"]),
      borderColor: ({ after }) => after(["dark"]),
    },
  },
  theme: {
    extend: {
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-8px)" },
          "75%": { transform: "translateX(8px)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        breathing: {
          "0%, 100%": {
            boxShadow: "inset 0 0 30px rgba(200,200,255,0.2), inset 0 0 30px rgba(180,105,255,0.2)",
          },
          "50%": {
            boxShadow: "inset 0 0 50px rgba(200,200,255,0.6), inset 0 0 50px rgba(180,105,255,0.6)",
          },
        },
      },
      animation: {
        shake: "shake 0.2s ease-in-out 0s 2",
        fadeIn: "fadeIn 0.3s ease-out forwards",
        breathing: "breathing 3s ease-in-out infinite",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "var(--tw-prose-body)",
            maxWidth: "65ch",
            lineHeight: "1.5",
            h1: {
              fontWeight: "700",
              fontSize: "1.2em",
              marginTop: "1em",
              marginBottom: "0.5em",
              lineHeight: "1.2",
            },
            h2: {
              fontWeight: "600",
              fontSize: "1.1em",
              marginTop: "1.2em",
              marginBottom: "0.4em",
              lineHeight: "1.25",
            },
            h3: {
              fontWeight: "600",
              fontSize: "1em",
              marginTop: "1em",
              marginBottom: "0.3em",
              lineHeight: "1.25",
            },
            h4: {
              fontWeight: "600",
              fontSize: "1em",
              marginTop: "0.8em",
              marginBottom: "0.2em",
              lineHeight: "1.25",
            },
            p: {
              marginTop: "0.5em",
              marginBottom: "0.5em",
              paddingBottom: "0 !important",
            },
            "ul, ol": {
              marginTop: "0.5em",
              marginBottom: "0.5em",
            },
            li: {
              marginTop: "0.2em",
              marginBottom: "0.2em",
              lineHeight: "1.5",
            },
            "pre:before": {
              content: "none",
            },
            "pre:after": {
              content: "none",
            },
            "pre code": {
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              padding: "0.5rem",
              fontSize: "1em",
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              borderRadius: "0.5rem",
              display: "block",
              width: "100%",
              overflow: "auto",
            },
            pre: {
              backgroundColor: "#1e1e1e",
              color: "#d4d4d4",
              margin: "1.5rem 0",
              borderRadius: "0.5rem",
              overflow: "auto",
            },
            code: {
              padding: "0.2em 0.4em",
              fontWeight: "500",
              borderRadius: "0.25rem",
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            blockquote: {
              fontWeight: "500",
              fontStyle: "italic",
              color: "var(--tw-prose-quotes)",
              borderLeftWidth: "0.25rem",
              borderLeftColor: "var(--tw-prose-quote-borders)",
              quotes: '"\\201C""\\201D""\\2018""\\2019"',
              marginTop: "1.6em",
              marginBottom: "1.6em",
              paddingLeft: "1em",
            },
            ul: {
              listStyleType: "disc",
              marginTop: "1.25em",
              marginBottom: "1.25em",
              paddingLeft: "1em",
            },
            ol: {
              listStyleType: "decimal",
              marginTop: "1.25em",
              marginBottom: "1.25em",
              paddingLeft: "1em",
            },
            a: {
              color: "var(--tw-prose-links)",
              textDecoration: "underline",
              fontWeight: "500",
              "&:hover": {
                color: "var(--tw-prose-links-hover)",
              },
            },
            table: {
              width: "100%",
              marginTop: "1.5em",
              marginBottom: "1.5em",
              borderCollapse: "separate",
              borderSpacing: "0",
              borderRadius: "0.5rem",
              overflow: "hidden",
            },
            thead: {
              backgroundColor: "#f3f4f6",
              borderBottom: "none",
            },
            "thead th": {
              fontWeight: "500",
              padding: "1rem",
              color: "#374151",
              textAlign: "left",
              fontSize: "0.875em",
            },
            "tbody tr": {
              borderTopWidth: "10px",
              borderColor: "#e5e7eb",
              "&:hover": {
                backgroundColor: "#f9fafb",
              },
            },
            "tbody td": {
              padding: "1rem",
              color: "#4b5563",
              fontSize: "0.875em",
            },
            th: {
              padding: "1rem",
            },
            td: {
              padding: "1rem",
            },
            br: {
              display: "none",
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar"),
    require("@tailwindcss/typography"),
    function ({ addUtilities }) {
      const newUtilities = {
        ".scrollbar-light": {
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(176, 176, 176, 0.5)",
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "rgba(176, 176, 176, 0.8)",
          },
        },
        ".scrollbar-hidden": {
          "&::-webkit-scrollbar": {
            display: "none",
          },
          "&": {
            overflow: "auto",
          },
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
