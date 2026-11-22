/**
 * Original glass-style flower artwork (same family as the dashboard's glass flower).
 * Pure functions that return SVG markup, so the same art is used in the timer, the garden
 * and the bouquet (and can be saved as an image).
 */

export type Species = "orchid" | "peony" | "lotus" | "sunflower" | "daisy" | "tulip";

export const SPECIES: { id: Species; name: string }[] = [
  { id: "orchid", name: "Violet orchid" },
  { id: "peony", name: "Rose peony" },
  { id: "lotus", name: "Aqua lotus" },
  { id: "sunflower", name: "Sunflower" },
  { id: "daisy", name: "Moon daisy" },
  { id: "tulip", name: "Coral tulip" },
];

interface Pal {
  base: string; // deep root colour of the petal
  mid: string;
  tip: string;
  rim: string; // light edge
  glow: string;
  core: string;
}

const PAL: Record<Species, Pal> = {
  orchid: { base: "#1E0548", mid: "#7C3AED", tip: "#E879F9", rim: "#F5D0FE", glow: "#C084FC", core: "#FDE68A" },
  peony: { base: "#4A0D2E", mid: "#E11D74", tip: "#FF9CC8", rim: "#FFE3F0", glow: "#FB7185", core: "#FCD34D" },
  lotus: { base: "#04343C", mid: "#0EA5A5", tip: "#9BF0E4", rim: "#E0FFFA", glow: "#5EEAD4", core: "#FDE047" },
  sunflower: { base: "#6B2E00", mid: "#F59E0B", tip: "#FFE45C", rim: "#FFF8C2", glow: "#FBBF24", core: "#3B1D08" },
  daisy: { base: "#5B4B8A", mid: "#C9B8FF", tip: "#FFFFFF", rim: "#FFFFFF", glow: "#DDD6FE", core: "#FFC83D" },
  tulip: { base: "#5E0F1F", mid: "#E8465B", tip: "#FFA8A0", rim: "#FFE6E1", glow: "#FB7185", core: "#FFE4E1" },
};

const f = (n: number) => Math.round(n * 100) / 100;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t: number) => t * t * (3 - 2 * t);

/* petal outlines: base at (0,0), tip about 100 units up */
const ROUND = "M0 0 C 20 -14, 41 -52, 25 -88 C 16 -109, -16 -109, -25 -88 C -41 -52, -20 -14, 0 0 Z";
const POINTED = "M0 0 C 21 -22, 33 -58, 0 -106 C -33 -58, -21 -22, 0 0 Z";
const SUN = "M0 0 C 11 -24, 16 -64, 0 -104 C -16 -64, -11 -24, 0 0 Z";
const DAISY = "M0 0 C 11 -22, 16 -66, 7 -97 C 4 -106, -4 -106, -7 -97 C -16 -66, -11 -22, 0 0 Z";
const ORCHID = "M0 0 C 8 -18, 52 -40, 70 -86 C 84 -124, 46 -150, 18 -132 C -8 -116, -14 -70, -6 -36 C -3 -20, -1 -8, 0 0 Z";
const ORCHID_K = 0.62;

const SHINE: Record<Species, string> = {
  orchid: "M30 -126 C 50 -134, 72 -118, 70 -98 C 64 -112, 50 -122, 30 -126 Z",
  peony: "M-12 -88 C -8 -100, 8 -102, 14 -92 C 6 -94, -4 -94, -12 -88 Z",
  lotus: "M-6 -86 C -3 -98, 5 -98, 7 -90 C 3 -92, -2 -92, -6 -86 Z",
  sunflower: "M-3 -80 C -1 -92, 4 -92, 4 -82 C 2 -84, -1 -84, -3 -80 Z",
  daisy: "M-3 -80 C -1 -90, 4 -90, 4 -82 C 2 -84, -1 -84, -3 -80 Z",
  tulip: "M-14 -84 C -10 -98, 6 -100, 12 -90 C 4 -92, -6 -92, -14 -84 Z",
};

const RIB = "M0 -10 C 2 -36, 2 -62, 0 -84";

