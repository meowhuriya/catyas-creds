/**
 * Sound engine for Valeria's Creds.
 * All sounds are synthesized live (see ui-sounds.ts), no audio files.
 * Sounds fire on press (pointerdown) so they feel instant, and vary by what you press:
 * main buttons, ordinary buttons, links/tabs, destructive actions, checkboxes.
 */
import * as React from "react";
import * as UI from "@/lib/ui-sounds";

export interface SoundSettings {
  soundEnabled: boolean;
  volume: number; // 0.0 to 1.0
  brownNoiseActive: boolean;
  brownNoiseVolume: number; // 0.0 to 1.0
}

const STORAGE_KEY_SOUND_ENABLED = "valeria_sound_enabled";
const STORAGE_KEY_VOLUME = "valeria_sound_volume";
const STORAGE_KEY_BROWN_NOISE = "valeria_brown_noise_active";

type Kind = "press" | "tick" | "primary" | "danger";

export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bus: UI.Bus | null = null;
  private brownNoiseNode: AudioBufferSourceNode | null = null;
  private brownNoiseGain: GainNode | null = null;
  private brownNoiseFilter: BiquadFilterNode | null = null;

  private soundEnabled = true;
  private volume = 0.35;
  private brownNoiseActive = false;
  private brownNoiseVolume = 0.25;

  private listeners: Set<() => void> = new Set();
  private shimmerThrottle = 0;
  private isGlobalClickListenerAttached = false;
  private lastClickSoundTime = 0;

  private constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedEnabled = localStorage.getItem(STORAGE_KEY_SOUND_ENABLED);
        if (savedEnabled !== null) this.soundEnabled = savedEnabled === "true";
        const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) this.volume = parsed;
        }
        const savedBrown = localStorage.getItem(STORAGE_KEY_BROWN_NOISE);
        if (savedBrown !== null) this.brownNoiseActive = savedBrown === "true";
      } catch {}

      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY_SOUND_ENABLED && e.newValue !== null) {
          this.soundEnabled = e.newValue === "true";
          this.notify();
        } else if (e.key === STORAGE_KEY_VOLUME && e.newValue !== null) {
          this.volume = parseFloat(e.newValue) || 0.35;
          if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
          this.notify();
        }
      });
    }
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) SoundEngine.instance = new SoundEngine();
    return SoundEngine.instance;
  }

  /** Lazily create the AudioContext on a user gesture (autoplay rules). */
  private initContext(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!this.ctx) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx({ latencyHint: "interactive" });
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
        this.bus = UI.makeBus(this.ctx, this.masterGain, 1.7);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return true;
    } catch {
      return false;
    }
  }

  /** Runs a palette sound if sound is on. */
  private play(fn: (bus: UI.Bus, t: number) => void): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.bus) return;
    try {
      fn(this.bus, this.ctx.currentTime + 0.005);
    } catch {}
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public getVolume(): number {
    return this.volume;
  }

  public isBrownNoiseActive(): boolean {
    return this.brownNoiseActive;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem(STORAGE_KEY_SOUND_ENABLED, String(enabled));
    } catch {}
    this.notify();
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toFixed(2));
    } catch {}
    this.notify();
  }

  /* ---------------- the sounds ---------------- */

  private throttled(): boolean {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastClickSoundTime < 35) return true;
    this.lastClickSoundTime = now;
    return false;
  }

  /** Ordinary button press. */
  public playClick(kind: Kind = "press"): void {
    if (this.throttled()) return;
    this.play(kind === "tick" ? UI.tick : kind === "primary" ? UI.primary : kind === "danger" ? UI.danger : UI.press);
  }
  public playTick(): void {
    this.playClick("tick");
  }
  public playPrimary(): void {
    this.playClick("primary");
  }
  public playDanger(): void {
    this.playClick("danger");
  }
  public playToggle(isOn: boolean): void {
    this.play((b, t) => UI.toggle(b, t, isOn));
  }
  public playCorrect(streakCount = 1): void {
    this.play((b, t) => UI.correct(b, t, streakCount));
  }
  public playWrong(): void {
    this.play(UI.wrong);
  }
  public playMasteryFanfare(): void {
    this.play(UI.fanfare);
  }
  /** A focus session finished and a flower bloomed. */
  public playBloom(): void {
    this.play(UI.bloom);
  }
  /** Break is over. */
  public playNudge(): void {
    this.play(UI.nudge);
  }
  public playBadgeShimmer(): void {
    const now = Date.now();
    if (now - this.shimmerThrottle < 180) return;
    this.shimmerThrottle = now;
    this.play(UI.shimmer);
  }

  /** Which sound an element gets. */
  private kindOf(el: HTMLElement): Kind {
    const cls = typeof el.className === "string" ? el.className : "";
    const label = `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.trim().toLowerCase();
    if (/bg-red|bg-app-danger|text-red/.test(cls) || /^(delete|remove|clear)\b/.test(label)) return "danger";
    if (/vc-btn-primary|pro-btn-solid/.test(cls) || (el instanceof HTMLButtonElement && el.type === "submit")) return "primary";
    const role = el.getAttribute("role");
    if (el.tagName === "A" || role === "tab" || role === "link" || role === "menuitem" || role === "option" || el.tagName === "SUMMARY") return "tick";
    return "press";
  }

  /**
   * Plays a sound for every press on a working control anywhere in the app.
   * Buttons and links sound on pointer-down (instant); checkboxes and switches on click,
   * once their new state is known. Typing fields stay silent.
   */
  public attachGlobalClickListener(): () => void {
    if (typeof window === "undefined" || this.isGlobalClickListenerAttached) return () => {};
    this.isGlobalClickListenerAttached = true;

    const selector = [
      "button",
      "a[href]",
      "summary",
      "label",
      '[role="button"]',
      '[role="tab"]',
      '[role="switch"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="link"]',
      "[data-clickable]",
      "[data-interactive]",
      ".cursor-pointer",
    ].join(", ");

    const isDisabled = (el: HTMLElement) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (el as any).disabled ||
      el.getAttribute("aria-disabled") === "true" ||
      el.classList.contains("disabled") ||
      el.classList.contains("pointer-events-none") ||
      !!el.closest("[aria-disabled='true'], [disabled]");

    const onDown = (event: PointerEvent) => {
      if (!this.soundEnabled || this.volume <= 0) return;
      if (event.button !== 0) return;
      const target = event.target as Element | null;
      if (!target || !(target instanceof Element)) return;
      if (target.closest("input, select, textarea, [contenteditable='true']")) return; // typing / toggles handled elsewhere
      const el = target.closest(selector) as HTMLElement | null;
      if (!el || isDisabled(el)) return;
      const role = el.getAttribute("role");
      if (role === "switch" || role === "checkbox" || role === "radio") return; // on click, with state
      if (el.tagName === "LABEL" && el.querySelector("input[type=checkbox], input[type=radio]")) return;
      this.playClick(this.kindOf(el));
    };

    const onClick = (event: MouseEvent) => {
      if (!this.soundEnabled || this.volume <= 0) return;
      const target = event.target as Element | null;
      if (!target || !(target instanceof Element)) return;
      const input = target.closest("input[type=checkbox], input[type=radio]") as HTMLInputElement | null;
      if (input) {
        if (!input.disabled) this.playToggle(input.checked);
        return;
      }
      const sw = target.closest('[role="switch"], [role="checkbox"], [role="radio"]') as HTMLElement | null;
      if (sw && !isDisabled(sw)) this.playToggle(sw.getAttribute("aria-checked") !== "true");
    };

    // Keyboard: Enter / Space on a focused button or link
    const onKey = (event: KeyboardEvent) => {
      if (!this.soundEnabled || this.volume <= 0 || event.repeat) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      const el = document.activeElement as HTMLElement | null;
      if (!el || el.matches("input, select, textarea, [contenteditable='true']")) return;
      if (el.matches(selector) && !isDisabled(el)) this.playClick(this.kindOf(el));
    };

    window.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    window.addEventListener("click", onClick, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, { capture: true, passive: true });

    return () => {
      window.removeEventListener("pointerdown", onDown, { capture: true });
      window.removeEventListener("click", onClick, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
      this.isGlobalClickListenerAttached = false;
    };
  }

  /* ---------------- focus background noise ---------------- */
  public toggleBrownNoise(active?: boolean): boolean {
    const shouldBeActive = active !== undefined ? active : !this.brownNoiseActive;
    this.brownNoiseActive = shouldBeActive;
    try {
      localStorage.setItem(STORAGE_KEY_BROWN_NOISE, String(shouldBeActive));
    } catch {}

    if (!this.initContext() || !this.ctx) {
      this.notify();
      return shouldBeActive;
    }

    const t = this.ctx.currentTime;
    if (shouldBeActive) {
      if (!this.brownNoiseNode) {
        const bufferSize = this.ctx.sampleRate * 5;
        const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.2;
          }
        }
        this.brownNoiseNode = this.ctx.createBufferSource();
        this.brownNoiseNode.buffer = buffer;
        this.brownNoiseNode.loop = true;
        this.brownNoiseFilter = this.ctx.createBiquadFilter();
        this.brownNoiseFilter.type = "lowpass";
        this.brownNoiseFilter.frequency.setValueAtTime(380, t);
        this.brownNoiseGain = this.ctx.createGain();
        this.brownNoiseGain.gain.setValueAtTime(0.0001, t);
        this.brownNoiseGain.gain.linearRampToValueAtTime(this.brownNoiseVolume * 0.35, t + 0.8);
        this.brownNoiseNode.connect(this.brownNoiseFilter);
        this.brownNoiseFilter.connect(this.brownNoiseGain);
        this.brownNoiseGain.connect(this.ctx.destination);
        this.brownNoiseNode.start(t);
      }
    } else if (this.brownNoiseGain && this.brownNoiseNode) {
      this.brownNoiseGain.gain.setValueAtTime(this.brownNoiseGain.gain.value, t);
      this.brownNoiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      const oldNode = this.brownNoiseNode;
      setTimeout(() => {
        try {
          oldNode.stop();
          oldNode.disconnect();
        } catch {}
      }, 850);
      this.brownNoiseNode = null;
      this.brownNoiseGain = null;
    }
    this.notify();
    return shouldBeActive;
  }
}

export function useSound() {
  const engine = React.useMemo(() => SoundEngine.getInstance(), []);
  const [, setTick] = React.useState(0);

  React.useEffect(() => engine.subscribe(() => setTick((prev) => prev + 1)), [engine]);

  return {
    soundEnabled: engine.isSoundEnabled(),
    volume: engine.getVolume(),
    brownNoiseActive: engine.isBrownNoiseActive(),
    toggleSound: () => engine.setSoundEnabled(!engine.isSoundEnabled()),
    setSoundEnabled: (v: boolean) => engine.setSoundEnabled(v),
    setVolume: (v: number) => engine.setVolume(v),
    toggleBrownNoise: (active?: boolean) => engine.toggleBrownNoise(active),
    playClick: () => engine.playClick(),
    playTick: () => engine.playTick(),
    playPrimary: () => engine.playPrimary(),
    playDanger: () => engine.playDanger(),
    playToggle: (isOn: boolean) => engine.playToggle(isOn),
    playCorrect: (streak = 1) => engine.playCorrect(streak),
    playWrong: () => engine.playWrong(),
    playMasteryFanfare: () => engine.playMasteryFanfare(),
    playBloom: () => engine.playBloom(),
    playNudge: () => engine.playNudge(),
    playBadgeShimmer: () => engine.playBadgeShimmer(),
    attachGlobalClickListener: () => engine.attachGlobalClickListener(),
  };
}
