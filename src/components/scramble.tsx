'use client';

import { useEffect, useRef, useState, type ElementType } from 'react';

const GLYPHS = '01<>/\\{}[]#$%&*+=?!;:~^|_';
const FRAME_MS = 35;

type CharState = { ch: string; mode: 'hidden' | 'scramble' | 'done'; alt: boolean };

const rand = (max: number) => Math.floor(Math.random() * max);

/**
 * Texte qui apparaît caractère par caractère : chaque lettre surgit comme un
 * symbole aléatoire (violet / jaune) qui change plusieurs fois avant de
 * se fixer sur la vraie lettre. Se déclenche quand le texte entre à l'écran.
 */
export function Scramble({
  text,
  delay = 0,
  className = '',
  as: Tag = 'span',
}: {
  text: string;
  delay?: number; // en millisecondes
  className?: string;
  as?: ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [chars, setChars] = useState<CharState[]>(() =>
    [...text].map((ch) => ({ ch, mode: 'hidden', alt: false })),
  );

  useEffect(() => {
    const letters = [...text];
    const done = letters.map((ch): CharState => ({ ch, mode: 'done', alt: false }));

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setChars(done);
      return;
    }

    const spread = Math.min(2, 60 / Math.max(letters.length, 1));
    const starts = letters.map((_, i) => Math.floor(i * spread) + rand(6));
    const ends = starts.map((s) => s + 6 + rand(10));
    let timer: ReturnType<typeof setInterval> | undefined;
    let starter: ReturnType<typeof setTimeout> | undefined;

    const run = () => {
      let frame = 0;
      timer = setInterval(() => {
        frame++;
        setChars(
          letters.map((ch, i): CharState => {
            if (ch === ' ') return { ch, mode: 'done', alt: false };
            if (frame < starts[i]) return { ch, mode: 'hidden', alt: false };
            if (frame >= ends[i]) return { ch, mode: 'done', alt: false };
            return { ch: GLYPHS[rand(GLYPHS.length)], mode: 'scramble', alt: Math.random() > 0.5 };
          }),
        );
        if (frame > Math.max(...ends)) clearInterval(timer);
      }, FRAME_MS);
    };

    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        starter = setTimeout(run, delay);
      },
      { threshold: 0.2 },
    );
    if (el) observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(starter);
      clearInterval(timer);
    };
  }, [text, delay]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={
            c.mode === 'hidden'
              ? 'invisible'
              : c.mode === 'scramble'
                ? c.alt
                  ? 'text-[#a855f7]'
                  : 'text-[#facc15]'
                : undefined
          }
        >
          {c.ch}
        </span>
      ))}
    </Tag>
  );
}