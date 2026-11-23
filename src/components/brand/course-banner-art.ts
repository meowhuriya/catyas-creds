/**
 * Original banner art for each course. The motif follows the subject
 * (matrices, molecules, quotes, circuits, code...), drawn as fine white line-work
 * over a deep gradient in the course's colour. Pure SVG markup, no images.
 */

export type Motif = "math" | "chem" | "lang" | "circuit" | "electric" | "code" | "physics" | "drawing" | "data" | "workshop" | "generic";

export function motifFor(code: string, title: string): Motif {
  const t = title.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has("chemistry")) return "chem";
  if (has("english", "communication", "language skills")) return "lang";
  if (has("electronic devices", "circuits", "organization and architecture")) return "circuit";
  if (has("electrical")) return "electric";
  if (has("physics", "quantum")) return "physics";
  if (has("drawing", "drafting", "graphics")) return "drawing";
  if (has("workshop") && !has("it workshop")) return "workshop";
  if (has("data structure", "algorithm", "database", "network", "discrete", "graph")) return "data";
  if (has("program", "python", "java", "it workshop", "software", "node", "react", "django", "operating")) return "code";
  if (code.toUpperCase().startsWith("MA") || has("calculus", "matrices", "mathemat", "equations", "statistic")) return "math";
  return "generic";
}

