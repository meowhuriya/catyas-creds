"use client";

import * as React from "react";
import {
  Volume2,
  VolumeX,
  Headphones,
  Sliders,
  Check,
  Sparkles,
  Music,
  Waves,
} from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { useSound } from "@/lib/sound-engine";
import { cn } from "@/lib/utils";

export function SoundControlPopover() {
  const {
    soundEnabled,
    volume,
    brownNoiseActive,
    toggleSound,
    setVolume,
    toggleBrownNoise,
    playClick,
    playToggle,
    playCorrect,
    playMasteryFanfare,
  } = useSound();

  // Global keyboard shortcut: Cmd+M or Ctrl+M to toggle mute
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        toggleSound();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSound]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title={
            soundEnabled
              ? "Audio & Focus Sound (⌘M to mute)"
              : "Audio Muted (⌘M to unmute)"
          }
          className={cn(
            "relative flex h-8 w-8 items-center justify-center rounded-control border border-app-border bg-app-surface text-app-ink-muted hover:bg-app-surface-muted hover:text-app-ink transition-colors",
            brownNoiseActive && "text-[#8A1627] dark:text-[#F07B88] border-[#8A1627]/40 ring-1 ring-[#8A1627]/20"
          )}
        >
          {brownNoiseActive ? (
            <Headphones className="h-4 w-4 animate-pulse text-[#8A1627] dark:text-[#F07B88]" />
          ) : soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-app-ink-muted/60" />
          )}

          {/* Indicator Dot */}
          {brownNoiseActive && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#8A1627] animate-ping" />
          )}
          <span className="sr-only">Sound &amp; Focus Controls</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-4 rounded-[16px] bg-[#FBF6EC] dark:bg-[#1E1618] border border-[#E4D9C0] dark:border-[#3D2D31] shadow-2xl text-xs space-y-4 select-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#E4D9C0] dark:border-[#3D2D31]">
          <div className="flex items-center gap-1.5">
            <Volume2 className="h-4 w-4 text-[#8A1627] dark:text-[#F07B88]" />
            <span className="font-serif font-bold text-sm text-[#14161F] dark:text-[#F6EBD3]">
              Audio &amp; Focus
            </span>
          </div>
          <kbd className="inline-flex items-center gap-0.5 rounded border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-black px-1.5 py-0.5 text-[10px] font-mono text-[#4B5160] dark:text-[#CFC8BB]">
            ⌘M
          </kbd>
        </div>

        {/* 1. Master UI Sound Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-xs text-[#14161F] dark:text-[#F6EBD3]">
              Procedural UI Sounds
            </div>
            <div className="text-[10px] text-[#4B5160] dark:text-[#CFC8BB]">
              Tactile clicks, marimba triads &amp; fanfare
            </div>
          </div>
          <button
            onClick={() => {
              playToggle(!soundEnabled);
              toggleSound();
            }}
            className={cn(
              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
              soundEnabled ? "bg-[#8A1627]" : "bg-gray-300 dark:bg-gray-700"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                soundEnabled ? "translate-x-4" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* 2. Volume Slider */}
        {soundEnabled && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-[#4B5160] dark:text-[#CFC8BB]">
              <span className="font-medium">Master Volume</span>
              <span className="font-mono">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#E4D9C0] dark:bg-[#3D2D31] rounded-lg appearance-none cursor-pointer accent-[#8A1627]"
            />
          </div>
        )}

        {/* 3. Ambient Focus Brown Noise */}
        <div className="p-3 rounded-[12px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white/60 dark:bg-black/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Waves className={cn("h-4 w-4", brownNoiseActive ? "text-[#8A1627] dark:text-[#F07B88] animate-bounce" : "text-gray-400")} />
              <div>
                <div className="font-semibold text-xs text-[#14161F] dark:text-[#F6EBD3]">
                  Focus Brown Noise
                </div>
                <div className="text-[10px] text-[#4B5160] dark:text-[#CFC8BB]">
                  Continuous low-pass acoustic mask
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const next = toggleBrownNoise();
                playToggle(next);
              }}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                brownNoiseActive ? "bg-[#8A1627]" : "bg-gray-300 dark:bg-gray-700"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
                  brownNoiseActive ? "translate-x-4" : "translate-x-0"
                )}
              />
            </button>
          </div>
          {brownNoiseActive && (
            <div className="flex items-center justify-between text-[10px] text-[#8A1627] dark:text-[#F07B88] font-medium pt-1">
              <span>● Ambient session active</span>
              <span className="font-mono">400Hz Low-pass</span>
            </div>
          )}
        </div>

        {/* 4. Tone Previews */}
        <div className="space-y-1.5 pt-1 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A1627] dark:text-[#F07B88]">
            Tone Previews
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => playClick()}
              className="py-1 px-1.5 rounded-[6px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-black text-[10px] hover:border-[#8A1627] text-center"
            >
              Click (12ms)
            </button>
            <button
              onClick={() => playCorrect(3)}
              className="py-1 px-1.5 rounded-[6px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-black text-[10px] hover:border-[#8A1627] text-center"
            >
              Marimba Triad
            </button>
            <button
              onClick={() => playMasteryFanfare()}
              className="py-1 px-1.5 rounded-[6px] border border-[#E4D9C0] dark:border-[#3D2D31] bg-white dark:bg-black text-[10px] hover:border-[#8A1627] text-center"
            >
              Fanfare
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
