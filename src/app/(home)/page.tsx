"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Fingerprint,
  Mail,
  Palette,
  Server,
  Terminal,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";

import GlitchText from "@/components/ui/glitch-text";
import CorruptText from "@/components/ui/corrupt-text";
import WaveText from "@/components/ui/wave-text";
import { SpaceScene3D } from "@/components/space-scenes-3d";
import { sfx } from "@/components/sfx";

/* -------------------------------------------------------------------------- */
/*  Icônes de marques (retirées de lucide-react dans les versions récentes)   */
/* -------------------------------------------------------------------------- */

type BrandIconProps = { className?: string; "aria-hidden"?: boolean };

function Github({ className, ...rest }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...rest}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function Linkedin({ className, ...rest }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...rest}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  DONNÉES — modifie uniquement cette section pour personnaliser la page     */
/* -------------------------------------------------------------------------- */

const PROFILE = {
  name: "ALEX MARTIN",
  role: "Développeur Fullstack",
  version: "V.1.0",
  bio: "Je conçois des applications web rapides, accessibles et un peu hors normes. Du schéma de base de données jusqu'au dernier pixel.",
  about:
    "Développeur fullstack basé dans les Hauts-de-France. Je transforme des idées floues en produits fiables, de la maquette à la mise en production.",
  email: "alex@exemple.dev",
  github: "https://github.com/votre-pseudo",
  linkedin: "https://linkedin.com/in/votre-pseudo",
};

const STATS = [
  { value: "5+", label: "ans d'expérience" },
  { value: "30+", label: "projets livrés" },
  { value: "100%", label: "TypeScript" },
];

type TerminalLine = { kind: "cmd" | "out"; text: string };

const TERMINAL_LINES: TerminalLine[] = [
  { kind: "cmd", text: "nexus initialize --profile alex_martin" },
  { kind: "out", text: "[ OK ] Profil chargé : Fullstack / Créateur" },
  { kind: "cmd", text: "nexus load --skills" },
  { kind: "out", text: "[ OK ] Next.js · TypeScript · Tailwind · PostgreSQL" },
  { kind: "cmd", text: "nexus cat philosophy.md" },
  { kind: "out", text: "> Du code simple, testé, relisible dans un an." },
  { kind: "out", text: "> Le détail visuel compte autant que l'architecture." },
  { kind: "cmd", text: "nexus status" },
  { kind: "out", text: "[ READY ] Disponible pour missions freelance." },
];

type Project = {
  code: string;
  title: string;
  description: string;
  tech: string[];
  repo?: string;
  demo?: string;
};

const PROJECTS: Project[] = [
  {
    code: "PRJ_01",
    title: "Neon Docs",
    description:
      "Plateforme de documentation technique propulsée par Fumadocs, avec recherche instantanée et thème sur mesure.",
    tech: ["Next.js", "Fumadocs", "MDX", "Tailwind"],
    repo: "https://github.com/votre-pseudo/neon-docs",
    demo: "https://neon-docs.exemple.dev",
  },
  {
    code: "PRJ_02",
    title: "Pulse Board",
    description:
      "Tableau de bord temps réel pour suivre des métriques d'équipe : graphiques en direct, alertes et rôles.",
    tech: ["React", "TypeScript", "WebSocket", "PostgreSQL"],
    repo: "https://github.com/votre-pseudo/pulse-board",
  },
  {
    code: "PRJ_03",
    title: "Quantum Shop",
    description:
      "E-commerce headless avec panier persistant, paiement Stripe et back-office pour gérer le catalogue.",
    tech: ["Next.js", "Stripe", "Prisma", "Redis"],
    demo: "https://quantum-shop.exemple.dev",
  },
  {
    code: "PRJ_04",
    title: "Ghost CLI",
    description:
      "Outil en ligne de commande qui génère des projets Next.js prêts à l'emploi : lint, CI et déploiement inclus.",
    tech: ["Node.js", "TypeScript", "Commander"],
    repo: "https://github.com/votre-pseudo/ghost-cli",
  },
];

type StackModule = {
  code: string;
  title: string;
  icon: LucideIcon;
  items: string[];
};

const STACK: StackModule[] = [
  { code: "DEV_01", title: "Frontend", icon: Code2, items: ["Next.js", "React", "TypeScript"] },
  { code: "DEV_02", title: "Interface", icon: Palette, items: ["Tailwind CSS", "Framer Motion", "Figma"] },
  { code: "DEV_03", title: "Backend", icon: Server, items: ["Node.js", "tRPC", "GraphQL"] },
  { code: "DEV_04", title: "Données", icon: Database, items: ["PostgreSQL", "Prisma", "Redis"] },
  { code: "DEV_05", title: "Docs", icon: Terminal, items: ["Fumadocs", "MDX", "Storybook"] },
  { code: "DEV_06", title: "DevOps", icon: Cpu, items: ["Docker", "GitHub Actions", "Vercel"] },
];

/* -------------------------------------------------------------------------- */
/*  Styles partagés (clair + sombre)                                          */
/* -------------------------------------------------------------------------- */

const accent = "text-cyan-700 dark:text-cyan-300";
const muted = "text-slate-600 dark:text-slate-400";
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500";

