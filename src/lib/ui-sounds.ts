/**
 * UI sound palette, synthesized live with Web Audio (no audio files).
 * Each sound is a pure function of (bus, start time) so the same code runs
 * in the app and in an OfflineAudioContext for testing / previews.
 *
 * Character: soft, rounded, a little glassy. Short bodies with a gentle room
 * tail, nothing harsh above ~5 kHz, so hundreds of clicks a day stay pleasant.
 */

export interface Bus {
  ctx: BaseAudioContext;
  /** dry input of the master chain */
  dry: AudioNode;
  /** send into the shared room reverb */
  wet: AudioNode;
}

/** Master chain: low cut → soft compressor → out, plus a small generated room. */
export function makeBus(ctx: BaseAudioContext, dest: AudioNode, level = 1): Bus & { master: GainNode } {
  const master = ctx.createGain();
  master.gain.value = level;
  const lowcut = ctx.createBiquadFilter();
  lowcut.type = "highpass";
  lowcut.frequency.value = 70;
  const air = ctx.createBiquadFilter();
  air.type = "highshelf";
  air.frequency.value = 6000;
  air.gain.value = -6;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.002;
  comp.release.value = 0.12;
  lowcut.connect(air).connect(comp).connect(master).connect(dest);

  // Small, bright room: decaying stereo noise, 0.6 s
  const len = Math.floor(ctx.sampleRate * 0.6);
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2) * (i < 40 ? i / 40 : 1);
  }
  const verb = ctx.createConvolver();
  verb.buffer = ir;
  const verbTone = ctx.createBiquadFilter();
  verbTone.type = "lowpass";
  verbTone.frequency.value = 3800;
  const wet = ctx.createGain();
  wet.gain.value = 0.32;
  wet.connect(verb).connect(verbTone).connect(lowcut);
  return { ctx, dry: lowcut, wet, master };
}

/* ---------- building blocks ---------- */

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function out(bus: Bus, node: AudioNode, send = 0.15) {
  node.connect(bus.dry);
  if (send > 0) {
    const s = bus.ctx.createGain();
    s.gain.value = send;
    node.connect(s).connect(bus.wet);
  }
}

/** Sine "body" with a quick downward pitch settle: the thump of a soft key. */
function body(bus: Bus, t: number, f: number, peak: number, decay: number, send = 0.12, drop = 1.5) {
  const o = bus.ctx.createOscillator();
  const g = bus.ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(f * drop, t);
  o.frequency.exponentialRampToValueAtTime(f, t + Math.min(0.03, decay * 0.6));
  env(g, t, peak, 0.0015, decay);
  o.connect(g);
  out(bus, g, send);
  o.start(t);
  o.stop(t + decay + 0.02);
}

let noiseCache: AudioBuffer | null = null;
function noiseBuf(ctx: BaseAudioContext) {
  if (noiseCache && noiseCache.sampleRate === ctx.sampleRate) return noiseCache;
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return (noiseCache = b);
}

/** Filtered noise flick: the "contact" of the click. */
function flick(bus: Bus, t: number, f: number, peak: number, decay: number, q = 1.1, send = 0.08) {
  const n = bus.ctx.createBufferSource();
  n.buffer = noiseBuf(bus.ctx);
  const bp = bus.ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = f;
  bp.Q.value = q;
  const g = bus.ctx.createGain();
  env(g, t, peak, 0.0008, decay);
  n.connect(bp).connect(g);
  out(bus, g, send);
  n.start(t);
  n.stop(t + decay + 0.01);
}

/** Glassy pluck: fundamental + soft inharmonic partials, like a tiny mallet on glass. */
function pluck(bus: Bus, t: number, f: number, peak: number, decay: number, send = 0.3) {
  const parts: [number, number, number][] = [
    [1, 1, 1],
    [2.01, 0.28, 0.55],
    [3.98, 0.1, 0.3],
  ];
  for (const [mul, amp, dk] of parts) {
    const o = bus.ctx.createOscillator();
    const g = bus.ctx.createGain();
    o.type = "sine";
    o.frequency.value = f * mul;
    env(g, t, peak * amp, 0.002, decay * dk);
    o.connect(g);
    out(bus, g, send);
    o.start(t);
    o.stop(t + decay * dk + 0.03);
  }
}

