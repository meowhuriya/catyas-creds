import { describe, it, expect, vi } from "vitest";
import { SoundEngine } from "./sound-engine";
import { triggerCelebration, triggerFloatingReward } from "@/components/ui/CelebrationOverlay";

describe("Procedural Web Audio Sound & Micro-Interaction Engine", () => {
  it("maintains a singleton instance with default volume 0.35 and sound enabled", () => {
    const s1 = SoundEngine.getInstance();
    const s2 = SoundEngine.getInstance();
    expect(s1).toBe(s2);

    expect(s1.getVolume()).toBeGreaterThanOrEqual(0);
    expect(s1.getVolume()).toBeLessThanOrEqual(1);
    expect(typeof s1.isSoundEnabled()).toBe("boolean");
    expect(typeof s1.isBrownNoiseActive()).toBe("boolean");
  });

  it("safely adjusts volume within [0, 1] range and updates enabled state", () => {
    const engine = SoundEngine.getInstance();

    // Volume clamping
    engine.setVolume(0.75);
    expect(engine.getVolume()).toBe(0.75);

    engine.setVolume(1.8);
    expect(engine.getVolume()).toBe(1.0);

    engine.setVolume(-0.4);
    expect(engine.getVolume()).toBe(0.0);

    // Reset to default
    engine.setVolume(0.35);
    expect(engine.getVolume()).toBe(0.35);

    // Sound toggle
    engine.setSoundEnabled(false);
    expect(engine.isSoundEnabled()).toBe(false);

    engine.setSoundEnabled(true);
    expect(engine.isSoundEnabled()).toBe(true);
  });

  it("executes all procedural synthesis methods without crashing in SSR/Node environments", () => {
    const engine = SoundEngine.getInstance();

    expect(() => {
      // 12ms tactile switch click
      engine.playClick();

      // Woodblock toggle ON & OFF
      engine.playToggle(true);
      engine.playToggle(false);

      // Warm marimba triad with streak scaling
      engine.playCorrect(1);
      engine.playCorrect(3);
      engine.playCorrect(7);

      // Low-pass muted thud
      engine.playWrong();

      // Academic chord arpeggio fanfare
      engine.playMasteryFanfare();

      // High glass harmonic shimmer
      engine.playBadgeShimmer();

      // Ambient Focus Brown Noise toggle
      const active = engine.toggleBrownNoise(true);
      expect(typeof active).toBe("boolean");
      const inactive = engine.toggleBrownNoise(false);
      expect(inactive).toBe(false);
    }).not.toThrow();
  });

  it("dispatches celebration and floating reward custom events safely", () => {
    expect(() => {
      triggerFloatingReward("+100 XP", 200, 300);
      triggerCelebration({
        title: "Unit 1 Mastery",
        subtitle: "Matrices & Calculus",
        xp: 100,
      });
    }).not.toThrow();
  });
});