/* -------------------------------------------------------------------------- */
/*  Fonds animés                                                              */
/* -------------------------------------------------------------------------- */

/** Pluie de code (première page) : noir en thème sombre, blanc en thème clair. */
function CodeRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const chars = "{}[]()<>/\\;:=+-*&|!?#$%01abcdefxyz".split("");
    const fontSize = 16;
    let columns = 0;
    let drops: number[] = [];
    let raf = 0;
    let last = 0;

    const isDark = () => document.documentElement.classList.contains("dark");

    const paintBackground = () => {
      ctx.fillStyle = isDark() ? "#000" : "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.ceil(canvas.width / fontSize);
      drops = Array.from(
        { length: columns },
        () => -Math.random() * (canvas.height / fontSize)
      );
      paintBackground();
    };

    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      if (time - last < 50) return; // ~20 images/seconde
      if (window.scrollY > canvas.height) return; // hors écran : pause
      last = time;

      const dark = isDark();
      ctx.fillStyle = dark ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;
      ctx.fillStyle = dark ? "#cdf8ff" : "#937bff";

      for (let i = 0; i < columns; i++) {
        const y = drops[i] * fontSize;
        if (y > 0) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillText(char, i * fontSize, y);
        }
        if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
        else drops[i]++;
      }
    };

    resize();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    const observer = new MutationObserver(paintBackground);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Effet de caractères sur toute la page                                     */
/* -------------------------------------------------------------------------- */

const MOUSE_WAVE_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz{}[]<>/\\#$%&アイウエオカキクケコ";

type MouseWavePoint = {
  x: number;
  y: number;
  start: number;
  strength: number;
  angle: number;
};

function MouseWave() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let lastFrame = 0;
    let lastX = -1;
    let lastY = -1;
    let clock = 0;
    let cols = 0;
    let rows = 0;
    let cellW = 10;
    let cellH = 14;
    let seed: number[] = [];

    const LIFETIME = 650;
    const THICKNESS = 8;
    const SPREAD = 0.8;
    const RADIUS_SPEED = 2.1;
    const DRAW_THRESHOLD = 0.14;
    const WAVE_SPACING = 14;
    const MAX_WAVES = 45;

    const waves: MouseWavePoint[] = [];
    const visibleCells = new Map<number, { influence: number; x: number; y: number }>();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Caractères plus grands, avec davantage d'espace pour garder la pluie lisible.
      cellW = 14;
      cellH = 19;
      cols = Math.ceil(width / cellW) + 1;
      rows = Math.ceil(height / cellH) + 1;
      seed = Array.from({ length: cols * rows }, () => Math.random());

      visibleCells.clear();
      ctx.clearRect(0, 0, width, height);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;

      // La page d'accueil n'est plus à l'écran : inutile de créer des vagues.
      if (window.scrollY > window.innerHeight * 1.3) return;

      // Le calque est zoomé en CSS avec la pluie : convertit la position écran en
      // coordonnées internes à partir de la taille réellement affichée.
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = (event.clientX - rect.left) * (width / rect.width);
      const y = (event.clientY - rect.top) * (height / rect.height);

      if (lastX >= 0) {
        const dx = x - lastX;
        const dy = y - lastY;
        const distance = Math.hypot(dx, dy);

        if (distance >= 2) {
          const angle = Math.atan2(dy, dx);
          const strength = Math.min(1, 0.6 + distance / 100);
          const count = Math.max(1, Math.floor(distance / WAVE_SPACING));
          const now = performance.now();

          for (let i = 1; i <= count; i++) {
            const t = i / count;
            waves.push({
              x: lastX + dx * t,
              y: lastY + dy * t,
              start: now,
              strength,
              angle,
            });
          }

          if (waves.length > MAX_WAVES) waves.splice(0, waves.length - MAX_WAVES);
        }
      }

      lastX = x;
      lastY = y;
    };

    const onLeave = () => {
      lastX = -1;
      lastY = -1;
    };

    const animate = (now: number) => {
      const dt = lastFrame ? Math.min((now - lastFrame) / 16.67, 2) : 1;
      lastFrame = now;
      clock += dt;

      ctx.clearRect(0, 0, width, height);
      visibleCells.clear();

      for (let i = waves.length - 1; i >= 0; i--) {
        if (now - waves[i].start >= LIFETIME) waves.splice(i, 1);
      }

      if (waves.length) {
        const rangeX = Math.ceil((THICKNESS * 2.5) / cellW);
        const rangeY = Math.ceil((THICKNESS * 2.5) / cellH);

        for (const wave of waves) {
          const age = (now - wave.start) / 16.67;
          const radius = age * RADIUS_SPEED;
          const fade = Math.max(0, 1 - (now - wave.start) / LIFETIME);
          if (fade <= 0) continue;

          const centers = [
            {
              x: wave.x + Math.cos(wave.angle - SPREAD) * radius,
              y: wave.y + Math.sin(wave.angle - SPREAD) * radius,
            },
            {
              x: wave.x + Math.cos(wave.angle + SPREAD) * radius,
              y: wave.y + Math.sin(wave.angle + SPREAD) * radius,
            },
          ];

          for (const center of centers) {
            const minCol = Math.max(0, Math.floor(center.x / cellW) - rangeX);
            const maxCol = Math.min(cols - 1, Math.floor(center.x / cellW) + rangeX);
            const minRow = Math.max(0, Math.floor(center.y / cellH) - rangeY);
            const maxRow = Math.min(rows - 1, Math.floor(center.y / cellH) + rangeY);

            for (let row = minRow; row <= maxRow; row++) {
              for (let col = minCol; col <= maxCol; col++) {
                const x = col * cellW + cellW / 2;
                const y = row * cellH + cellH / 2;
                const distance = Math.hypot(x - center.x, y - center.y);
                if (distance > THICKNESS * 2.5) continue;

                const front = Math.exp(-Math.pow(distance / THICKNESS, 2));
                const influence = front * fade * wave.strength;
                if (influence < DRAW_THRESHOLD) continue;

                const id = row * cols + col;
                const previous = visibleCells.get(id);
                if (!previous || influence > previous.influence) {
                  visibleCells.set(id, { influence, x, y });
                }
              }
            }
          }
        }

        ctx.font = "14px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const [id, cell] of visibleCells) {
          const influence = cell.influence;
          const noise = seed[id] ?? 0.5;
          const brightness = Math.min(255, 70 + influence * 185);

          ctx.fillStyle =
            influence > 0.68
              ? `rgb(${brightness}, ${brightness}, ${brightness})`
              : `rgb(${Math.round(brightness * 0.5)}, ${Math.round(brightness * 0.8)}, ${Math.round(brightness)})`;

          const charIndex = Math.floor(
            (noise * 1000 + Math.floor(clock / 12) * 7) % MOUSE_WAVE_CHARS.length
          );

          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = influence * 4;
          ctx.fillText(MOUSE_WAVE_CHARS[charIndex], cell.x, cell.y);
        }
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("blur", onLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("blur", onLeave);
      waves.length = 0;
      visibleCells.clear();
    };
  }, []);

  return (
    <canvas ref={canvasRef} aria-hidden="true" className="character-wave-canvas" />
  );
}

