/** Accent colour system: one hex in, a full set of CSS variables out. */

export type ThemeMode = "light" | "dark";

export const ACCENTS: { id: string; label: string; hex: string }[] = [
  { id: "violet", label: "Violet", hex: "#7C3AED" },
  { id: "rose", label: "Rose", hex: "#E11D48" },
  { id: "pink", label: "Pink", hex: "#DB2777" },
  { id: "blue", label: "Blue", hex: "#2563EB" },
  { id: "teal", label: "Teal", hex: "#0D9488" },
  { id: "emerald", label: "Emerald", hex: "#059669" },
  { id: "amber", label: "Amber", hex: "#D97706" },
  { id: "graphite", label: "Graphite", hex: "#475569" },
];

export const DEFAULT_ACCENT = "#7C3AED";
export const MODE_KEY = "vc_mode";
export const ACCENT_KEY = "vc_accent";
export const ACCENT_VARS_KEY = "vc_accent_vars";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

const hsl = (h: number, s: number, l: number) => `hsl(${((h % 360) + 360) % 360.0} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;

export function isHex(v: unknown): v is string {
  return typeof v === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v);
}

/** CSS custom properties derived from one accent colour. */
export function accentVars(hex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  const lowSat = s < 18;
  return {
    "--accent": hex,
    "--accent-rgb": `${r} ${g} ${b}`,
    "--accent-2": hsl(h, s, Math.min(l + 9, 68)),
    "--accent-3": hsl(h + (lowSat ? 0 : 38), Math.max(s, 40), Math.min(Math.max(l, 45), 58)),
    "--accent-light": hsl(h, Math.max(s, 35), 74),
    "--accent-soft": `rgb(${r} ${g} ${b} / 0.10)`,
    "--accent-flower-filter": lowSat ? "saturate(0.12) brightness(1.05)" : `hue-rotate(${Math.round(h - 268)}deg)`,
  };
}

/** Applies mode + accent to <html>. Safe to call before React hydrates. */
export function applyAppearance(mode: ThemeMode, hex: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", mode === "dark" ? "clove" : "pearl");
  root.classList.toggle("dark", mode === "dark");
  root.removeAttribute("data-accent");
  const vars = accentVars(isHex(hex) ? hex : DEFAULT_ACCENT);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  try {
    localStorage.setItem(ACCENT_VARS_KEY, JSON.stringify(vars));
  } catch {}
}
