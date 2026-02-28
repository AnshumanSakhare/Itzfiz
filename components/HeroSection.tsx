"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

// â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const HEADLINE = "WELCOME ITZFIZZ";

const stats = [
  { value: "58%", label: "Increase in\npick up point use" },
  { value: "23%", label: "Decreased in\ncustomer phone calls" },
  { value: "27%", label: "Increase in\npick up point use" },
  { value: "40%", label: "Decreased in\ncustomer phone calls" },
];

// Split headline into tokens: each visible char gets a slot; spaces become gaps
const TOKENS = HEADLINE.split("").map((ch, i) => ({ ch, id: i }));
const VISIBLE_CHARS = TOKENS.filter((t) => t.ch !== " ");
const NUM_CHARS = VISIBLE_CHARS.length;

// Car travels from -48 vw â†’ +52 vw (relative to its initial centered position)
const CAR_START_VW = -48;
const CAR_END_VW = 52;
const CAR_SCROLL_WINDOW = 0.72; // use first 72 % of scroll for car movement

// Stats start popping at 12 % scroll, 15 % apart — all 4 appear while car is moving
const STATS_START = 0.12;
const STATS_GAP = 0.15;

export default function HeroSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mutable revealed flags â€” avoids retrigger on every scroll tick
  const revealed = useRef({
    letters: new Array(NUM_CHARS).fill(false) as boolean[],
    stats: new Array(stats.length).fill(false) as boolean[],
  });

  // Measured center-x for each letter (in % of viewport width, relative to screen centre)
  const letterCenters = useRef<number[]>([]);

  useEffect(() => {
    // â”€â”€ 1. Measure letter positions after layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const vw = window.innerWidth;
    const screenCX = vw / 2;
    letterCenters.current = letterRefs.current.map((el) => {
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      // Return x offset from screen centre in vw units
      return ((r.left + r.width / 2 - screenCX) / vw) * 100;
    });

    // â”€â”€ 2. Set initial hidden states â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    gsap.set(letterRefs.current.filter(Boolean), {
      opacity: 0,
      y: 70,
      scale: 0.35,
      rotation: gsap.utils.random(-8, 8, true),
    });
    gsap.set(statRefs.current.filter(Boolean), {
      opacity: 0,
      y: 55,
      scale: 0.75,
    });

    // â”€â”€ 3. Intro: car fades in at page load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    gsap.set(carRef.current, { x: `${CAR_START_VW}vw`, opacity: 0 });
    gsap.to(carRef.current, {
      opacity: 1,
      duration: 0.9,
      delay: 0.3,
      ease: "power2.out",
    });

    // â”€â”€ 4. Master scroll driver â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: scrollContainerRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate(self) {
          const p = self.progress; // 0 â†’ 1

          // â”€â”€ Car translation (tied directly to scroll progress) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          const carProgress = Math.min(p / CAR_SCROLL_WINDOW, 1);
          const carVW = gsap.utils.interpolate(CAR_START_VW, CAR_END_VW, carProgress);
          const carTilt = gsap.utils.interpolate(-2.5, 2.5, carProgress);
          gsap.set(carRef.current, { x: `${carVW}vw`, rotation: carTilt });

          // Convert car position to same vw-from-centre scale as letterCenters
          // carRef has left:50%, so GSAP x represents offset from centre
          const carCentreVW = carVW; // already in vw from screen centre

          // â”€â”€ Letter pop-up as car passes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          letterRefs.current.forEach((el, i) => {
            if (!el) return;
            const letterX = letterCenters.current[i] ?? 0;
            // Reveal ~4 vw before the car centre reaches the letter
            const shouldReveal = carCentreVW >= letterX - 4;

            if (shouldReveal && !revealed.current.letters[i]) {
              revealed.current.letters[i] = true;
              gsap.to(el, {
                opacity: 1,
                y: 0,
                scale: 1,
                rotation: 0,
                duration: 0.45,
                ease: "back.out(2.8)",
                overwrite: true,
              });
            } else if (!shouldReveal && revealed.current.letters[i]) {
              // Reverse on scroll back
              revealed.current.letters[i] = false;
              gsap.to(el, {
                opacity: 0,
                y: 70,
                scale: 0.35,
                duration: 0.28,
                ease: "power2.in",
                overwrite: true,
              });
            }
          });

          // â”€â”€ Stats pop-up sequentially â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          statRefs.current.forEach((el, i) => {
            if (!el) return;
            const threshold = STATS_START + i * STATS_GAP;
            const shouldReveal = p >= threshold;

            if (shouldReveal && !revealed.current.stats[i]) {
              revealed.current.stats[i] = true;
              gsap.to(el, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.55,
                ease: "back.out(1.9)",
                overwrite: true,
              });
            } else if (!shouldReveal && revealed.current.stats[i]) {
              revealed.current.stats[i] = false;
              gsap.to(el, {
                opacity: 0,
                y: 55,
                scale: 0.75,
                duration: 0.3,
                ease: "power2.in",
                overwrite: true,
              });
            }
          });
        },
      });
    });

    return () => ctx.revert();
  }, []);

  // Build letter index counter for ref assignment
  let li = -1;

  return (
    <>
      {/* â”€â”€â”€ Tall scroll container â€“ drives all progress â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div ref={scrollContainerRef} style={{ height: "520vh" }}>

        {/* â”€â”€â”€ Sticky (pinned) hero panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section
          ref={sectionRef}
          className="sticky top-0 h-screen w-full overflow-hidden bg-[#07080a]"
        >
          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0 z-0">
            <div className="absolute left-1/2 top-1/2 h-[55vh] w-[65vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#152d47] opacity-25 blur-[110px]" />
          </div>

          {/* Grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />

          {/* â”€â”€ Top nav â”€â”€ */}
          <div className="relative z-20 flex items-center justify-between px-10 pt-7">
            <span className="text-[0.65rem] font-semibold tracking-[0.35em] text-[#4a7fa5] uppercase">
              ItzFizz
            </span>
            {["Product", "Services", "About", "Contact"].map((item) => (
              <span
                key={item}
                className="cursor-pointer text-[0.65rem] tracking-widest text-[#8a9ab0] uppercase transition-colors hover:text-white"
              >
                {item}
              </span>
            ))}
          </div>

          {/* â”€â”€ Horizontal track line â”€â”€ */}
          <div className="absolute left-0 right-0 z-10"
            style={{ top: "calc(50% + 2px)" }}>
            <div className="mx-auto h-px w-full bg-gradient-to-r from-transparent via-[#1e3a52] to-transparent opacity-60" />
          </div>

          {/* â”€â”€â”€ HEADLINE â€“ letters sit above the track, pop up as car passes â”€ */}
          {/* This outer div is centred vertically just above the track */}
          <div
            className="absolute left-0 right-0 z-30 flex items-end justify-center gap-0 select-none"
            style={{ top: "calc(50% - 72px)" }}
          >
            {TOKENS.map((token) => {
              if (token.ch === " ") {
                return (
                  <span
                    key={token.id}
                    style={{ display: "inline-block", width: "clamp(0.8rem,2.5vw,3rem)" }}
                  />
                );
              }
              li += 1;
              const idx = li; // capture for closure
              return (
                <span
                  key={token.id}
                  ref={(el) => {
                    letterRefs.current[idx] = el;
                  }}
                  className="inline-block font-black text-white"
                  style={{
                    fontSize: "clamp(1.8rem, 4.8vw, 5.5rem)",
                    letterSpacing: "0.05em",
                    lineHeight: 1,
                    textShadow: "0 0 30px rgba(74,127,165,0.55)",
                    willChange: "transform, opacity",
                    opacity: 0,
                  }}
                >
                  {token.ch}
                </span>
              );
            })}
          </div>

          {/* ─── Subtitle ─── */}
          <div
            className="absolute left-0 right-0 z-10 flex justify-center"
            style={{ top: "calc(50% - 20px)" }}
          >
            <p className="text-[0.58rem] tracking-[0.55em] text-[#3d6a8a] uppercase">
              Premium Logistics &amp; Delivery Intelligence
            </p>
          </div>

          {/* â”€â”€â”€ CAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div
            ref={carRef}
            className="absolute z-20"
            style={{
              top: "50%",
              left: "50%",
              width: "clamp(340px, 52vw, 800px)",
              transform: "translate(-50%, -50%)",
              willChange: "transform",
              opacity: 0,
            }}
          >
            {/* Floor glow */}
            <div
              className="absolute bottom-0 left-1/2 h-[28px] w-[70%] -translate-x-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse at center,rgba(74,127,165,0.3) 0%,transparent 70%)",
                filter: "blur(8px)",
              }}
            />
            <Image
              src="/car.png"
              alt="McLaren 720S"
              width={800}
              height={440}
              priority
              className="h-auto w-full object-contain"
              style={{
                filter: "brightness(1.08) contrast(1.08) drop-shadow(0 12px 40px rgba(74,127,165,0.28))",
              }}
            />
          </div>

          {/* â”€â”€â”€ STATS â€“ pop up below after car finishes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div
            className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 gap-10 md:gap-16"
          >
            {stats.map((s, i) => (
              <div
                key={i}
                ref={(el) => {
                  statRefs.current[i] = el;
                }}
                className="flex flex-col items-center text-center"
                style={{ willChange: "transform, opacity", opacity: 0 }}
              >
                <span
                  className="font-extrabold leading-none"
                  style={{
                    fontSize: "clamp(1.8rem, 3.5vw, 3.2rem)",
                    background: "linear-gradient(135deg,#ffffff 0%,#4a9fc4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {s.value}
                </span>
                <span
                  className="mt-1 text-[0.6rem] leading-tight tracking-widest text-[#506a7e] uppercase"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {s.label}
                </span>
                <div className="mt-2 h-px w-8 bg-gradient-to-r from-transparent via-[#4a7fa5] to-transparent opacity-50" />
              </div>
            ))}
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1 opacity-40">
            <span className="text-[0.55rem] tracking-[0.45em] text-[#4a7fa5] uppercase">Scroll</span>
            <div className="h-7 w-px animate-pulse bg-gradient-to-b from-[#4a7fa5] to-transparent" />
          </div>

          {/* Corner marks */}
          {[
            "top-5 left-5 border-t border-l",
            "top-5 right-5 border-t border-r",
            "bottom-5 left-5 border-b border-l",
            "bottom-5 right-5 border-b border-r",
          ].map((cls) => (
            <div key={cls} className={`absolute z-10 h-4 w-4 border-[#4a7fa5] opacity-35 ${cls}`} />
          ))}
        </section>
      </div>
    </>
  );
}