/* ---------- shared building blocks ---------- */
function defs(id: string, sp: Species, glowBlur = 5) {
  const p = PAL[sp];
  return `
  <linearGradient id="pg-${id}" x1="0.25" y1="1" x2="0.75" y2="0">
    <stop offset="0" stop-color="${p.base}"/><stop offset=".32" stop-color="${p.mid}"/><stop offset=".75" stop-color="${p.tip}"/><stop offset="1" stop-color="${p.rim}"/>
  </linearGradient>
  <linearGradient id="pd-${id}" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#0A0118" stop-opacity=".6"/><stop offset=".5" stop-color="#0A0118" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="ps-${id}" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="core-${id}" cx=".4" cy=".35" r=".75">
    <stop offset="0" stop-color="${sp === "sunflower" ? "#8A4B1A" : "#FFF6C2"}"/><stop offset=".6" stop-color="${p.core}"/><stop offset="1" stop-color="${sp === "sunflower" ? "#1A0B03" : "#E8A200"}"/>
  </radialGradient>
  <linearGradient id="st-${id}" x1="0" y1="1" x2="0" y2="0">
    <stop offset="0" stop-color="#0B4A36"/><stop offset=".6" stop-color="#1FA97A"/><stop offset="1" stop-color="#6FE3B0"/>
  </linearGradient>
  <linearGradient id="lf-${id}" x1="0" y1="1" x2="1" y2="0">
    <stop offset="0" stop-color="#0A3B2C"/><stop offset=".55" stop-color="#1FB07F"/><stop offset="1" stop-color="#A7F5D2"/>
  </linearGradient>
  <radialGradient id="soil-${id}" cx=".5" cy=".2" r=".9">
    <stop offset="0" stop-color="#6B4A63"/><stop offset="1" stop-color="#2A1630"/>
  </radialGradient>
  <filter id="glow-${id}" x="-60%" y="-60%" width="220%" height="220%">
    <feDropShadow dx="0" dy="0" stdDeviation="${glowBlur}" flood-color="${p.glow}" flood-opacity=".55"/>
  </filter>`;
}

function petal(id: string, sp: Species, path: string, rot: number, k: number, opacity = 1, shine = true) {
  const p = PAL[sp];
  return `<g transform="rotate(${f(rot)}) scale(${f(k)})" opacity="${opacity}">
    <path d="${path}" fill="url(#pg-${id})"/>
    <path d="${path}" fill="url(#pd-${id})"/>
    <path d="${path}" fill="url(#ps-${id})"/>
    <path d="${path}" fill="none" stroke="${p.rim}" stroke-opacity=".38" stroke-width="1.2"/>
    <path d="${RIB}" fill="none" stroke="${p.rim}" stroke-opacity=".32" stroke-width="1.4" stroke-linecap="round"/>
    ${shine ? `<path d="${SHINE[sp]}" fill="#fff" opacity=".72"/>` : ""}
  </g>`;
}

function ring(id: string, sp: Species, path: string, n: number, k: number, offset: number, spread = 1, shine = true) {
  let s = "";
  for (let i = 0; i < n; i++) s += petal(id, sp, path, offset + (i * 360) / n, k, 1, shine && i % 2 === 0);
  return s;
}

