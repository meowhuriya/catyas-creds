/**
 * Valeria's Creds - Design Tokens
 * Visual design system: Heritage Academic with Soft Gingham & Cottagecore Palette.
 * Headings & big metrics: Fraunces. Interface & text: Plus Jakarta Sans.
 * No monospace font. WCAG AA contrast enforced everywhere.
 */

export const TOKENS = {
  name: "Valeria's Creds",
  tagline: "LEARNING PORTAL",
  colors: {
    light: {
      background: "#F6EBD3", // Warm cream base
      surface: "#FFFFFF",
      surfaceMuted: "#FBF6EC", // Solid cream paper
      border: "#E5D5C5", // Warm border
      borderSecondary: "#CFC8BB", // 1px secondary button border
      ink: "#14161F", // Deep ink
      inkMuted: "#4B5160", // Secondary text
      eyebrow: "#8A1627", // 12px bold uppercase eyebrow labels
      accent: "#A51C30", // Solid crimson (buttons & branding)
      accentHover: "#881324",
      tomato: "#C62F3C", // Gingham stripe red
      mustard: "#D9A441", // Achievements, streaks, rings (replaces old gold)
      sage: "#5E7B5B", // Success & completed topics
      teal: "#2F7F86", // Links & interactive badges
      burgundy: "#380C13", // Hero banner deep tone
      gold: "#D9A441", // Alias for achievements
      success: "#5E7B5B",
      warning: "#D9A441",
      danger: "#C62F3C",
      info: "#2F7F86",
    },
    dark: {
      background: "#1A1214",
      surface: "#221A1C",
      surfaceMuted: "#2B2124",
      border: "#3D2D31",
      borderSecondary: "#524045",
      ink: "#F6EBD3",
      inkMuted: "#A89B9E",
      eyebrow: "#F07B88",
      accent: "#E25F70",
      accentHover: "#EE7584",
      tomato: "#E84D58",
      mustard: "#F0B533",
      sage: "#6E936B",
      teal: "#449EA6",
      burgundy: "#280A0E",
      gold: "#F0B533",
      success: "#6E936B",
      warning: "#F0B533",
      danger: "#E84D58",
      info: "#449EA6",
    },
    hero: {
      gradient: "linear-gradient(135deg, #380C13, #631724)",
      goldHairline: "1px solid rgba(217, 164, 65, 0.45)",
    },
    gingham: {
      cream: "#F6EBD3",
      red: "#C62F3C",
      softAlpha: 0.12,
      mediumAlpha: 0.20,
      boldAlpha: 0.30,
      darkBase: "#1A1214",
      darkAlpha: 0.10,
    },
    // 8 Muted Course Color Tags - shown ONLY as a thin 4px bar or small 6px dot
    courseTags: {
      slate: { id: "slate", label: "Slate Blue", hex: "#3E5C8A" },
      teal: { id: "teal", label: "Teal", hex: "#1F7A7A" },
      olive: { id: "olive", label: "Olive", hex: "#687B2E" },
      ochre: { id: "ochre", label: "Ochre", hex: "#B8821F" },
      plum: { id: "plum", label: "Plum", hex: "#7A3F6E" },
      rust: { id: "rust", label: "Rust", hex: "#B04A2F" },
      graphite: { id: "graphite", label: "Graphite", hex: "#4B5563" },
      forest: { id: "forest", label: "Forest", hex: "#2F6B4A" },
    },
  },
  typography: {
    fonts: {
      serif: "var(--font-fraunces), Georgia, serif",
      sans: "var(--font-plus-jakarta-sans), system-ui, sans-serif",
    },
    scales: {
      eyebrow: "12px", // 12px bold uppercase tracking-wider
      sm: "14px", // Secondary text
      base: "16px", // Topic text weight 500, line-height 1.5
      lg: "20px",
      xl: "24px",
      "2xl": "32px",
      "3xl": "44px",
    },
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      reading: 1.6,
    },
  },
  geometry: {
    sidebarWidth: "280px",
    radii: {
      control: "6px",
      card: "14px",
    },
    borderWidth: "1px",
    gridUnit: 8,
    maxWidth: {
      content: "1280px",
      reading: "760px",
    },
  },
  motion: {
    hover: "150ms ease",
    dialog: "200ms ease",
    pageTransition: "250ms ease",
  },
} as const;

export type CourseTagKey = keyof typeof TOKENS.colors.courseTags;