/** Deep and light shades of the course colour. */
function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k));
  return `#${ch.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

const W = 1200;
const H = 260;
const L = 'stroke="#fff" fill="none" stroke-linecap="round" stroke-linejoin="round"';

function motifArt(m: Motif, id: string): string {
  switch (m) {
    case "math":
      return `
      <g opacity=".9" ${L} stroke-width="2.2">
        <path d="M760 52 h-18 v156 h18" /><path d="M948 52 h18 v156 h-18" />
      </g>
      <g fill="#fff" font-family="ui-serif, Georgia, serif" font-style="italic" font-size="30" opacity=".92">
        ${[["2","−1","0"],["−1","2","−1"],["0","−1","2"]].map((r, i) => r.map((v, j) => `<text x="${790 + j * 58}" y="${98 + i * 48}" text-anchor="middle">${v}</text>`).join("")).join("")}
      </g>
      <text x="1040" y="178" fill="#fff" opacity=".22" font-family="ui-serif, Georgia, serif" font-size="210" font-style="italic" text-anchor="middle">∫</text>
      <text x="1112" y="96" fill="#fff" opacity=".55" font-family="ui-serif, Georgia, serif" font-size="34" font-style="italic">λ</text>
      <path d="M560 210 C 620 120, 660 120, 700 170 S 760 240, 820 150" ${L} stroke-width="1.6" opacity=".35" stroke-dasharray="3 7"/>
      <text x="1070" y="232" fill="#fff" opacity=".5" font-family="ui-serif, Georgia, serif" font-size="20" font-style="italic">det(A − λI) = 0</text>`;
    case "chem": {
      const hex = (cx: number, cy: number, r: number, o: number, inner = true) => {
        const pts = Array.from({ length: 6 }, (_, i) => { const a = (Math.PI / 3) * i - Math.PI / 6; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(" ");
        return `<polygon points="${pts}" ${L} stroke-width="2.2" opacity="${o}"/>${inner ? `<circle cx="${cx}" cy="${cy}" r="${r * 0.55}" ${L} stroke-width="1.6" opacity="${o * 0.8}"/>` : ""}`;
      };
      return `${hex(840, 118, 46, 0.9)}${hex(920, 164, 46, 0.75, false)}${hex(1000, 118, 46, 0.6)}
        <path d="M1040 95 L 1090 70 M 880 205 L 880 238 M 800 95 L 760 72" ${L} stroke-width="2.2" opacity=".75"/>
        <circle cx="1096" cy="66" r="8" fill="#fff" opacity=".85"/><circle cx="880" cy="244" r="7" fill="#fff" opacity=".7"/><circle cx="754" cy="68" r="9" fill="#fff" opacity=".8"/>
        <text x="1104" y="216" fill="#fff" opacity=".55" font-family="ui-sans-serif, system-ui" font-size="22" font-weight="600">C₆H₆</text>
        ${[[640,60],[680,200],[1150,150]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#fff" opacity=".5"/>`).join("")}`;
    }
    case "lang":
      return `
      <text x="760" y="218" fill="#fff" opacity=".16" font-family="ui-serif, Georgia, serif" font-size="300">“</text>
      <text x="840" y="140" fill="#fff" opacity=".92" font-family="ui-serif, Georgia, serif" font-size="88" font-style="italic">Aa</text>
      <g ${L} stroke-width="1.6" opacity=".38">${[168, 190, 212].map((y, i) => `<path d="M842 ${y} H ${1100 - i * 60}"/>`).join("")}</g>
      <text x="1000" y="96" fill="#fff" opacity=".55" font-family="ui-serif, Georgia, serif" font-size="22" font-style="italic">noun · verb · clause</text>
      <path d="M1116 60 l 18 -18 l 10 10 l -18 18 z M1116 60 l -6 16 l 16 -6" ${L} stroke-width="2" opacity=".7"/>`;
    case "circuit": {
      const pad = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="6" fill="#fff" opacity=".9"/><circle cx="${x}" cy="${y}" r="11" ${L} stroke-width="1.4" opacity=".4"/>`;
      return `
      <g ${L} stroke-width="2.2" opacity=".75">
        <path d="M640 70 H 760 L 800 110 H 900"/><path d="M640 190 H 720 L 760 150 H 860 L 900 190 H 1000"/>
        <path d="M900 110 H 930 M 960 110 H 1040 L 1080 70 H 1160"/>
        <path d="M1000 190 H 1060 L 1100 230 H 1160"/>
      </g>
      <g ${L} stroke-width="2.4" opacity=".95"><path d="M930 88 v44 M 960 88 v44"/><path d="M930 110 L 960 92 L 960 128 Z" fill="#fff" fill-opacity=".85"/></g>
      ${pad(640, 70)}${pad(640, 190)}${pad(1160, 70)}${pad(1160, 230)}${pad(900, 110)}
      <text x="1000" y="150" fill="#fff" opacity=".55" font-family="ui-monospace, monospace" font-size="17">I = Is·e^(V/VT)</text>`;
    }
    case "electric":
      return `
      <path d="M620 140 ${Array.from({ length: 14 }, (_, i) => `Q ${650 + i * 40} ${i % 2 ? 190 : 90}, ${670 + i * 40} 140`).join(" ")}" ${L} stroke-width="2" opacity=".3"/>
      <path d="M900 40 L 860 140 H 910 L 880 230 L 990 110 H 935 L 970 40 Z" fill="#fff" fill-opacity=".9"/>
      <text x="1010" y="72" fill="#fff" opacity=".75" font-family="ui-serif, Georgia, serif" font-size="38" font-style="italic">V = IR</text>
      <text x="1060" y="236" fill="#fff" opacity=".4" font-family="ui-serif, Georgia, serif" font-size="26">Ω</text>`;
    case "physics":
      return `
      <g ${L} stroke-width="1.8" opacity=".8" transform="translate(900 130)">
        <ellipse rx="150" ry="46"/><ellipse rx="150" ry="46" transform="rotate(60)"/><ellipse rx="150" ry="46" transform="rotate(-60)"/>
      </g>
      <circle cx="900" cy="130" r="16" fill="#fff" opacity=".95"/>
      <circle cx="1050" cy="130" r="6" fill="#fff"/><circle cx="825" cy="64" r="6" fill="#fff"/><circle cx="828" cy="200" r="6" fill="#fff"/>
      <text x="1080" y="230" fill="#fff" opacity=".5" font-family="ui-serif, Georgia, serif" font-size="26" font-style="italic">E = hν</text>`;
    case "drawing": {
      const iso = (x: number, y: number, s: number, o: number) => `<g ${L} stroke-width="2" opacity="${o}" transform="translate(${x} ${y})"><path d="M0 ${-s} L ${s * 0.87} ${-s / 2} L ${s * 0.87} ${s / 2} L 0 ${s} L ${-s * 0.87} ${s / 2} L ${-s * 0.87} ${-s / 2} Z M0 ${-s} V 0 M 0 0 L ${s * 0.87} ${-s / 2} M0 0 L ${-s * 0.87} ${-s / 2}"/><path d="M0 0 V ${s}" stroke-dasharray="4 6"/></g>`;
      return `${iso(900, 130, 80, 0.9)}${iso(1060, 170, 44, 0.55)}
        <g ${L} stroke-width="1.4" opacity=".55" transform="translate(0 -30)"><path d="M780 226 H 1020 M 780 218 v16 M 1020 218 v16"/></g>
        <text x="900" y="216" fill="#fff" opacity=".6" font-family="ui-monospace, monospace" font-size="16" text-anchor="middle">120 mm</text>
        <circle cx="720" cy="80" r="34" ${L} stroke-width="1.6" opacity=".4"/><path d="M686 80 H 754 M 720 46 V 114" ${L} stroke-width="1" opacity=".4"/>`;
    }
    case "data": {
      const nodes: [number, number][] = [[900, 54], [820, 130], [980, 130], [770, 206], [870, 206], [940, 206], [1030, 206]];
      const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
      return `<g ${L} stroke-width="2" opacity=".7">${edges.map(([a, b]) => `<path d="M${nodes[a][0]} ${nodes[a][1]} L ${nodes[b][0]} ${nodes[b][1]}"/>`).join("")}</g>
        ${nodes.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i ? 15 : 19}" fill="#fff" fill-opacity="${i ? 0.18 : 0.9}" stroke="#fff" stroke-width="2"/>`).join("")}
        <g ${L} stroke-width="1.8" opacity=".5">${[0, 1, 2, 3].map((i) => `<rect x="${1080 + i * 0}" y="${60 + i * 34}" width="70" height="28" rx="4"/>`).join("")}</g>
        <text x="1115" y="236" fill="#fff" opacity=".5" font-family="ui-monospace, monospace" font-size="16" text-anchor="middle">push / pop</text>`;
    }
    case "code":
      return `
      <text x="700" y="190" fill="#fff" opacity=".1" font-family="ui-monospace, monospace" font-size="220">{ }</text>
      <g font-family="ui-monospace, Menlo, monospace" font-size="20" fill="#fff">
        <text x="800" y="86" opacity=".55">for (i = 0; i &lt; n; i++) {</text>
        <text x="836" y="118" opacity=".9">sum += a[i];</text>
        <text x="836" y="150" opacity=".55">if (sum &gt; max) break;</text>
        <text x="800" y="182" opacity=".55">}</text>
        <text x="800" y="214" opacity=".75">printf("%d", sum);</text>
      </g>
      <rect x="832" y="100" width="3" height="22" fill="#fff" opacity=".9"/>
      <text x="1110" y="100" fill="#fff" opacity=".8" font-family="ui-monospace, monospace" font-size="44" font-weight="700">&lt;/&gt;</text>`;
    case "workshop": {
      const gear = (cx: number, cy: number, r: number, o: number) => {
        const teeth = Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<rect x="${-7}" y="${-r - 12}" width="14" height="16" rx="2" transform="rotate(${(a * 180) / Math.PI})"/>`; }).join("");
        return `<g transform="translate(${cx} ${cy})" opacity="${o}" ${L} stroke-width="2"><circle r="${r}"/><circle r="${r * 0.35}"/>${teeth}</g>`;
      };
      return `${gear(880, 120, 62, 0.9)}${gear(1000, 190, 38, 0.6)}${gear(1040, 80, 26, 0.45)}`;
    }
    default:
      return `<g ${L} stroke-width="1.6" opacity=".5">${[0, 1, 2, 3, 4].map((i) => `<circle cx="920" cy="130" r="${30 + i * 26}"/>`).join("")}</g><circle cx="920" cy="130" r="10" fill="#fff"/>`;
  }
}