function dots(n: number, rMax: number, size: number, fill: string, opacity = 0.85) {
  let s = "";
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 1; i <= n; i++) {
    const r = rMax * Math.sqrt(i / n);
    const a = i * ga;
    s += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="${f(size * (0.7 + 0.5 * (i / n)))}" fill="${fill}" opacity="${opacity}"/>`;
  }
  return s;
}

/* ---------- the open flower head (centered on 0,0, radius about 66) ---------- */
export function headSvg(sp: Species, id: string, open = 1): string {
  const p = PAL[sp];
  const g = 0.64; // overall head scale
  const a = 28 * (1 - open); // petals fan out as it opens
  switch (sp) {
    case "orchid": {
      const k = ORCHID_K * g;
      return `<g transform="scale(${f(1)})">
        ${ring(id, sp, ORCHID, 7, k * 1.0, 0 - a)}
        ${ring(id, sp, ORCHID, 7, k * 0.62, 25.7 + a, 1, false)}
        <circle r="9" fill="url(#core-${id})"/><circle r="9" fill="none" stroke="${p.rim}" stroke-opacity=".5"/>
        <circle cx="-2.5" cy="-3" r="2.6" fill="#fff" opacity=".8"/>
      </g>`;
    }
    case "peony":
      return `${ring(id, sp, ROUND, 8, g * 1.0, 0 - a)}${ring(id, sp, ROUND, 8, g * 0.8, 22.5 + a)}${ring(id, sp, ROUND, 7, g * 0.56, 5 - a, 1, false)}${ring(id, sp, ROUND, 6, g * 0.34, 30 + a, 1, false)}
        <circle r="6" fill="url(#core-${id})"/>${dots(10, 4, 0.9, "#FFF3B0")}`;
    case "lotus":
      return `${ring(id, sp, POINTED, 8, g * 1.0, 0 - a)}${ring(id, sp, POINTED, 8, g * 0.8, 22.5 + a)}${ring(id, sp, POINTED, 6, g * 0.55, 0 - a, 1, false)}
        <circle r="9" fill="url(#core-${id})"/><circle r="9" fill="none" stroke="#fff" stroke-opacity=".45"/>${dots(14, 6, 0.9, "#A16207")}`;
    case "sunflower":
      return `${ring(id, sp, SUN, 18, g * 1.0, 0 - a * 0.5)}${ring(id, sp, SUN, 18, g * 0.86, 10 + a * 0.5)}
        <circle r="23" fill="url(#core-${id})"/><circle r="23" fill="none" stroke="#FDE68A" stroke-opacity=".5" stroke-width="1.5"/>
        ${dots(70, 20, 1.5, "#FDBA74", 0.55)}<circle cx="-7" cy="-8" r="5" fill="#fff" opacity=".25"/>`;
    case "daisy":
      return `${ring(id, sp, DAISY, 15, g * 1.0, 0 - a * 0.5)}${ring(id, sp, DAISY, 15, g * 0.82, 12 + a * 0.5, 1, false)}
        <circle r="13" fill="url(#core-${id})"/><circle r="13" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
        ${dots(22, 10, 1.1, "#B45309", 0.5)}<circle cx="-4" cy="-5" r="3" fill="#fff" opacity=".7"/>`;
    case "tulip": {
      // side view: back petals, then the front petal, so it reads as a cup
      const cup = "M0 0 C 30 -6, 40 -62, 0 -96 C -40 -62, -30 -6, 0 0 Z";
      const w = 20 * open;
      return `<g transform="translate(0,34) scale(${f(g * 1.05)})">
        ${petal(id, sp, cup, -w, 0.96, 0.96, false)}
        ${petal(id, sp, cup, w, 0.96, 0.96, false)}
        ${petal(id, sp, cup, 0, 1.0, 1, true)}
      </g>`;
    }
  }
}

/** closed bud: a glossy teardrop held by two small sepals */
function budSvg(sp: Species, id: string): string {
  const p = PAL[sp];
  return `<g>
    <path d="M0 0 C 22 -4, 28 -40, 0 -66 C -28 -40, -22 -4, 0 0 Z" fill="url(#pg-${id})"/>
    <path d="M0 0 C 22 -4, 28 -40, 0 -66 C -28 -40, -22 -4, 0 0 Z" fill="url(#pd-${id})"/>
    <path d="M-4 -16 C 2 -34, 12 -48, 4 -60" fill="none" stroke="${p.rim}" stroke-opacity=".4" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M-12 -40 C -9 -52, -1 -56, 3 -52 C -2 -52, -8 -48, -12 -40 Z" fill="#fff" opacity=".7"/>
    <path d="M0 2 C -18 0, -26 -12, -26 -26 C -12 -22, -3 -12, 0 2 Z" fill="url(#lf-${id})"/>
    <path d="M0 2 C 18 0, 26 -12, 26 -26 C 12 -22, 3 -12, 0 2 Z" fill="url(#lf-${id})"/>
  </g>`;
}

function leaf(id: string, flip: number, scale: number, rot: number) {
  return `<g transform="scale(${flip * scale},${scale}) rotate(${rot})">
    <path d="M0 0 C 16 -8, 40 -6, 58 -26 C 40 -40, 12 -34, 0 0 Z" fill="url(#lf-${id})"/>
    <path d="M2 -2 C 18 -10, 34 -14, 52 -24" fill="none" stroke="#D1FAE5" stroke-opacity=".5" stroke-width="1.3" stroke-linecap="round"/>
    <path d="M16 -14 C 24 -22, 36 -30, 46 -32 C 38 -22, 28 -16, 16 -14 Z" fill="#fff" opacity=".22"/>
  </g>`;
}

/* stem is a cubic: P0(0,4) P1(-10,-44) P2(12,-84) P3(0,-132) */
function stemPoint(t: number): [number, number] {
  const u = 1 - t;
  const x = u * u * u * 0 + 3 * u * u * t * -10 + 3 * u * t * t * 12 + t * t * t * 0;
  const y = u * u * u * 4 + 3 * u * u * t * -44 + 3 * u * t * t * -84 + t * t * t * -132;
  return [x, y];
}

function sparkle(x: number, y: number, s: number, delay: number) {
  return `<path class="vc-twinkle" style="animation-delay:${delay}s;transform-origin:${x}px ${y}px" transform="translate(${x} ${y}) scale(${s})" d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z" fill="#fff"/>`;
}

