"use client";

import * as React from "react";
import { BadgeItem } from "@/types/mastery-gamification";
import { SoundEngine } from "@/lib/sound-engine";
import { Lock } from "lucide-react";

interface HolographicBadgeProps {
  badge: BadgeItem;
  isUnlocked: boolean;
  isEquipped: boolean;
  onToggleEquip?: () => void;
  currentVal?: number;
}

export function HolographicBadge({
  badge,
  isUnlocked,
  isEquipped,
  onToggleEquip,
  currentVal = 0,
}: HolographicBadgeProps) {
  const cardRef = React.useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = React.useState<string>("");
  const [glareStyle, setGlareStyle] = React.useState<React.CSSProperties>({ opacity: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handlePointerEnter = () => {
    if (!isUnlocked) return;
    setIsHovered(true);
    // Play high glass harmonic chime
    SoundEngine.getInstance().playBadgeShimmer();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isUnlocked || !cardRef.current) return;

    // Check prefers-reduced-motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width - 0.5) * 2; // -1 to 1
    const py = (y / rect.height - 0.5) * 2; // -1 to 1

    const rotateX = -py * 14; // Max 14deg tilt
    const rotateY = px * 14;

    setTransformStyle(
      `perspective(600px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03)`
    );

    setGlareStyle({
      opacity: 1,
      background: `radial-gradient(circle at ${x}px ${y}px, rgba(212, 175, 55, 0.38) 0%, rgba(255, 255, 255, 0.18) 35%, transparent 70%)`,
    });
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTransformStyle("perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlareStyle({ opacity: 0 });
  };

  return (
    <div
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
      className={`relative p-4 rounded-[14px] border-2 transition-all flex flex-col justify-between select-none overflow-hidden bg-[#FBF6EC] dark:bg-[#221A1C] shadow-sm ${
        isUnlocked
          ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/30 hover:shadow-xl"
          : "border-[#E4D9C0] dark:border-[#3D2D31] opacity-75"
      }`}
    >
      {/* 3D Holographic Glare Layer */}
      {isUnlocked && (
        <div
          style={glareStyle}
          className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-10"
        />
      )}

      <div className="relative z-0">
        <div className="flex items-start justify-between gap-2">
          {/* Badge Circular Artwork */}
          <div
            className={`h-14 w-14 rounded-full overflow-hidden border-2 p-0.5 shrink-0 transition-transform ${
              isUnlocked
                ? "border-[#D4AF37] bg-white dark:bg-black shadow-sm ring-2 ring-[#D4AF37]/20"
                : "border-gray-400 grayscale"
            }`}
          >
            <img
              src={badge.imageUrl}
              alt={badge.title}
              className="h-full w-full object-cover rounded-full"
            />
          </div>

          {/* Action: Equip toggle or Lock */}
          {isUnlocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                SoundEngine.getInstance().playToggle(!isEquipped);
                onToggleEquip?.();
              }}
              className={`text-[10px] font-bold px-2 py-1 rounded-[6px] transition-colors shadow-xs ${
                isEquipped
                  ? "bg-[#8A1627] text-white"
                  : "bg-[#E4D9C0]/60 dark:bg-[#3D2D31] hover:bg-[#8A1627] hover:text-white"
              }`}
            >
              {isEquipped ? "Equipped" : "Equip"}
            </button>
          ) : (
            <div className="p-1 rounded-full bg-black/5 dark:bg-white/5">
              <Lock className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Title & Lore */}
        <div className="font-serif font-bold text-sm mt-3 text-[#14161F] dark:text-[#F6EBD3]">
          {badge.title}
        </div>
        <p className="text-[11px] text-[#4B5160] dark:text-[#CFC8BB] mt-1 line-clamp-2 leading-relaxed">
          {badge.description}
        </p>
      </div>

      {/* Progress Bar when locked */}
      {!isUnlocked && (
        <div className="mt-3 pt-2 border-t border-[#E4D9C0] dark:border-[#3D2D31]">
          <div className="flex justify-between text-[10px] text-[#4B5160] dark:text-[#CFC8BB] mb-1 font-medium">
            <span>Progress</span>
            <span>
              {currentVal} / {badge.thresholdValue}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#E4D9C0] dark:bg-[#3D2D31] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8A1627] rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (currentVal / badge.thresholdValue) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