/* -------------------------------------------------------------------------- */
/*  Hero → tunnel hyperespace (piloté par le scroll)                          */
/* -------------------------------------------------------------------------- */

/**
 * Progression du scroll (0 → 1) dans la section :
 *  0 → ~0.16 : la page d'accueil zoome puis se fond dans les étoiles
 *  0.14 → 1  : des objets 3D arrivent un par un depuis le fond du tunnel
 *              (chacun a sa propre plage de scroll : `start` → `end`)
 */
type Star = { x: number; y: number; z: number };

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Profondeur de départ (loin) et d'arrivée (derrière la caméra), en px. */
const ITEM_Z_START = -2600;
const ITEM_Z_END = 650;
const PERSPECTIVE = 1100;

type WarpItem = {
  id: string;
  /** Plage de progression pendant laquelle l'objet voyage dans le tunnel. */
  start: number;
  end: number;
  /** Position latérale en fraction de la largeur (négatif = gauche). 0 = centre. */
  x: number;
  /** Position verticale en fraction de la hauteur. */
  y: number;
  /** Inclinaison verticale supplémentaire (degrés). */
  tilt?: number;
  node: ReactNode;
};

const cardShell =
  "w-[min(78vw,330px)] rounded-lg border border-cyan-200/25 bg-gradient-to-br from-cyan-300/[0.09] to-slate-950/75 p-4 text-left text-slate-100 backdrop-blur-md sm:p-5";

function TitleNode({ code, title }: { code: string; title: string }) {
  return (
    <div className="w-[92vw] max-w-3xl text-center">
      <p className="mb-3 font-mono text-[10px] tracking-[0.35em] text-cyan-200/80 sm:text-xs">
        // {code}
      </p>
      <h2 className="text-4xl font-black uppercase leading-[1.05] tracking-tight text-white drop-shadow-[0_0_28px_rgba(56,189,248,0.35)] sm:text-6xl lg:text-7xl">
        {title}
      </h2>
      <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-cyan-200 to-transparent" />
    </div>
  );
}

function AboutNode() {
  return (
    <div className={cardShell}>
      <p className="font-mono text-[10px] tracking-[0.22em] text-cyan-200/70">
        PILOT PROFILE / 001
      </p>
      <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
        {PROFILE.about}
      </p>
    </div>
  );
}

