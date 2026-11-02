"use client";

import * as React from "react";
import { SoundEngine } from "@/lib/sound-engine";
import { Sparkles, Trophy, Award, X } from "lucide-react";

export interface CelebrationDetail {
  title: string;
  subtitle?: string;
  xp?: number;
}

export interface FloatingRewardDetail {
  id: string;
  text: string;
  x: number;
  y: number;
}

// Global dispatchers for zero-coupling usage anywhere in the app
export function triggerCelebration(detail: CelebrationDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("valeria:celebration", { detail }));
  }
}

export function triggerFloatingReward(text: string, x?: number, y?: number) {
  if (typeof window !== "undefined") {
    const defaultX = window.innerWidth / 2;
    const defaultY = window.innerHeight * 0.45;
    window.dispatchEvent(
      new CustomEvent("valeria:floating_reward", {
        detail: {
          id: "reward-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
          text,
          x: x ?? defaultX,
          y: y ?? defaultY,
        },
      })
    );
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
}

const HERITAGE_PALETTE = [
  "#8A1627", // Heritage Burgundy
  "#D4AF37", // Antique Gold
  "#FBF6EC", // Heritage Cream
  "#A51C30", // Crimson
  "#FFE082", // Bright Gold
];

export function CelebrationOverlay() {
  const [celebration, setCelebration] = React.useState<CelebrationDetail | null>(null);
  const [floatingRewards, setFloatingRewards] = React.useState<FloatingRewardDetail[]>([]);
  const [stamped, setStamped] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = React.useRef<number | null>(null);

  // Listen for custom events
  React.useEffect(() => {
    const handleCelebration = (e: Event) => {
      const custom = e as CustomEvent<CelebrationDetail>;
      setCelebration(custom.detail);
      setStamped(false);

      // Play procedural mastery fanfare
      SoundEngine.getInstance().playMasteryFanfare();

      // Trigger stamp effect shortly after
      setTimeout(() => setStamped(true), 150);
    };

    const handleReward = (e: Event) => {
      const custom = e as CustomEvent<FloatingRewardDetail>;
      setFloatingRewards((prev) => [...prev, custom.detail]);
      // Remove after 1.5s
      setTimeout(() => {
        setFloatingRewards((prev) => prev.filter((r) => r.id !== custom.detail.id));
      }, 1500);
    };

    window.addEventListener("valeria:celebration", handleCelebration);
    window.addEventListener("valeria:floating_reward", handleReward);

    return () => {
      window.removeEventListener("valeria:celebration", handleCelebration);
      window.removeEventListener("valeria:floating_reward", handleReward);
    };
  }, []);

  // Auto-dismiss celebration after 4.5s
  React.useEffect(() => {
    if (!celebration) return;
    const timer = setTimeout(() => {
      setCelebration(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [celebration]);

  // Confetti Particle Simulation
  React.useEffect(() => {
    if (!celebration || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const particleCount = prefersReducedMotion ? 12 : 55;

    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI) / 1.2 + Math.PI / 12;
      const speed = Math.random() * 10 + 4;
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 120,
        y: canvas.height * 0.42,
        vx: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1) * speed,
        vy: -Math.sin(angle) * speed,
        size: Math.random() * 7 + 4,
        color: HERITAGE_PALETTE[Math.floor(Math.random() * HERITAGE_PALETTE.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        opacity: 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // Gravity
        p.vx *= 0.985; // Drag
        p.rotation += p.vRot;
        p.opacity = Math.max(0, p.opacity - 0.007);

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          alive = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;

          // Alternate between rectangular parchment & round antique disks
          if (p.size > 8) {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [celebration]);

  return (
    <>
      {/* 1. Floating Reward Pills (+XP / +Mastery) */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingRewards.map((reward) => (
          <div
            key={reward.id}
            style={{ left: `${reward.x}px`, top: `${reward.y}px` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-float-reward select-none"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8A1627] text-[#D4AF37] border-2 border-[#D4AF37] shadow-xl text-xs font-serif font-black tracking-wider uppercase">
              <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span>{reward.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Fullscreen Academic Celebration Overlay */}
      {celebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200">
          {/* Confetti Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 pointer-events-none z-0"
          />

          {/* Central Modal Content */}
          <div className="relative z-10 max-w-sm w-full academic-card p-6 rounded-[24px] border-2 border-[#D4AF37] shadow-2xl text-center space-y-4 bg-[#FBF6EC] dark:bg-[#1E1618]">
            <button
              onClick={() => setCelebration(null)}
              className="absolute top-3 right-3 p-1.5 text-[#4B5160] hover:text-[#8A1627] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              title="Close celebration"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Academic Wax Seal of Mastery */}
            <div className="relative flex justify-center pt-2">
              <div
                className={`transition-all duration-500 ease-out transform ${
                  stamped
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-150 -rotate-12 opacity-0"
                }`}
              >
                <div className="relative">
                  {/* Wax Seal Scalloped Disc SVG */}
                  <svg
                    viewBox="0 0 160 160"
                    className="w-32 h-32 drop-shadow-xl fill-[#8A1627]"
                  >
                    {/* Melted Wax Scallop Edge */}
                    <path d="M80 0 C95 5, 105 15, 118 10 C131 5, 142 20, 150 32 C158 44, 160 58, 158 72 C156 86, 160 100, 150 112 C140 124, 130 135, 118 142 C106 149, 92 158, 78 158 C64 158, 52 150, 40 144 C28 138, 18 126, 10 114 C2 102, 0 88, 2 74 C4 60, 2 46, 12 34 C22 22, 34 10, 48 6 C62 2, 70 5, 80 0 Z" />
                    {/* Inner Antique Gold Concentric Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r="60"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="52"
                      fill="none"
                      stroke="#D4AF37"
                      strokeWidth="1.5"
                    />
                  </svg>

                  {/* Seal Center Icon & Imprint */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#D4AF37] pointer-events-none">
                    <Award className="h-10 w-10 text-[#D4AF37] stroke-[2.2] drop-shadow-sm animate-pulse" />
                    <span className="text-[9px] font-serif font-black tracking-widest uppercase mt-1">
                      VERIFIED
                    </span>
                  </div>

                  {/* Wax Ribbon Tails */}
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1 -z-10">
                    <div className="w-4 h-8 bg-[#8A1627] transform -rotate-12 border-b-2 border-r border-[#D4AF37]/40 clip-ribbon" />
                    <div className="w-4 h-8 bg-[#8A1627] transform rotate-12 border-b-2 border-l border-[#D4AF37]/40 clip-ribbon" />
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Feedback */}
            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] dark:text-[#E5B555]">
                Academic Milestone
              </span>
              <h2 className="text-xl font-serif font-black text-[#14161F] dark:text-[#F6EBD3]">
                {celebration.title}
              </h2>
              {celebration.subtitle && (
                <p className="text-xs text-[#4B5160] dark:text-[#CFC8BB] line-clamp-2">
                  {celebration.subtitle}
                </p>
              )}
            </div>

            {/* Awarded XP Badge */}
            {celebration.xp ? (
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8A1627]/10 dark:bg-[#8A1627]/30 border border-[#8A1627]/30 text-[#8A1627] dark:text-[#F07B88] font-serif font-black text-sm">
                <Sparkles className="h-4 w-4 text-[#D4AF37]" />
                <span>+{celebration.xp} Academic XP</span>
              </div>
            ) : null}

            {/* Continue Button */}
            <div className="pt-2">
              <button
                onClick={() => setCelebration(null)}
                className="w-full btn-primary text-xs py-2.5 rounded-[12px] font-semibold shadow-md flex items-center justify-center gap-1.5"
              >
                <Trophy className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span>Continue Learning</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
