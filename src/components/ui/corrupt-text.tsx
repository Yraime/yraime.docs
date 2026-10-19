
"use client";

import { useEffect, useState } from "react";

interface CorruptTextProps {
  text: string;
  className?: string;
  interval?: number;
  intensity?: number;
  active?: boolean;
}

const GLITCH_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@!?";

export default function CorruptText({
  text,
  className = "",
  interval = 3000,
  intensity = 5,
  active = true,
}: CorruptTextProps) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    setDisplay(text);

    if (
      !active ||
      !text ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let glitchTimer: ReturnType<typeof setTimeout>;
    let restoreTimer: ReturnType<typeof setTimeout>;

    const startGlitch = () => {
    const candidates = Array.from(text)
        .map((char, index) => ({ char, index }))
        .filter(({ char }) => /[a-zA-ZÀ-ÿ0-9]/.test(char));

    const count = Math.min(
        candidates.length,
        Math.max(1, Math.floor(intensity)),
    );

    const changeLetters = () => {
        const chars = Array.from(text);
        const selected = new Set<number>();

        while (selected.size < count) {
        const randomIndex = Math.floor(
            Math.random() * candidates.length,
        );
        selected.add(candidates[randomIndex]!.index);
        }

        for (const index of selected) {
        chars[index] =
            GLITCH_CHARS[
            Math.floor(Math.random() * GLITCH_CHARS.length)
            ] ?? "#";
        }

        setDisplay(chars.join(""));
    };

    // Change les lettres toutes les 50 ms (20 fois par seconde).
    let elapsed = 20;

    const animate = () => {
        changeLetters();
        elapsed += 50;

        if (elapsed < 250) {
        restoreTimer = setTimeout(animate, 50);
        } else {
        setDisplay(text);
        glitchTimer = setTimeout(startGlitch, interval);
        }
    };

    animate();
    };

    glitchTimer = setTimeout(startGlitch, interval);

    return () => {
      clearTimeout(glitchTimer);
      clearTimeout(restoreTimer);
    };
  }, [text, interval, intensity, active]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}