/** Marimba-ish note: warm fundamental with a fast-dying 4th partial. */
function mallet(bus: Bus, t: number, f: number, peak: number, decay: number, send = 0.25) {
  const o = bus.ctx.createOscillator();
  const g = bus.ctx.createGain();
  o.type = "sine";
  o.frequency.value = f;
  env(g, t, peak, 0.003, decay);
  o.connect(g);
  out(bus, g, send);
  o.start(t);
  o.stop(t + decay + 0.03);
  const h = bus.ctx.createOscillator();
  const hg = bus.ctx.createGain();
  h.type = "sine";
  h.frequency.value = f * 3.95;
  env(hg, t, peak * 0.35, 0.001, decay * 0.12);
  h.connect(hg);
  out(bus, hg, send * 0.5);
  h.start(t);
  h.stop(t + decay * 0.12 + 0.03);
  flick(bus, t, Math.min(4200, f * 4), peak * 0.25, 0.008, 1.4, 0);
}

const jitter = (amt = 0.025) => 1 + (Math.random() - 0.5) * amt;

/* ---------- the palette ---------- */

/** Everyday button press: soft rounded "tok". */
export function press(bus: Bus, t: number) {
  const j = jitter();
  body(bus, t, 190 * j, 0.42, 0.05, 0.06);
  flick(bus, t, 2100 * j, 0.22, 0.012, 1.0, 0.05);
  pluck(bus, t + 0.001, 1240 * j, 0.035, 0.05, 0.1);
}

/** Lighter tick for links, tabs and navigation. */
export function tick(bus: Bus, t: number) {
  const j = jitter();
  body(bus, t, 330 * j, 0.22, 0.03, 0.04, 1.3);
  flick(bus, t, 3200 * j, 0.14, 0.008, 1.3, 0.04);
}

/** Main / submit button: the tok plus a soft rounded "bloop" up a fifth. */
export function primary(bus: Bus, t: number) {
  const j = jitter(0.015);
  body(bus, t, 170 * j, 0.45, 0.06, 0.06);
  flick(bus, t, 1900 * j, 0.2, 0.012, 1.0, 0.05);
  pluck(bus, t + 0.012, 587 * j, 0.09, 0.22, 0.3);
  pluck(bus, t + 0.05, 880 * j, 0.07, 0.26, 0.35);
}

/** Destructive action: low, muted, a little more weight. */
export function danger(bus: Bus, t: number) {
  body(bus, t, 120, 0.5, 0.09, 0.05, 1.25);
  flick(bus, t, 900, 0.18, 0.016, 0.8, 0.04);
}

/** Checkbox / switch: rising glass pair when on, falling and softer when off. */
export function toggle(bus: Bus, t: number, on: boolean) {
  const j = jitter(0.01);
  body(bus, t, on ? 240 : 200, 0.25, 0.035, 0.03);
  if (on) {
    pluck(bus, t + 0.004, 784 * j, 0.12, 0.18);
    pluck(bus, t + 0.055, 1175 * j, 0.1, 0.24);
  } else {
    pluck(bus, t + 0.004, 880 * j, 0.07, 0.12);
    pluck(bus, t + 0.05, 659 * j, 0.06, 0.14);
  }
}

/** Correct answer: marimba arpeggio, climbing with the streak. */
export function correct(bus: Bus, t: number, streak = 1) {
  const k = Math.pow(2, Math.min(Math.max(streak - 1, 0), 6) / 12);
  [523.25, 659.25, 783.99].forEach((f, i) => mallet(bus, t + i * 0.075, f * k, 0.3, 0.45));
}

/** Wrong answer: gentle low double "bonk", never harsh. */
export function wrong(bus: Bus, t: number) {
  mallet(bus, t, 196, 0.28, 0.22, 0.12);
  mallet(bus, t + 0.11, 165, 0.24, 0.3, 0.12);
}

/** A flower bloomed (focus session done): bell-like chord that opens upward. */
export function bloom(bus: Bus, t: number) {
  [659.25, 830.61, 987.77, 1318.51].forEach((f, i) => pluck(bus, t + i * 0.09, f, 0.16 - i * 0.02, 1.4, 0.55));
  mallet(bus, t, 329.63, 0.16, 1.1, 0.4);
}