export function courseBannerSvg(opts: { code: string; title: string; hue: string; uid: string; lab?: boolean }): string {
  const { hue } = opts;
  const uid = opts.uid.replace(/[^a-zA-Z0-9_-]/g, "");
  const m = motifFor(opts.code, opts.title);
  const deep = shade(hue, -0.55);
  const mid = shade(hue, -0.15);
  const light = shade(hue, 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMaxYMid slice" width="100%" height="100%" aria-hidden="true">
  <defs>
    <linearGradient id="bg-${uid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${deep}"/><stop offset=".55" stop-color="${mid}"/><stop offset="1" stop-color="${light}"/></linearGradient>
    <radialGradient id="orb-${uid}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="dots-${uid}" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="#fff" opacity=".14"/></pattern>
    <linearGradient id="fade-${uid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".55" stop-color="#000" stop-opacity="0"/></linearGradient>
    <filter id="glow-${uid}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#fff" flood-opacity=".35"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg-${uid})"/>
  <rect width="${W}" height="${H}" fill="url(#dots-${uid})"/>
  <circle cx="940" cy="-40" r="260" fill="url(#orb-${uid})"/>
  <circle cx="1180" cy="300" r="200" fill="url(#orb-${uid})" opacity=".7"/>
  <path d="M520 ${H} L 700 0 L 760 0 L 580 ${H} Z" fill="#fff" opacity=".05"/>
  <path d="M600 ${H} L 780 0 L 800 0 L 620 ${H} Z" fill="#fff" opacity=".06"/>
  <g filter="url(#glow-${uid})">${motifArt(m, uid)}</g>
  <rect width="${W}" height="${H}" fill="url(#fade-${uid})"/>
</svg>`;
}
