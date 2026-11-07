/**
 * Procedural Web Audio Synthesizer & Sound Engine
 * Valeria's Creds - Heritage Gingham Micro-Interactions
 * 
 * Zero external audio files (.mp3/.wav), zero latency, 100% procedurally synthesized
 * using the native HTML5 Web Audio API (AudioContext).
 */

export interface SoundSettings {
  soundEnabled: boolean;
  volume: number; // 0.0 to 1.0
  brownNoiseActive: boolean;
  brownNoiseVolume: number; // 0.0 to 1.0
}

const STORAGE_KEY_SOUND_ENABLED = "valeria_sound_enabled";
const STORAGE_KEY_VOLUME = "valeria_sound_volume";
const STORAGE_KEY_BROWN_NOISE = "valeria_brown_noise_active";

export class SoundEngine {
  private static instance: SoundEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private brownNoiseNode: AudioBufferSourceNode | null = null;
  private brownNoiseGain: GainNode | null = null;
  private brownNoiseFilter: BiquadFilterNode | null = null;

  private soundEnabled: boolean = true;
  private volume: number = 0.35;
  private brownNoiseActive: boolean = false;
  private brownNoiseVolume: number = 0.25;

  private listeners: Set<() => void> = new Set();
  private shimmerThrottle: number = 0;
  private isGlobalClickListenerAttached: boolean = false;
  private lastClickSoundTime: number = 0;