/**
 * One growing plant. progress 0..1: seed, sprout, stem + leaves, bud, bloom.
 * `wilted` droops and fades it (a session you left early).
 */
export function flowerSvg(opts: { species: Species; progress: number; uid: string; wilted?: boolean; size?: number; label?: string }): string {
  const { species: sp, uid } = opts;
  const p = clamp(opts.progress);
  const id = `${uid}${sp}`;
  const stemG = ease(clamp((p - 0.06) / 0.5));
  const leafG = ease(clamp((p - 0.22) / 0.3));
  const budG = ease(clamp((p - 0.5) / 0.2));
  const open = ease(clamp((p - 0.7) / 0.3));
  const [tx, ty] = stemPoint(stemG);
  const done = p >= 0.999 && !opts.wilted;
  const wilt = !!opts.wilted;
  const size = opts.size ?? 200;
  const showBud = p >= 0.5 && p < 0.84;
  const budOpacity = clamp(1 - (p - 0.74) / 0.1);
  const headOpacity = clamp((p - 0.72) / 0.1);
  const headScale = 0.28 + 0.72 * open;

  // leaves sit on the stem once it is tall enough
  const l1 = stemPoint(Math.min(stemG, 0.38));
  const l2 = stemPoint(Math.min(stemG, 0.62));
  const seed = p < 0.06 ? `<ellipse cx="0" cy="3" rx="5" ry="3.4" fill="${PAL[sp].mid}" opacity="${f(0.5 + p * 8)}"/>` : "";
  const sprout =
    p >= 0.06 && p < 0.34
      ? `<g transform="translate(${f(tx)} ${f(ty)})">${leaf(id, 1, f(0.22 + 0.25 * clamp((p - 0.1) / 0.2)), -30)}${leaf(id, -1, f(0.22 + 0.25 * clamp((p - 0.1) / 0.2)), -30)}</g>`
      : "";

  const grass = `<path d="M-30 6 C -28 -6, -24 -10, -22 -14 C -20 -6, -18 0, -16 6 Z" fill="url(#lf-${id})" opacity=".85"/>
    <path d="M18 6 C 20 -4, 26 -8, 30 -12 C 30 -4, 28 2, 26 6 Z" fill="url(#lf-${id})" opacity=".85"/>`;

  const plant = `
    <g ${wilt ? `transform="rotate(16 0 4)"` : done ? `class="vc-sway" style="transform-origin:0px 4px"` : ""}>
      <path d="M0 4 C -10 -44, 12 -84, 0 -132" pathLength="100" fill="none" stroke="url(#st-${id})" stroke-width="5.2" stroke-linecap="round"
        stroke-dasharray="100" stroke-dashoffset="${f(100 * (1 - stemG))}"/>
      ${stemG > 0.38 ? `<g transform="translate(${f(l1[0])} ${f(l1[1])})">${leaf(id, 1, f(0.75 * leafG), -22)}</g>` : ""}
      ${stemG > 0.5 ? `<g transform="translate(${f(l2[0])} ${f(l2[1])})">${leaf(id, -1, f(0.62 * leafG), -26)}</g>` : ""}
      ${sprout}
      ${showBud ? `<g transform="translate(${f(tx)} ${f(ty)}) scale(${f(0.55 + 0.45 * budG)})" opacity="${f(budOpacity)}">${budSvg(sp, id)}</g>` : ""}
      ${p >= 0.72 ? `<g transform="translate(${f(tx)} ${f(ty - 4)}) ${wilt ? "rotate(38) translate(0 8)" : ""} scale(${f(headScale * (wilt ? 0.9 : 1))})" opacity="${f(headOpacity)}" filter="url(#glow-${id})">${headSvg(sp, id, wilt ? 0.55 : open)}</g>` : ""}
      ${done ? sparkle(-58, -150, 0.9, 0) + sparkle(56, -172, 0.7, 0.8) + sparkle(40, -112, 0.55, 1.5) : ""}
    </g>
    ${seed}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-95 -215 190 235" width="${size}" height="${Math.round(size * 1.237)}" role="img" aria-label="${opts.label ?? SPECIES.find((s) => s.id === sp)?.name ?? "Flower"}">
  <defs>${defs(id, sp)}</defs>
  <g ${wilt ? `style="filter:grayscale(.72) brightness(.92);opacity:.78"` : ""}>
    <ellipse cx="0" cy="10" rx="46" ry="9" fill="#000" opacity=".16"/>
    <path d="M-44 10 C -38 -6, -20 -12, 0 -12 C 20 -12, 38 -6, 44 10 C 30 16, -30 16, -44 10 Z" fill="url(#soil-${id})"/>
    <path d="M-30 -4 C -16 -10, 16 -10, 30 -4" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.4" stroke-linecap="round"/>
    ${grass}
    ${plant}
  </g>
</svg>`;
}

