"use client";

import { useEffect, useRef, useState } from "react";

interface WaveTextProps {
  children: string;
  className?: string;
}

const SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@!?";
const STEP = 20; // délai entre chaque lettre (ms)
const HOLD = 200; // durée pendant laquelle une lettre reste corrompue (ms)
const SCRAMBLE = 20; // fréquence de changement du symbole pendant le HOLD (ms)

const randomSymbol = () =>
  SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] ?? "#";

export default function WaveText({
  children,
  className = "",
}: WaveTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [run, setRun] = useState(0); // +1 à chaque survol => relance la vague

  const letters = Array.from(children);

  // écoute le survol du lien/bouton parent (sinon le span lui-même)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = el.closest("a, button") ?? el;
    const start = () => setRun((value) => value + 1);

    target.addEventListener("mouseenter", start);
    target.addEventListener("focus", start);

    return () => {
      target.removeEventListener("mouseenter", start);
      target.removeEventListener("focus", start);
    };
  }, []);

  return (
    <span ref={ref} className={className}>
      {letters.map((char, index) => (
        <Letter
          key={index}
          char={char}
          canCorrupt={/[a-zA-ZÀ-ÿ0-9]/.test(char)}
          run={run}
          delay={index * STEP}
        />
      ))}
    </span>
  );
}

function Letter({
  char,
  canCorrupt,
  run,
  delay,
}: {
  char: string;
  canCorrupt: boolean;
  run: number;
  delay: number;
}) {
  const [corrupted, setCorrupted] = useState(false);
  const [symbol, setSymbol] = useState("#");

  useEffect(() => {
    if (run === 0 || !canCorrupt) return;

    let interval: ReturnType<typeof setInterval> | undefined;

    // la lettre se corrompt à son tour...
    const corruptTimer = setTimeout(() => {
      setSymbol(randomSymbol());
      setCorrupted(true);

      // ...et change de symbole en boucle pendant toute la durée du HOLD
      interval = setInterval(() => setSymbol(randomSymbol()), SCRAMBLE);
    }, delay);

    // ...puis redevient normale, sans attendre les autres lettres
    const restoreTimer = setTimeout(() => {
      if (interval) clearInterval(interval);
      setCorrupted(false);
    }, delay + HOLD);

    return () => {
      clearTimeout(corruptTimer);
      clearTimeout(restoreTimer);
      if (interval) clearInterval(interval);
    };
  }, [run, delay, canCorrupt]);

  return (
    <span
      className={corrupted ? "wave-corrupt-letter" : ""}
      style={
        {
          "--wave-delay": `${delay}ms`,
          display: "inline-block",
        } as React.CSSProperties
      }
    >
      {corrupted ? symbol : char === " " ? "\u00A0" : char}
    </span>
  );
}