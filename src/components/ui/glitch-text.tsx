
"use client";

import { useEffect, useState } from "react";

interface GlitchTextProps {
  text: string;
  id?: string;
  className?: string;
  /** Active le décryptage initial. */
  decrypt?: boolean;
  /** Modifier cette valeur relance l'animation. */
  replayKey?: string | number;
  /** Durée du décryptage en millisecondes. */
  duration?: number;
}

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&@!?";

function randomChar(): string {
  return CHARS[Math.floor(Math.random() * CHARS.length)] ?? "X";
}

export default function GlitchText({
  text,
  id,
  className = "",
  decrypt = true,
  replayKey = 0,
  duration = 1400,
}: GlitchTextProps) {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    if (!decrypt || !text) {
      setDisplayText(text);
      return;
    }

    // Respecte la préférence système pour les animations réduites.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayText(text);
      return;
    }

    let progress = 0;
    const start = performance.now();
    const stepDuration = 30;

    const scramble = () => {
      const elapsed = performance.now() - start;
      progress = Math.min(elapsed / Math.max(duration, 1), 1);

      // Le nombre de lettres stabilisées augmente avec le temps.
      const lockedCount = Math.floor(progress * text.length);

      const next = Array.from(text)
        .map((char, index) => {
          if (char === " " || char === "\n") return char;

          // Les lettres se fixent de gauche à droite.
          if (index < lockedCount) return char;

          // Les caractères restants changent à chaque étape.
          return randomChar();
        })
        .join("");

      setDisplayText(next);

      if (progress < 1) {
        timer = window.setTimeout(scramble, stepDuration);
      } else {
        setDisplayText(text);
      }
    };

    let timer = window.setTimeout(scramble, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [text, id, decrypt, replayKey, duration]);

  return (
    <span
      id={id}
      className={`glitch-text ${className}`}
      data-text={displayText}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{displayText}</span>
    </span>
  );
}