/** Break over: two calm notes, a nudge rather than an alarm. */
export function nudge(bus: Bus, t: number) {
  pluck(bus, t, 523.25, 0.14, 0.9, 0.45);
  pluck(bus, t + 0.16, 783.99, 0.12, 1.1, 0.5);
}

/** Mastery: warm chord arpeggio with a shimmering top. */
export function fanfare(bus: Bus, t: number) {
  [261.63, 329.63, 392.0, 493.88, 587.33, 783.99].forEach((f, i) => mallet(bus, t + i * 0.07, f, 0.24, 1.3 - i * 0.08, 0.4));
  [1567.98, 2093.0].forEach((f, i) => pluck(bus, t + 0.45 + i * 0.06, f, 0.05, 1.2, 0.7));
}

/** Badge hover: airy glass sparkle. */
export function shimmer(bus: Bus, t: number) {
  [1318.51, 1975.53, 2637.02].forEach((f, i) => pluck(bus, t + i * 0.04, f, 0.1, 0.4, 0.6));
}


/* ---------- v2: one subtle click + two moments ---------- */

/** The only UI click: a small, crisp "klick". Quiet and dry. */
export function klick(bus: Bus, t: number) {
  const j = jitter(0.04);
  flick(bus, t, 4600 * j, 0.22, 0.006, 2.2, 0.02);
  flick(bus, t + 0.0035, 2600 * j, 0.09, 0.009, 1.6, 0.02);
  const o = bus.ctx.createOscillator();
  const g = bus.ctx.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(1850 * j, t);
  o.frequency.exponentialRampToValueAtTime(1200 * j, t + 0.012);
  env(g, t, 0.05, 0.0008, 0.012);
  o.connect(g);
  out(bus, g, 0);
  o.start(t);
  o.stop(t + 0.02);
}

/** Egg is ready to hatch (end of a focus session): one soft bell. */
export function ready(bus: Bus, t: number) {
  pluck(bus, t, 987.77, 0.12, 1.2, 0.5);
  pluck(bus, t + 0.12, 1318.51, 0.08, 1.4, 0.55);
}

/** Tap the egg: three cracks, then a pop and sparkle as the food comes out. */
export function hatch(bus: Bus, t: number) {
  [0, 0.16, 0.3].forEach((d, i) => {
    flick(bus, t + d, 1800 + i * 500, 0.35, 0.02, 0.9, 0.05);
    flick(bus, t + d + 0.008, 3400, 0.18, 0.015, 1.4, 0.05);
    body(bus, t + d, 180 + i * 30, 0.2, 0.05, 0.05);
  });
  const p = t + 0.52;
  body(bus, p, 260, 0.4, 0.12, 0.15, 0.6); // pitch rises: a pop
  [1046.5, 1318.51, 1567.98, 2093.0].forEach((f, i) => pluck(bus, p + 0.05 + i * 0.05, f, 0.08, 0.8, 0.6));
}

/** Rank-up: a rising whoosh, a heavy impact, then a bright shimmering chord. */
export function rankUp(bus: Bus, t: number) {
  const ctx = bus.ctx;
  // riser
  const n = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.7);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = b;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.Q.value = 2.5;
  bp.frequency.setValueAtTime(300, t);
  bp.frequency.exponentialRampToValueAtTime(3800, t + 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.64);
  n.connect(bp).connect(g);
  out(bus, g, 0.2);
  n.start(t);
  n.stop(t + 0.7);
  // impact
  const hit = t + 0.6;
  body(bus, hit, 55, 0.9, 0.5, 0.25, 2.2);
  flick(bus, hit, 1200, 0.45, 0.08, 0.6, 0.3);
  // shimmer chord (E major add9, opening upward)
  [329.63, 493.88, 659.25, 739.99, 987.77, 1318.51].forEach((f, i) => pluck(bus, hit + 0.04 + i * 0.045, f, 0.13 - i * 0.012, 2.2, 0.65));
  [2637.02, 3135.96].forEach((f, i) => pluck(bus, hit + 0.35 + i * 0.08, f, 0.03, 1.2, 0.8));
}
