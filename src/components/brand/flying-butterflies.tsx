import * as React from "react";

/** Small crystal butterflies drifting across a hero. Purely decorative; paused for reduced-motion. */
const FLIGHTS = [
  { size: 34, top: "14%", left: "46%", path: "a", dur: 19, delay: -3 },
  { size: 26, top: "62%", left: "52%", path: "b", dur: 23, delay: -9 },
  { size: 40, top: "30%", left: "68%", path: "c", dur: 27, delay: -14 },
  { size: 22, top: "76%", left: "78%", path: "a", dur: 21, delay: -6 },
  { size: 30, top: "8%", left: "84%", path: "b", dur: 25, delay: -18 },
  { size: 24, top: "48%", left: "34%", path: "c", dur: 29, delay: -11 },
];

export function FlyingButterflies() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 hidden overflow-hidden md:block">
      {FLIGHTS.map((f, i) => (
        <span key={i} className={`vc-fly vc-fly-${f.path} absolute`} style={{ top: f.top, left: f.left, width: f.size, height: f.size, animationDuration: `${f.dur}s`, animationDelay: `${f.delay}s` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/butterfly-real-180.png"
            alt=""
            draggable={false}
            className="vc-flap h-full w-full select-none object-contain opacity-90 drop-shadow-[0_4px_8px_rgba(20,17,31,0.25)]"
            style={{ animationDuration: `${0.5 + (i % 3) * 0.12}s`, animationDelay: `${-i * 0.2}s` }}
          />
        </span>
      ))}
    </div>
  );
}