/** Just the open bloom, for badges and bouquets. */
export function bloomSvg(opts: { species: Species; uid: string; size?: number }): string {
  const id = `${opts.uid}${opts.species}`;
  const s = opts.size ?? 80;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-80 -80 160 160" width="${s}" height="${s}">
  <defs>${defs(id, opts.species, 4)}</defs>
  <g filter="url(#glow-${id})">${headSvg(opts.species, id, 1)}</g></svg>`;
}

/* ---------- bouquet ---------- */
export function bouquetSvg(kinds: Species[], uid: string, opts: { size?: number; title?: string } = {}): string {
  const n = Math.min(kinds.length, 15);
  const list = kinds.slice(0, n);
  const GX = 160;
  const GY = 236; // where the stems gather
  // positions on 3 arcs, centre flowers a little bigger
  const slots: { x: number; y: number; k: number }[] = [];
  const rows = n <= 3 ? [n] : n <= 7 ? [Math.ceil(n / 2), Math.floor(n / 2)] : [Math.ceil(n / 3), Math.ceil((n - Math.ceil(n / 3)) / 2), n - Math.ceil(n / 3) - Math.ceil((n - Math.ceil(n / 3)) / 2)];
  rows.forEach((cnt, r) => {
    const radius = [0, 74, 128][rows.length === 1 ? 0 : r === 0 ? 0 : r] || 0;
    for (let i = 0; i < cnt; i++) {
      const spread = rows.length === 1 ? 70 : r === 0 ? 40 : 64;
      const ang = cnt === 1 ? 0 : -spread + (i * 2 * spread) / (cnt - 1);
      const rad = (ang * Math.PI) / 180;
      const rr = rows.length === 1 ? (cnt === 1 ? 0 : 84) : r === 0 ? (cnt === 1 ? 0 : 52) : radius;
      slots.push({ x: GX + Math.sin(rad) * rr * 1.05, y: 118 - Math.cos(rad) * rr * 0.62 + (r === 0 ? 0 : 22 * r), k: r === 0 ? 0.78 : r === 1 ? 0.66 : 0.56 });
    }
  });
  const fan = [-62, -38, -14, 14, 38, 62]
    .map((a, i) => `<g transform="translate(${GX} ${GY}) rotate(${a})"><path d="M0 0 C 14 -40, 18 -96, 0 -150 C -18 -96, -14 -40, 0 0 Z" fill="url(#bl-${uid})" opacity="${0.55 + (i % 2) * 0.2}"/><path d="M0 -8 L0 -130" stroke="#D1FAE5" stroke-opacity=".3" stroke-width="1.2"/></g>`)
    .join("");
  const stems = slots.map((s) => `<path d="M${GX} ${GY} Q ${f((GX + s.x) / 2)} ${f((GY + s.y) / 2 + 10)} ${f(s.x)} ${f(s.y)}" fill="none" stroke="url(#bs-${uid})" stroke-width="3.2" stroke-linecap="round"/>`).join("");
  const seen = new Set<Species>();
  const heads = slots
    .map((s, i) => {
      const sp = list[i];
      const id = `${uid}b${i}${sp}`;
      return `<g transform="translate(${f(s.x)} ${f(s.y)}) rotate(${(i % 5) * 9 - 18}) scale(${f(s.k)})"><defs>${defs(id, sp, 3)}</defs><g filter="url(#glow-${id})">${headSvg(sp, id, 1)}</g></g>`;
    })
    .join("");
  void seen;
  const babies = Array.from({ length: 16 }, (_, i) => {
    const a = (-70 + i * 9.2) * (Math.PI / 180);
    const r = 100 + ((i * 37) % 38);
    return `<circle cx="${f(GX + Math.sin(a) * r * 1.1)}" cy="${f(130 - Math.cos(a) * r * 0.5 + (i % 3) * 8)}" r="${1.6 + (i % 3) * 0.7}" fill="#fff" opacity=".85"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-30 0 380 380" width="${opts.size ?? 320}" height="${opts.size ?? 320}" role="img" aria-label="${opts.title ?? "Bouquet"}">
  <defs>
    <linearGradient id="bl-${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0A3B2C"/><stop offset=".6" stop-color="#1FB07F"/><stop offset="1" stop-color="#A7F5D2"/></linearGradient>
    <linearGradient id="bs-${uid}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#0E5A41"/><stop offset="1" stop-color="#34D399"/></linearGradient>
    <linearGradient id="paper1-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF5E6"/><stop offset=".55" stop-color="#F3E3FF"/><stop offset="1" stop-color="#D8C2F7"/></linearGradient>
    <linearGradient id="paper2-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFD9EA"/><stop offset="1" stop-color="#F5A3CB"/></linearGradient>
    <linearGradient id="rib-${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7C3AED"/><stop offset=".5" stop-color="#C084FC"/><stop offset="1" stop-color="#7C3AED"/></linearGradient>
    <filter id="sh-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#2A1050" flood-opacity=".25"/></filter>
  </defs>
  <ellipse cx="160" cy="366" rx="70" ry="8" fill="#000" opacity=".14"/>
  <g>${fan}</g>
  <g>${babies}</g>
  <g>${stems}</g>
  <g>${heads}</g>
  <g filter="url(#sh-${uid})">
    <path d="M62 196 Q160 168 258 196 L 196 352 Q160 362 124 352 Z" fill="url(#paper2-${uid})"/>
    <path d="M70 186 Q160 156 250 186 L 188 340 Q160 350 132 340 Z" fill="url(#paper1-${uid})"/>
    <path d="M160 176 L 150 345 M160 176 L 188 340 M160 176 L 132 340 M110 182 L 138 342 M210 182 L 182 342" stroke="#fff" stroke-opacity=".55" stroke-width="1.3" fill="none"/>
    <path d="M70 186 Q160 156 250 186" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>
  </g>
  <g>
    <path d="M118 262 Q160 276 202 262 L 200 280 Q160 294 120 280 Z" fill="url(#rib-${uid})"/>
    <path d="M160 272 C 130 248, 104 252, 112 278 C 122 292, 148 282, 160 274 Z" fill="url(#rib-${uid})"/>
    <path d="M160 272 C 190 248, 216 252, 208 278 C 198 292, 172 282, 160 274 Z" fill="url(#rib-${uid})"/>
    <path d="M160 274 C 150 300, 140 322, 132 338 L 148 332 L 156 346 C 160 322, 162 298, 160 274 Z" fill="#7C3AED"/>
    <path d="M160 274 C 170 300, 180 322, 188 338 L 172 332 L 164 346 C 160 322, 158 298, 160 274 Z" fill="#A855F7"/>
    <ellipse cx="160" cy="272" rx="9" ry="8" fill="#9333EA"/><ellipse cx="157" cy="269" rx="3" ry="2.2" fill="#fff" opacity=".6"/>
  </g>
</svg>`;
}