function StatsNode() {
  return (
    <div className={cardShell}>
      <p className="font-mono text-[10px] tracking-[0.22em] text-cyan-200/70">
        MISSION STATS
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {STATS.map((stat) => (
          <div key={stat.label} className="border-l border-cyan-200/50 pl-3">
            <p className="text-xl font-bold text-cyan-100 sm:text-2xl">{stat.value}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectNode({ project }: { project: Project }) {
  const linkClass =
    "inline-flex items-center gap-1.5 text-xs text-cyan-200 transition hover:text-white focus-visible:text-white focus-visible:outline-none";

  return (
    <article className={cardShell}>
      <p className="font-mono text-[10px] tracking-[0.2em] text-cyan-200/80">
        {project.code}
      </p>
      <h3 className="mt-1.5 text-base font-semibold text-white sm:text-lg">
        {project.title}
      </h3>
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{project.description}</p>
      <p className="mt-3 font-mono text-[10px] text-cyan-100/65">
        {project.tech.slice(0, 3).join(" / ")}
      </p>
      {(project.repo || project.demo) && (
        <div className="mt-3 flex gap-4">
          {project.repo && (
            <a href={project.repo} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <Github className="h-3.5 w-3.5" aria-hidden />
              <WaveText>Code</WaveText>
            </a>
          )}
          {project.demo && (
            <a href={project.demo} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              <WaveText>Démo</WaveText>
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function StackNode({ item }: { item: StackModule }) {
  const Icon = item.icon;
  return (
    <div className={cardShell}>
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">
          <Icon size={18} aria-hidden />
        </span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-cyan-200/60">
          {item.code}
        </span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{item.title}</h3>
      <p className="mt-1.5 text-xs leading-5 text-slate-400">{item.items.join(" · ")}</p>
    </div>
  );
}

/**
 * Les objets du tunnel. Chacun voyage de `start` à `end` (progression du scroll) :
 * il naît au centre, petit et transparent, grossit en s'approchant, dérive vers
 * son côté (x < 0 = gauche) puis passe à côté de la caméra. Les plages se
 * chevauchent : il y a toujours quelque chose qui arrive, sans « bascule ».
 *
 * Les valeurs ci-dessous sont écrites sur l'ancienne échelle (premier objet à 0.37) ;
 * `warpT` les recale automatiquement juste après l'entrée dans les étoiles.
 */

/**
 * Recale l'ancienne timeline : le 1er objet (ancien 0.37) arrive maintenant à 0.14,
 * juste après l'entrée dans les étoiles, et la fin (1) reste à 1. Plus de scroll à vide.
 */
const warpT = (v: number) => 0.14 + (v - 0.37) * (0.86 / 0.63);



const WARP_ITEMS_RAW: WarpItem[] = [
  // — Identité —
  {
    id: "t-identity",
    start: 0.49,
    end: 0.55,
    x: 0,
    y: -0.02,
    node: <TitleNode code="SYS_01 // IDENTITÉ" title="Qui suis-je ?" />,
  },
  {
    id: "about",
    start: 0.49,
    end: 0.56,
    x: -0.3,
    y: -0.1,
    tilt: 6,
    node: <AboutNode />,
  },
  {
    id: "stats",
    start: 0.50,
    end: 0.57,
    x: 0.3,
    y: 0.12,
    tilt: -5,
    node: <StatsNode />,
  },

  // — Projets —
  {
    id: "t-projects",
    start: 0.57,
    end: 0.69,
    x: 0,
    y: -0.02,
    node: <TitleNode code="SYS_02 // MISSIONS" title="Mes projets" />,
  },
  ...PROJECTS.map((project, i) => ({
    id: project.code,
    start: [0.58, 0.59, 0.60, 0.61][i],
    end: [0.76, 0.77, 0.78, 0.79][i],
    x: i % 2 === 0 ? -0.31 : 0.31,
    y: [-0.14, 0.1, 0.14, -0.12][i],
    tilt: [5, -4, -5, 4][i],
    node: <ProjectNode project={project} />,
  })),

  // — Technologies —
  {
    id: "t-stack",
    start: 0.77,
    end: 0.87,
    x: 0,
    y: -0.02,
    node: (
      <TitleNode
        code="CORE_03 // TECHNOLOGIES"
        title="Mon arsenal"
      />
    ),
  },
  ...STACK.slice(0, 4).map((item, i) => ({
    id: item.code,
    start: [0.78, 0.80, 0.82, 0.84][i],
    end: [0.93, 0.95, 0.97, 0.98][i],
    x: i % 2 === 0 ? -0.3 : 0.3,
    y: [0.12, -0.12, 0.1, -0.1][i],
    tilt: [-4, 5, -5, 4][i],
    node: <StackNode item={item} />,
  })),
];


const WARP_ITEMS: WarpItem[] = WARP_ITEMS_RAW.map((item) => ({
  ...item,
  start: warpT(item.start),
  end: warpT(item.end),
}));

/* -------------------------------------------------------------------------- */
/*  Après le tunnel : système solaire, puis trou noir                         */
/* -------------------------------------------------------------------------- */

/** Part du scroll consacrée au tunnel. Le reste = l'espace (système solaire + trou noir). */
const TUNNEL_END = 0.66;

function Hero({
  onProjectsClick,
}: {
  onProjectsClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <section className="relative mx-auto flex h-full max-w-4xl flex-col items-center justify-center px-6 py-16 text-center">
      



      <h1 className="text-5xl font-black leading-[1.08] tracking-tight sm:text-7xl">
        <span className={`block ${accent}`}>
          <GlitchText text={PROFILE.name} decrypt duration={1800} />
        </span>
        <span className="mt-2 block">
          <GlitchText text={PROFILE.role} decrypt duration={2400} />
        </span>
      </h1>

      <p className={`mx-auto mt-8 max-w-xl text-base leading-7 sm:text-lg ${muted}`}>
        <CorruptText text={PROFILE.bio} interval={130} intensity={2} />
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <a
          href="#projects"
          onClick={onProjectsClick}
          className={`inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 ${focusRing}`}
        >
          <WaveText>Voir mes projets</WaveText>
          <ArrowDownRight size={16} aria-hidden />
        </a>
        <a
          href="#contact"
          className={`inline-flex items-center gap-2 rounded-full border border-slate-300 px-7 py-3.5 text-sm font-medium transition hover:border-cyan-500/60 hover:text-cyan-700 dark:border-white/15 dark:hover:text-cyan-300 ${focusRing}`}
        >
          <WaveText>Me contacter</WaveText>
          <ArrowRight size={16} aria-hidden />
        </a>
      </div>
    </section>
  );
}

function WarpTunnel() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distRef = useRef<HTMLSpanElement>(null);
  const speedRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const rainRef = useRef<HTMLDivElement>(null);
  const warpLayerRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const suckRef = useRef<HTMLDivElement>(null);
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const hudCanvasRef = useRef<HTMLCanvasElement>(null);
  const resetRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLParagraphElement>(null);
  const suppressResetRef = useRef(false);

  // SFX : l'audio ne peut démarrer qu'après un clic (règle des navigateurs).
  const [soundOn, setSoundOn] = useState(false);
  const toggleSound = () => {
    const next = !soundOn;
    sfx.setEnabled(next);
    setSoundOn(next);
  };

  // Le bouton « Voir mes projets » fait voyager jusqu'au panneau des projets.
  const goToProjects = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const section = sectionRef.current;
    if (!section) return;
    const total = section.offsetHeight - window.innerHeight;
    const top = section.getBoundingClientRect().top + window.scrollY + total * 0.5 * TUNNEL_END;
    window.scrollTo({ top, behavior: "smooth" });
  };

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const threeCanvas = threeCanvasRef.current;
    const hudCanvas = hudCanvasRef.current;
    const hudCtx = hudCanvas?.getContext("2d");
    if (!section || !canvas || !ctx || !threeCanvas || !hudCanvas || !hudCtx) return;

    // Annule le décalage laissé par la navbar : le sticky s'active dès le 1er pixel de scroll.
    const previousMarginTop = section.style.marginTop;
    section.style.marginTop = "0px";
    const offsetTop = section.getBoundingClientRect().top + window.scrollY;
    section.style.marginTop = offsetTop > 0 ? `-${offsetTop}px` : previousMarginTop;

    const scene3D = new SpaceScene3D(threeCanvas);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const DEPTH = 5000;
    const FOCAL = 820;
    const COUNT = 5000;
    const MAX_SPEED = 1000;
    const stars: Star[] = Array.from({ length: COUNT }, () => ({ x: 0, y: 0, z: 0 }));

    let w = 0;
    let h = 0;
    let raf = 0;
    let raw = 0; // progression sur toute la section (0 → 1)
    let progress = 0; // progression du tunnel seul (0 → 1)
    let space = 0; // progression de l'espace : système solaire puis trou noir (0 → 1)
    let resetting = false;
    const timers: number[] = [];
    let last = performance.now();
    let lastY = window.scrollY;
    let scrollImpulse = 0;
    let travel = 0;

    const spawn = (star: Star, far = false) => {
      // Disperser les étoiles autour du point de fuite pour un tunnel profond.
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * Math.max(w, h) * 0.9 + 30;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius;
      star.z = far ? DEPTH : 1 + Math.random() * (DEPTH - 1);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      hudCanvas.width = Math.max(1, Math.floor(w * dpr));
      hudCanvas.height = Math.max(1, Math.floor(h * dpr));
      hudCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      scene3D.resize(w, h);
      stars.forEach((star) => spawn(star));
      ctx.fillStyle = "#02040b";
      ctx.fillRect(0, 0, w, h);
    };

    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const total = Math.max(1, section.offsetHeight - window.innerHeight);

      // Le calcul basé sur -rect.top attendait que la section passe sous la navbar
      // Fumadocs avant de démarrer. Avec scrollY, le zoom répond dès le premier scroll.
      raw = Math.min(1, Math.max(0, window.scrollY / total));
      progress = Math.min(1, raw / TUNNEL_END);
      space = Math.min(1, Math.max(0, (raw - TUNNEL_END) / (1 - TUNNEL_END)));
      return rect.bottom > 0 && rect.top < window.innerHeight;
    };

    // Place chaque objet dans le tunnel selon la progression (position 3D continue).
    const updateItems = (now: number) => {
      const mobile = w < 768;

      WARP_ITEMS.forEach((item, i) => {
        const el = itemRefs.current[i];
        if (!el) return;

        const t = (progress - item.start) / (item.end - item.start);
        if (t <= 0 || t >= 1) {
          if (el.style.visibility !== "hidden") {
            el.style.visibility = "hidden";
            el.style.opacity = "0";
            el.style.pointerEvents = "none";
          }
          return;
        }

        // Avance à vitesse constante : la perspective fait le reste (plus il est
        // proche, plus il grossit et s'écarte du centre).
        const z = ITEM_Z_START + (ITEM_Z_END - ITEM_Z_START) * t;
        const opacity = Math.min(smoothstep(0, 0.3, t), 1 - smoothstep(0.86, 1, t));

        const side = Math.sign(item.x);
        const flare = 1 + 0.35 * t; // s'écarte un peu plus en passant
        const x = item.x * w * (mobile ? 0.45 : 1) * flare;

        // Flottement léger, décalé pour chaque objet.
        const phase = i * 1.9;
        const bob = reduced ? 0 : Math.sin(now * 0.0016 + phase) * 9;
        const sway = reduced ? 0 : Math.sin(now * 0.0011 + phase * 1.3) * 1.6;

        const y = item.y * h * (mobile ? 1.7 : 1) + bob;
        // Le bord extérieur est plus proche de la caméra que le bord intérieur.
        const ry = -side * (32 - 12 * t) + sway;
        const rx = (item.tilt ?? 0) + sway * 0.6;

        // SFX : l'objet vient d'apparaître (il était caché à la frame précédente).
        if (el.style.visibility === "hidden") sfx.whoosh(item.x);

        el.style.visibility = "visible";
        el.style.opacity = opacity.toFixed(3);
        el.style.zIndex = String(Math.round(z + 3000)); // le plus proche au-dessus
        el.style.pointerEvents = opacity > 0.7 && z > -900 && z < 450 ? "auto" : "none";
        el.style.transform = `translate(-50%, -50%) translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
      });
    };

    // Transition de la page d'accueil : zoom, puis fondu vers les étoiles.
    const updateLayers = () => {
      // Le zoom démarre dès le premier mouvement de scroll, sans petite zone morte.
      // Il continue pendant toute la transition, jusqu'à la disparition du Hero.
      const zoom = smoothstep(0, 0.16, progress);
      const fade = smoothstep(0.06, 0.09, progress);
      const stars = smoothstep(0.07, 0.12, progress);

      const hero = heroRef.current;
      if (hero) {
        hero.style.opacity = String(1 - fade);
        hero.style.visibility = fade >= 0.995 ? "hidden" : "visible";
        hero.style.pointerEvents = fade > 0.5 ? "none" : "auto";
      }

      // La pluie de code et le texte du Hero zooment avec la même courbe.
      const zoomTransform = reduced
        ? "none"
        : `scale(${1 + Math.pow(zoom, 1.5) * 12})`;

      const heroInner = heroInnerRef.current;
      if (heroInner) heroInner.style.transform = zoomTransform;

      const rain = rainRef.current;
      if (rain) rain.style.transform = zoomTransform;

      const warpLayer = warpLayerRef.current;
      if (warpLayer) warpLayer.style.opacity = String(stars);

      const hint = hintRef.current;
      if (hint) hint.style.opacity = String(1 - smoothstep(0.13, 0.2, progress));

      // Trou noir : tout ce qui est à l'écran est aspiré en spirale vers le centre.
      const suck = suckRef.current;
      if (suck) {
        const pull = Math.pow(smoothstep(0.7, 0.97, space), 1.7);
        suck.style.transform = reduced
          ? "none"
          : `rotate(${(pull * 720).toFixed(1)}deg) scale(${(1 - pull * 0.985).toFixed(4)})`;
        suck.style.opacity = String(1 - smoothstep(0.94, 0.995, space));
      }
    };

    const updateHud = (velocity: number) => {
      if (distRef.current) {
        distRef.current.textContent = String(Math.round(travel / 10 + progress * 9000)).padStart(5, "0");
      }
      if (speedRef.current) {
        speedRef.current.textContent = `${Math.round((velocity / MAX_SPEED) * 100)}%`;
      }
      if (barRef.current) barRef.current.style.width = `${raw * 100}%`;
      if (modeRef.current) {
        const text =
          space > 0.65
            ? "WARNING // EVENT HORIZON PENETRATION"
            : space > 0.02
              ? "SUPERMASSIVE BLACK HOLE // APPROACH"
              : "HYPERDRIVE // ENGAGED";
        if (modeRef.current.textContent !== text) modeRef.current.textContent = text;
      }
    };

    // Dessine le trou noir massif en 3D (Three.js) avec HUD télémétrique.
    const drawSpace = (now: number) => {
      scene3D.render(now, space, hudCtx);
    };

    // Fin du trou noir : écran noir, puis retour tout en haut de la page.
    const triggerReset = () => {
      const overlay = resetRef.current;
      if (!overlay || resetting) return;
      resetting = true;

      sfx.boom(); // SFX : impact grave au moment du fondu au noir

      overlay.style.transition = "opacity 600ms ease-in";
      overlay.style.opacity = "1";

      timers.push(
        window.setTimeout(() => {
          const html = document.documentElement;
          const previous = html.style.scrollBehavior;
          html.style.scrollBehavior = "auto";
          window.scrollTo(0, 0);
          html.style.scrollBehavior = previous;

          scrollImpulse = 0;
          travel = 0;
          lastY = 0;
          readProgress();
          updateLayers();
          updateItems(0);

          timers.push(
            window.setTimeout(() => {
              overlay.style.transition = "opacity 1400ms ease-out";
              overlay.style.opacity = "0";
              timers.push(
                window.setTimeout(() => {
                  resetting = false;
                }, 1400)
              );
            }, 120)
          );
        }, 650)
      );
    };

    const maybeReset = (delta: number) => {
      // Seulement en descendant, une fois le trou noir terminé.
      if (delta > 0 && raw >= 0.985 && !suppressResetRef.current) triggerReset();
    };

    const render = (velocity: number, dt: number, flash: number, warp: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const norm = Math.min(1, velocity / MAX_SPEED);
      const fade = 0.18 + norm * 0.25;

      // Fond avec une traînée douce, qui s'intensifie quand le scroll accélère.
      ctx.fillStyle = `rgba(1, 3, 12, ${Math.max(0.12, 1 - fade)})`;
      ctx.fillRect(0, 0, w, h);

      const hyperSpeed =
        smoothstep(0.2, 0.3, progress) *
        (1 - smoothstep(0.92, 1, progress));
      const halo = ctx.createRadialGradient(
        cx, cy, 0,
        cx, cy, Math.max(w, h) * 0.72
      );

      halo.addColorStop(0, `rgba(100, 190, 255, ${hyperSpeed * 0.52})`);
      halo.addColorStop(0.1, `rgba(24, 90, 190, ${hyperSpeed * 0.2})`);
      halo.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      ctx.save();

      const step = velocity * dt;
      ctx.lineCap = "round";
      ctx.globalCompositeOperation = "screen";

      for (const star of stars) {
        const oldZ = star.z;
        star.z -= step;
        if (star.z < 1) {
          spawn(star, true);
          continue;
        }

        const k = FOCAL / star.z;
        const sx = cx + star.x * k;
        const sy = cy + star.y * k;
        if (sx < -100 || sx > w + 100 || sy < -100 || sy > h + 100) {
          spawn(star, true);
          continue;
        }

        const previousZ = Math.min(DEPTH, oldZ + Math.max(8, step * (1.4 + norm * 4)));
        const previousK = FOCAL / previousZ;
        const px = cx + star.x * previousK;
        const py = cy + star.y * previousK;
        const depth = 1 - star.z / DEPTH;
        const alpha = Math.min(1, 0.18 + depth * 0.78 + norm * 0.18);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = `rgba(${Math.round(160 + norm * 95)}, ${Math.round(205 + norm * 45)}, 255, ${alpha})`;
        ctx.lineWidth = 0.45 + depth * (1 + norm * 2);
        ctx.stroke();

        // Éclat ponctuel à la tête de chaque traînée.
        if (depth > 0.7) {
          ctx.fillStyle = `rgba(220, 242, 255, ${alpha * 0.65})`;
          ctx.fillRect(sx, sy, 1.4 + norm * 1.5, 1.4 + norm * 1.5);
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const visible = readProgress();
      updateLayers();
      updateItems(now);

      const delta = window.scrollY - lastY;
      const dy = Math.abs(delta);
      lastY = window.scrollY;
      const dt = Math.min(40, now - last) / 2;
      last = now;

      // Le geste de scroll donne l'impulsion ; l'inertie fait durer l'accélération.
      scrollImpulse += Math.min(80, dy) * 0.5;
      scrollImpulse *= Math.pow(0.91, dt);
      if (!visible) return;

      // Sortie d'hyperespace : la vitesse retombe, les traînées redeviennent des étoiles.
      const exit = 1 - smoothstep(0, 0.12, space);
      const topSlow = smoothstep(0.12, 0.3, progress);
      const base = Math.min(MAX_SPEED, 0.05 + topSlow * 19 + scrollImpulse * 1.65);
      const velocity = reduced ? 0 : Math.max(0.05, base * exit);
      const warp = smoothstep(0.3, 0.38, progress) * exit;
      travel += velocity * dt;
      const flashJump =
        Math.max(0, 1 - Math.abs(progress - 0.31) / 0.07) * 0.65;
      const flashExit = Math.max(0, 1 - Math.abs(space - 0.012) / 0.04) * 0.7;

      render(velocity, dt, Math.max(flashJump, flashExit), warp);
      drawSpace(now);
      updateHud(velocity);
      // SFX : souffle, nappe et grondement pilotés par le scroll + vitesse.
      sfx.update(progress, space, Math.min(1, velocity / MAX_SPEED));
      maybeReset(delta);
    };

    const staticFrame = () => {
      const delta = window.scrollY - lastY;
      lastY = window.scrollY;
      readProgress();
      updateLayers();
      updateItems(0);
      render(0, 0, 0, space > 0 ? 0 : 0.2);
      drawSpace(0);
      updateHud(0);
      maybeReset(delta);
    };

    // SFX d'interface : bip au survol et au clic sur n'importe quel lien / bouton.
    const isUi = (e: Event) =>
      (e.target as Element | null)?.closest?.("a, button");
    const onOver = (e: Event) => {
      if (isUi(e)) sfx.hover();
    };
    const onClick = (e: Event) => {
      if (isUi(e)) sfx.click();
    };
    document.addEventListener("pointerover", onOver);
    document.addEventListener("click", onClick);

    resize();
    readProgress();
    updateLayers();
    updateItems(0);
    updateHud(0);

    window.addEventListener("resize", resize);
    if (reduced) {
      staticFrame();
      window.addEventListener("scroll", staticFrame, { passive: true });
    } else {
      raf = requestAnimationFrame(frame);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", staticFrame);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("click", onClick);
      sfx.suspend();
      timers.forEach((id) => window.clearTimeout(id));
      section.style.marginTop = previousMarginTop;
      scene3D.destroy();
    };
  }, []);

  return (
    <section
      id="projects"
      ref={sectionRef}
      aria-label="Voyage : accueil, hyperespace, système solaire et trou noir"
      className="relative h-[1200vh] bg-[#01030a] text-slate-100"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Tout ce bloc est aspiré par le trou noir à la fin du voyage */}
        <div ref={suckRef} className="absolute inset-0 will-change-transform">
          {/* Couche étoiles : apparaît en fondu pendant que l'accueil zoome */}
          <div ref={warpLayerRef} style={{ opacity: 0 }} className="absolute inset-0">
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(0,0,8,0.42)_62%,rgba(0,0,0,0.92)_100%)]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5 font-mono text-[10px] tracking-[0.2em] text-cyan-200/90 sm:text-[11px]"
            >
              <div>
                <p ref={modeRef}>HYPERDRIVE // ENGAGED</p>
                <p className="mt-1 text-slate-500">DISTANCE <span ref={distRef}>00000</span> AL</p>
              </div>
              <div className="text-right">
                <p>VELOCITY <span ref={speedRef}>0%</span></p>
                <p className="mt-1 text-slate-500">WARP SYSTEM // {PROFILE.version}</p>
              </div>
            </div>

            <div
              ref={hintRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-14 z-10 text-center font-mono text-xs tracking-[0.25em] text-cyan-200"
            >
              <p>HYPERDRIVE READY</p>
              <p className="mt-2 animate-pulse text-slate-400 motion-reduce:animate-none">SCROLLE POUR ENTRER DANS L’HYPERESPACE</p>
            </div>
          </div>

          {/* Objets 3D du tunnel : positions pilotées par le scroll (voir updateItems) */}
          <div
            className="pointer-events-none absolute inset-0 z-10"
            style={{ perspective: `${PERSPECTIVE}px` }}
          >
            {WARP_ITEMS.map((item, i) => (
              <div
                key={item.id}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                style={{ opacity: 0, visibility: "hidden" }}
                className="absolute left-1/2 top-1/2 will-change-transform"
              >
                {item.node}
              </div>
            ))}
          </div>
        </div>

        {/* Scène spatiale 3D Three.js : Trou Noir Massif */}
        <canvas
          ref={threeCanvasRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {/* Overlay HUD Télémétrique 2D */}
        <canvas
          ref={hudCanvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {/* Page d'accueil : [pluie + vague] au même niveau, puis le texte du Hero */}
        <div ref={heroRef} className="absolute inset-0 isolate z-10">
          {/* Calque d'arrière-plan commun : même opacité, même zoom pour la pluie et la vague.
              Pour rendre l'ensemble plus (ou moins) visible, change uniquement l'opacité ici. */}
          <div
            ref={rainRef}
            className="absolute inset-0 opacity-30 will-change-transform dark:opacity-40"
          >
            <CodeRain />
            <MouseWave />
          </div>

          {/* Texte du Hero (zoome avec le calque d'arrière-plan) */}
          <div ref={heroInnerRef} className="absolute inset-0 will-change-transform">
            <Hero onProjectsClick={goToProjects} />
          </div>
        </div>

        {/* Fondu au noir pendant le retour en haut de page */}
        <div
          ref={resetRef}
          aria-hidden="true"
          style={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0 z-40 bg-black"
        />

        {/* Bouton son : le clic débloque l'audio du navigateur */}
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={soundOn}
          aria-label={soundOn ? "Couper le son" : "Activer le son"}
          className="absolute bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-black/50 px-4 py-2 font-mono text-[10px] tracking-[0.2em] text-cyan-200 backdrop-blur transition hover:border-cyan-200/70"
        >
          {soundOn ? <Volume2 size={14} aria-hidden /> : <VolumeX size={14} aria-hidden />}
          SON {soundOn ? "ON" : "OFF"}
        </button>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sections classiques                                                       */
/* -------------------------------------------------------------------------- */

/** Fait apparaître les lignes du terminal une à une (commandes tapées). */
function useTerminalTyping(lines: TerminalLine[]) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setLineIndex(lines.length);
      return;
    }
    if (lineIndex >= lines.length) return;

    const current = lines[lineIndex];

    if (current.kind === "out") {
      const t = setTimeout(() => setLineIndex((i) => i + 1), 350);
      return () => clearTimeout(t);
    }

    if (charIndex < current.text.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), 28);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLineIndex((i) => i + 1);
      setCharIndex(0);
    }, 300);
    return () => clearTimeout(t);
  }, [lineIndex, charIndex, lines]);

  return { lineIndex, charIndex };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function HomePage() {
  useEffect(() => {
    // Démarre toujours sur la première vue, sans restauration d'un ancien scroll.
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    if (window.scrollY !== 0) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return () => {
      window.history.scrollRestoration = previousRestoration;
    };
  }, []);

  // `overflow-x-clip` (et non `overflow-hidden`) : sinon le `sticky` du tunnel ne fonctionne pas.
  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-white text-slate-900 dark:bg-black dark:text-slate-100">
      <WarpTunnel />
    </main>
  );
}