  private constructor() {
    if (typeof window !== "undefined") {
      try {
        const savedEnabled = localStorage.getItem(STORAGE_KEY_SOUND_ENABLED);
        if (savedEnabled !== null) {
          this.soundEnabled = savedEnabled === "true";
        }
        const savedVol = localStorage.getItem(STORAGE_KEY_VOLUME);
        if (savedVol !== null) {
          const parsed = parseFloat(savedVol);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
            this.volume = parsed;
          }
        }
        const savedBrown = localStorage.getItem(STORAGE_KEY_BROWN_NOISE);
        if (savedBrown !== null) {
          this.brownNoiseActive = savedBrown === "true";
        }
      } catch {}

      // Listen for storage changes across tabs
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY_SOUND_ENABLED && e.newValue !== null) {
          this.soundEnabled = e.newValue === "true";
          this.notify();
        } else if (e.key === STORAGE_KEY_VOLUME && e.newValue !== null) {
          this.volume = parseFloat(e.newValue) || 0.35;
          if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
          }
          this.notify();
        }
      });
    }
  }

  public static getInstance(): SoundEngine {
    if (!SoundEngine.instance) {
      SoundEngine.instance = new SoundEngine();
    }
    return SoundEngine.instance;
  }

  /**
   * Lazily initialize AudioContext on user gesture to comply with browser autoplay policies.
   */
  private initContext(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return false;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }

      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }

      return true;
    } catch {
      return false;
    }
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
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(clamped, this.ctx.currentTime);
    }
    try {
      localStorage.setItem(STORAGE_KEY_VOLUME, clamped.toFixed(2));
    } catch {}
    this.notify();
  }

  // =========================================================================
  // 1. playClick(): Modern, silky, tactile acoustic transient sound (pleasant to ears, anti-fatigue)
  // =========================================================================
  public playClick(): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    // 25ms throttle to eliminate double-clicks from event bubbling
    if (now - this.lastClickSoundTime < 25) {
      return;
    }
    this.lastClickSoundTime = now;

    const t = this.ctx.currentTime;
    // Anti-fatigue organic micro-pitch jitter (±1.5%) so repeated clicks stay pleasant and natural
    const pitchJitter = 1 + (Math.random() - 0.5) * 0.03;
    const dur = 0.016; // 16ms

    // A. Warm Organic Sine Core: Smooth glide 560Hz -> 260Hz
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(560 * pitchJitter, t);
    osc.frequency.exponentialRampToValueAtTime(260 * pitchJitter, t + dur);

    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.linearRampToValueAtTime(0.22, t + 0.0015);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + dur + 0.002);

    // B. Silky Acoustic Tap Transient: Warm low-bandpass filtered noise (1450Hz, Q: 1.5)
    // Non-fatiguing gentle acoustic impulse, like a smooth ceramic or pebble tap
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * 0.008));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Soft decayed pink noise distribution
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = "bandpass";
    bandpass.frequency.setValueAtTime(1450 * pitchJitter, t);
    bandpass.Q.setValueAtTime(1.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.008);

    noiseSource.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseSource.start(t);
    noiseSource.stop(t + 0.01);

    // C. Subtle High-Frequency Air Harmonic (Precision Snap)
    const airOsc = this.ctx.createOscillator();
    const airGain = this.ctx.createGain();
    airOsc.type = "triangle";
    airOsc.frequency.setValueAtTime(1120 * pitchJitter, t);
    airOsc.frequency.exponentialRampToValueAtTime(740 * pitchJitter, t + 0.009);

    airGain.gain.setValueAtTime(0.001, t);
    airGain.gain.linearRampToValueAtTime(0.06, t + 0.001);
    airGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.009);

    airOsc.connect(airGain);
    airGain.connect(this.masterGain);

    airOsc.start(t);
    airOsc.stop(t + 0.011);
  }

  /**
   * Automatically captures every click on any working/interactive element in the app,
   * generating a modern, pleasant, professional tactile sound with anti-fatigue tuning.
   */
  public attachGlobalClickListener(): () => void {
    if (typeof window === "undefined" || this.isGlobalClickListenerAttached) {
      return () => {};
    }

    this.isGlobalClickListenerAttached = true;

    const handleGlobalClick = (event: MouseEvent) => {
      // Respect global sound enabled and master volume
      if (!this.soundEnabled || this.volume <= 0) return;

      const target = event.target as HTMLElement | null;
      if (!target || !(target instanceof Element)) return;

      // Match any clickable/interactive working element
      const interactiveSelector = [
        "button",
        "a[href]",
        "input",
        "select",
        "textarea",
        "summary",
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

      const workingElement = target.closest(interactiveSelector) as HTMLElement | null;

      if (!workingElement) {
        // Fallback: check if the computed style has cursor: pointer
        try {
          const style = window.getComputedStyle(target);
          if (style && style.cursor === "pointer") {
            this.playClick();
          }
        } catch {}
        return;
      }

      // Check if element is disabled or non-working
      const isDisabled =
        (workingElement as any).disabled ||
        workingElement.getAttribute("aria-disabled") === "true" ||
        workingElement.classList.contains("disabled") ||
        workingElement.classList.contains("pointer-events-none") ||
        workingElement.closest("[aria-disabled='true'], [disabled]");

      if (isDisabled) return;

      // Distinguish toggles/checkboxes vs standard clicks
      const isCheckboxOrRadio =
        workingElement instanceof HTMLInputElement &&
        (workingElement.type === "checkbox" || workingElement.type === "radio");
      const isSwitchRole = workingElement.getAttribute("role") === "switch";

      if (isCheckboxOrRadio) {
        const input = workingElement as HTMLInputElement;
        this.playToggle(input.checked);
      } else if (isSwitchRole) {
        const isChecked = workingElement.getAttribute("aria-checked") === "true";
        this.playToggle(!isChecked);
      } else {
        this.playClick();
      }
    };

    // Use capture phase so all dynamic React elements, portals, modals, and drawers are covered
    window.addEventListener("click", handleGlobalClick, { capture: true, passive: true });

    return () => {
      window.removeEventListener("click", handleGlobalClick, { capture: true });
      this.isGlobalClickListenerAttached = false;
    };
  }

  // =========================================================================
  // 2. playToggle(isOn: boolean): Subtle two-tone woodblock tick
  // =========================================================================
  public playToggle(isOn: boolean): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const t = this.ctx.currentTime;
    const f1 = isOn ? 720 : 600;
    const f2 = isOn ? 960 : 420;

    // First woodblock tap
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(f1, t);
    osc1.frequency.exponentialRampToValueAtTime(f1 * 0.75, t + 0.035);

    gain1.gain.setValueAtTime(0.22, t);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.04);

    // Second staggered tap (25ms later)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(f2, t + 0.025);
    osc2.frequency.exponentialRampToValueAtTime(f2 * 0.8, t + 0.06);

    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.setValueAtTime(0.18, t + 0.025);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.025);
    osc2.stop(t + 0.07);
  }

  // =========================================================================
  // 3. playCorrect(streakCount): Warm marimba triad (C5 -> E5 -> G5) with streak pitch
  // =========================================================================
  public playCorrect(streakCount = 1): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const t = this.ctx.currentTime;
    // Shift up to 6 semitones for consecutive streak
    const semitones = Math.min(Math.max(streakCount - 1, 0), 6);
    const multiplier = Math.pow(2, semitones / 12);

    // Base triad: C5 (523.25), E5 (659.25), G5 (783.99)
    const baseFreqs = [523.25, 659.25, 783.99];

    baseFreqs.forEach((freq, idx) => {
      const noteTime = t + idx * 0.07;
      const targetFreq = freq * multiplier;
      const dur = 0.22;

      // Primary warm triangle
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(targetFreq, noteTime);

      // Soft marimba attack & warm release
      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur);

      // Secondary sine harmonic for wood resonance
      const oscHarmonic = this.ctx!.createOscillator();
      const gainHarmonic = this.ctx!.createGain();
      oscHarmonic.type = "sine";
      oscHarmonic.frequency.setValueAtTime(targetFreq * 2, noteTime);

      gainHarmonic.gain.setValueAtTime(0.001, noteTime);
      gainHarmonic.gain.linearRampToValueAtTime(0.08, noteTime + 0.003);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.0001, noteTime + dur * 0.6);

      osc.connect(gain);
      oscHarmonic.connect(gainHarmonic);
      gain.connect(this.masterGain!);
      gainHarmonic.connect(this.masterGain!);

      osc.start(noteTime);
      oscHarmonic.start(noteTime);
      osc.stop(noteTime + dur + 0.01);
      oscHarmonic.stop(noteTime + dur + 0.01);
    });
  }

  // =========================================================================
  // 4. playWrong(): Soft, non-punishing low-pass muted double-thud (165Hz -> 125Hz)
  // =========================================================================
  public playWrong(): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const t = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(260, t);
    filter.connect(this.masterGain);

    // Thud 1: 165Hz -> 135Hz
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(165, t);
    osc1.frequency.exponentialRampToValueAtTime(135, t + 0.07);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.25, t + 0.003);
    gain1.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);

    osc1.connect(gain1);
    gain1.connect(filter);
    osc1.start(t);
    osc1.stop(t + 0.09);

    // Thud 2: 140Hz -> 110Hz (at t + 85ms)
    const t2 = t + 0.085;
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(140, t2);
    osc2.frequency.exponentialRampToValueAtTime(110, t2 + 0.08);

    gain2.gain.setValueAtTime(0.001, t2);
    gain2.gain.linearRampToValueAtTime(0.2, t2 + 0.003);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.09);

    osc2.connect(gain2);
    gain2.connect(filter);
    osc2.start(t2);
    osc2.stop(t2 + 0.1);
  }

  // =========================================================================
  // 5. playMasteryFanfare(): Lush, resonant academic chord arpeggio (C4, E4, G4, B4, D5, G5)
  // =========================================================================
  public playMasteryFanfare(): void {
    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const t = this.ctx.currentTime;
    // Academic Maj9 triad arpeggio: C4, E4, G4, B4, D5, G5
    const notes = [
      261.63, // C4
      329.63, // E4
      392.00, // G4
      493.88, // B4
      587.33, // D5
      783.99, // G5 (Triumphant Octave)
    ];

    const warmFilter = this.ctx.createBiquadFilter();
    warmFilter.type = "lowpass";
    warmFilter.frequency.setValueAtTime(2400, t);
    warmFilter.connect(this.masterGain);

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.065;
      const releaseDur = 1.35 - idx * 0.05; // ~1.4s release envelope

      // Triangle core
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + releaseDur);

      // Sine shimmer overtone
      const sine = this.ctx!.createOscillator();
      const sineGain = this.ctx!.createGain();
      sine.type = "sine";
      sine.frequency.setValueAtTime(freq * 2, noteTime);

      sineGain.gain.setValueAtTime(0.001, noteTime);
      sineGain.gain.linearRampToValueAtTime(0.08, noteTime + 0.01);
      sineGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + releaseDur * 0.7);

      osc.connect(gain);
      sine.connect(sineGain);
      gain.connect(warmFilter);
      sineGain.connect(warmFilter);

      osc.start(noteTime);
      sine.start(noteTime);
      osc.stop(noteTime + releaseDur + 0.02);
      sine.stop(noteTime + releaseDur + 0.02);
    });
  }

  // =========================================================================
  // 6. playBadgeShimmer(): High, airy glass harmonic chime
  // =========================================================================
  public playBadgeShimmer(): void {
    const now = Date.now();
    if (now - this.shimmerThrottle < 180) return; // Debounce rapid hovers
    this.shimmerThrottle = now;

    if (!this.soundEnabled || this.volume <= 0 || !this.initContext() || !this.ctx || !this.masterGain) {
      return;
    }

    const t = this.ctx.currentTime;
    // High glass harmonics: E6 (1318.51), B6 (1975.53), E7 (2637.02)
    const freqs = [1318.51, 1975.53, 2637.02];

    freqs.forEach((freq, idx) => {
      const noteTime = t + idx * 0.035;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.12, noteTime + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.32);
    });
  }

  // =========================================================================
  // 7. toggleBrownNoise(active): Continuous soothing low-pass Brownian Noise
  // =========================================================================
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
      // If already playing, keep going
      if (!this.brownNoiseNode) {
        const bufferSize = this.ctx.sampleRate * 5; // 5-second seamless loop
        const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
          const data = buffer.getChannelData(channel);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + 0.02 * white) / 1.02;
            data[i] = lastOut * 3.2; // Gain compensation
          }
        }

        this.brownNoiseNode = this.ctx.createBufferSource();
        this.brownNoiseNode.buffer = buffer;
        this.brownNoiseNode.loop = true;

        this.brownNoiseFilter = this.ctx.createBiquadFilter();
        this.brownNoiseFilter.type = "lowpass";
        this.brownNoiseFilter.frequency.setValueAtTime(380, t);

        this.brownNoiseGain = this.ctx.createGain();
        // Smooth fade-in
        this.brownNoiseGain.gain.setValueAtTime(0.0001, t);
        this.brownNoiseGain.gain.linearRampToValueAtTime(this.brownNoiseVolume * 0.35, t + 0.8);

        this.brownNoiseNode.connect(this.brownNoiseFilter);
        this.brownNoiseFilter.connect(this.brownNoiseGain);
        this.brownNoiseGain.connect(this.ctx.destination);

        this.brownNoiseNode.start(t);
      }
    } else {
      if (this.brownNoiseGain && this.brownNoiseNode) {
        // Smooth fade-out over 0.8s
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
    }

    this.notify();
    return shouldBeActive;
  }
}

// React Hook export
import * as React from "react";

export function useSound() {
  const engine = React.useMemo(() => SoundEngine.getInstance(), []);
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    return engine.subscribe(() => setTick((prev) => prev + 1));
  }, [engine]);

  return {
    soundEnabled: engine.isSoundEnabled(),
    volume: engine.getVolume(),
    brownNoiseActive: engine.isBrownNoiseActive(),
    toggleSound: () => engine.setSoundEnabled(!engine.isSoundEnabled()),
    setSoundEnabled: (v: boolean) => engine.setSoundEnabled(v),
    setVolume: (v: number) => engine.setVolume(v),
    toggleBrownNoise: (active?: boolean) => engine.toggleBrownNoise(active),
    playClick: () => engine.playClick(),
    playToggle: (isOn: boolean) => engine.playToggle(isOn),
    playCorrect: (streak = 1) => engine.playCorrect(streak),
    playWrong: () => engine.playWrong(),
    playMasteryFanfare: () => engine.playMasteryFanfare(),
    playBadgeShimmer: () => engine.playBadgeShimmer(),
    attachGlobalClickListener: () => engine.attachGlobalClickListener(),
  };
}
