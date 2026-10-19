/**
 * Rendu réaliste du système solaire binaire et du trou noir.
 * Remplace drawSolarSystem / drawBlackHole de la page (mêmes signatures).
 *
 *  - Planètes : textures procédurales (gazeuses, rocheuses, océan + nuages),
 *    projetées sur une sphère, éclairées par les soleils (terminateur),
 *    atmosphère, anneaux multi-bandes avec ombre portée, lune à phases.
 *  - Soleils : granulation + taches, assombrissement du bord, couronne,
 *    protubérances et reflet anamorphique.
 *  - Trou noir : ombre, anneau de photons, disque d'accrétion avec lentille
 *    gravitationnelle (arc au-dessus ET en dessous), effet Doppler (côté
 *    qui approche plus brillant), dégradé de température, étoiles déformées.
 */

const TAU = Math.PI * 2;

type RGB = [number, number, number];

/* -------------------------------------------------------------------------- */
/*  Utilitaires                                                               */
/* -------------------------------------------------------------------------- */

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

function hash2(x: number, y: number, seed: number) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Bruit de valeur, périodique horizontalement (période `wrap`). */
function vnoise(u: number, v: number, wrap: number, seed: number) {
  const xi = Math.floor(u);
  const yi = Math.floor(v);
  const xf = u - xi;
  const yf = v - yi;
  const sx = xf * xf * (3 - 2 * xf);
  const sy = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % wrap) + wrap) % wrap;
  const x1 = (x0 + 1) % wrap;
  const a = hash2(x0, yi, seed);
  const b = hash2(x1, yi, seed);
  const c = hash2(x0, yi + 1, seed);
  const d = hash2(x1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(u: number, v: number, wrap: number, octaves: number, seed: number) {
  let amp = 0.5;
  let sum = 0;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(u * f, v * f, wrap * f, seed + o * 17);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

function pal(stops: RGB[], t: number): RGB {
  const x = clamp(t) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/* -------------------------------------------------------------------------- */
/*  Planètes                                                                  */
/* -------------------------------------------------------------------------- */

type PlanetKind = "rock" | "earth" | "cloud" | "gas";

type Planet = {
  name: string;
  kind: PlanetKind;
  palette: RGB[];
  atm: string; // couleur d'atmosphère "r,g,b"
  orbit: number; // demi-grand axe (fraction de la plus petite dimension)
  e: number; // excentricité
  omega: number; // orientation du périhélie
  speed: number; // rad/ms
  size: number;
  phase: number;
  spin: number; // rotation propre (rad/ms)
  seed: number;
  bands?: number;
  storm?: boolean;
  ring?: boolean;
  moon?: boolean;
};

const PLANETS: Planet[] = [
  {
    name: "NEXT.JS", kind: "rock", seed: 11, atm: "0,0,0",
    palette: [[58, 54, 50], [122, 116, 108], [190, 182, 170]],
    orbit: 0.16, e: 0.14, omega: 0.6, speed: 0.00055, size: 0.012, phase: 0.4, spin: 0.0004,
  },
  {
    name: "REACT", kind: "earth", seed: 23, atm: "110,180,255", moon: true,
    palette: [],
    orbit: 0.22, e: 0.03, omega: 2.2, speed: 0.00042, size: 0.017, phase: 2.1, spin: 0.0007,
  },
  {
    name: "TYPESCRIPT", kind: "rock", seed: 37, atm: "230,150,100",
    palette: [[84, 34, 20], [170, 80, 44], [220, 146, 98]],
    orbit: 0.3, e: 0.09, omega: 4.0, speed: 0.00031, size: 0.02, phase: 4.2, spin: 0.0006,
  },
  {
    name: "TAILWIND", kind: "cloud", seed: 41, atm: "255,225,170",
    palette: [[160, 120, 74], [222, 190, 128], [248, 230, 186]],
    orbit: 0.38, e: 0.02, omega: 1.1, speed: 0.00024, size: 0.016, phase: 5.6, spin: 0.0003,
  },
  {
    name: "NODE.JS", kind: "gas", seed: 53, atm: "240,215,160", ring: true, bands: 9,
    palette: [[150, 112, 66], [212, 180, 128], [244, 224, 178]],
    orbit: 0.52, e: 0.05, omega: 3.1, speed: 0.00017, size: 0.03, phase: 1.3, spin: 0.0009,
  },
  {
    name: "POSTGRES", kind: "gas", seed: 67, atm: "150,190,255", bands: 5, storm: true,
    palette: [[80, 96, 160], [146, 166, 222], [206, 220, 246]],
    orbit: 0.64, e: 0.04, omega: 5.2, speed: 0.00012, size: 0.025, phase: 3.3, spin: 0.0008,
  },
  {
    name: "DOCKER", kind: "gas", seed: 79, atm: "90,150,255", bands: 3,
    palette: [[18, 36, 120], [38, 78, 198], [108, 158, 240]],
    orbit: 0.76, e: 0.06, omega: 0.2, speed: 0.00009, size: 0.015, phase: 0.1, spin: 0.0008,
  },
];

const TEX_W = 256;
const TEX_H = 128;
const texCache = new Map<string, HTMLCanvasElement>();

const EARTH_OCEAN: RGB[] = [[5, 20, 64], [12, 64, 136], [32, 122, 192]];
const EARTH_LAND: RGB[] = [[36, 82, 38], [92, 118, 58], [148, 128, 88], [198, 188, 168]];

function getPlanetTexture(p: Planet): HTMLCanvasElement {
  const cached = texCache.get(p.name);
  if (cached) return cached;

  const c = document.createElement("canvas");
  c.width = TEX_W * 2; // dupliqué : permet de faire défiler sans couture
  c.height = TEX_H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(TEX_W, TEX_H);
  const d = img.data;

  for (let y = 0; y < TEX_H; y++) {
    for (let x = 0; x < TEX_W; x++) {
      const u = x / TEX_W;
      const v = y / TEX_H;
      let col: RGB;

      if (p.kind === "earth") {
        const land = fbm(u * 5, v * 2.6, 5, 5, p.seed);
        col =
          land > 0.54
            ? pal(EARTH_LAND, clamp((land - 0.54) / 0.28))
            : pal(EARTH_OCEAN, clamp(land / 0.54));
        const lat = Math.abs(v - 0.5) * 2;
        col = mix(col, [240, 246, 252], smoothstep(0.84, 0.95, lat));
        const cl = fbm(u * 7 + 3, v * 5, 7, 5, p.seed + 99);
        col = mix(col, [255, 255, 255], smoothstep(0.52, 0.74, cl) * 0.85);
      } else if (p.kind === "gas") {
        const warp = fbm(u * 3, v * 6, 3, 3, p.seed) - 0.5;
        const band = 0.5 + 0.5 * Math.sin((v * (p.bands ?? 6) + warp * 0.9) * TAU);
        const fine = fbm(u * 4, v * 26, 4, 3, p.seed + 5);
        col = pal(p.palette, clamp(band * 0.62 + fine * 0.5 - 0.08));
        if (p.storm) {
          const du = Math.min(Math.abs(u - 0.3), 1 - Math.abs(u - 0.3)) * 2.4;
          const dv = (v - 0.62) * 1.6;
          const k = 1 - Math.sqrt(du * du + dv * dv) * 3.2;
          if (k > 0) col = mix(col, [196, 92, 70], clamp(k) * 0.85);
        }
      } else if (p.kind === "cloud") {
        const wu = (fbm(u * 3, v * 3, 3, 3, p.seed) - 0.5) * 1.6;
        const t = 0.3 + 0.7 * fbm(u * 3 + wu, v * 8, 3, 4, p.seed + 3);
        col = pal(p.palette, t);
      } else {
        const n = fbm(u * 6, v * 3.2, 6, 5, p.seed);
        col = pal(p.palette, clamp((n - 0.25) * 1.7));
        const lat = Math.abs(v - 0.5) * 2;
        if (p.name === "TYPESCRIPT") col = mix(col, [236, 240, 244], smoothstep(0.9, 0.97, lat) * 0.8);
      }

      const i = (y * TEX_W + x) * 4;
      d[i] = col[0];
      d[i + 1] = col[1];
      d[i + 2] = col[2];
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  g.putImageData(img, TEX_W, 0);

  // Cratères pour les mondes rocheux.
  if (p.kind === "rock") {
    for (let k = 0; k < 70; k++) {
      const cx = hash2(k, 1, p.seed) * TEX_W;
      const cy = (0.12 + hash2(k, 2, p.seed) * 0.76) * TEX_H;
      const cr = 1.5 + hash2(k, 3, p.seed) * hash2(k, 4, p.seed) * 7;
      for (const off of [0, TEX_W]) {
        g.fillStyle = "rgba(0,0,0,0.22)";
        g.beginPath();
        g.arc(cx + off, cy, cr, 0, TAU);
        g.fill();
        g.strokeStyle = "rgba(255,255,255,0.14)";
        g.lineWidth = 0.8;
        g.beginPath();
        g.arc(cx + off - cr * 0.12, cy - cr * 0.12, cr, Math.PI * 0.9, Math.PI * 1.9);
        g.stroke();
      }
    }
  }

  texCache.set(p.name, c);
  return c;
}

/** Sphère texturée : chaque colonne de pixels échantillonne la texture (projection orthographique). */
function drawTexturedSphere(
  ctx: CanvasRenderingContext2D,
  tex: HTMLCanvasElement,
  x: number,
  y: number,
  r: number,
  rot: number
) {
  for (let i = Math.floor(-r); i < Math.ceil(r); i++) {
    const a0 = Math.asin(clamp(i / r, -1, 1));
    const a1 = Math.asin(clamp((i + 1) / r, -1, 1));
    const hh = Math.sqrt(Math.max(0, r * r - (i + 0.5) * (i + 0.5)));
    if (hh <= 0) continue;
    const lon = (((a0 + rot) / TAU) % 1 + 1) % 1;
    const sx = lon * TEX_W;
    const sw = Math.max(0.6, ((a1 - a0) / TAU) * TEX_W);
    ctx.drawImage(tex, sx, 0, sw, TEX_H, x + i, y - hh, 1.4, hh * 2);
  }
}

function drawLitBall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rgb: RGB,
  sunX: number,
  sunY: number
) {
  let nx = x - sunX;
  let ny = y - sunY;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;
  const g = ctx.createRadialGradient(x - nx * r * 0.5, y - ny * r * 0.5, r * 0.1, x - nx * r * 0.2, y - ny * r * 0.2, r * 1.35);
  g.addColorStop(0, `rgb(${rgb[0] | 0},${rgb[1] | 0},${rgb[2] | 0})`);
  g.addColorStop(0.6, `rgb(${(rgb[0] * 0.45) | 0},${(rgb[1] * 0.45) | 0},${(rgb[2] * 0.45) | 0})`);
  g.addColorStop(1, "rgb(4,5,10)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

/** [rayon intérieur, rayon extérieur, opacité] en rayons planétaires. */
const RING_BANDS: [number, number, number][] = [
  [1.3, 1.46, 0.2],
  [1.48, 1.72, 0.5],
  [1.74, 1.92, 0.62],
  [1.96, 2.06, 0.14], // division de Cassini
  [2.08, 2.32, 0.4],
  [2.35, 2.42, 0.14],
];
const RING_ROT = -0.32;
const RING_FLAT = 0.3;

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, front: boolean) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(RING_ROT);
  ctx.scale(1, RING_FLAT);
  for (const [inner, outer, alpha] of RING_BANDS) {
    ctx.strokeStyle = `rgba(226,206,168,${alpha * (front ? 1 : 0.85)})`;
    ctx.lineWidth = (outer - inner) * r;
    ctx.beginPath();
    ctx.arc(0, 0, ((inner + outer) / 2) * r, front ? 0 : Math.PI, front ? Math.PI : TAU);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPlanet(
  ctx: CanvasRenderingContext2D,
  p: Planet,
  x: number,
  y: number,
  r: number,
  sunX: number,
  sunY: number,
  now: number,
  labels = true
) {
  let nx = x - sunX;
  let ny = y - sunY;
  const len = Math.hypot(nx, ny) || 1;
  nx /= len;
  ny /= len;

  const moonAng = now * 0.0018 + p.phase;
  const moonBehind = Math.sin(moonAng) < 0;
  const drawMoon = () => {
    if (!p.moon) return;
    const mr = Math.max(1.4, r * 0.27);
    drawLitBall(ctx, x + Math.cos(moonAng) * r * 2.3, y + Math.sin(moonAng) * r * 0.85, mr, [210, 212, 220], sunX, sunY);
  };

  if (moonBehind) drawMoon();
  if (p.ring) drawRing(ctx, x, y, r, false);

  // Corps
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
  if (r >= 4) {
    drawTexturedSphere(ctx, getPlanetTexture(p), x, y, r, now * p.spin + p.phase);
  } else {
    const mid = p.kind === "earth" ? ([40, 100, 170] as RGB) : pal(p.palette, 0.55);
    ctx.fillStyle = `rgb(${mid[0] | 0},${mid[1] | 0},${mid[2] | 0})`;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Éclairage : terminateur doux, côté nuit presque noir.
  const lx = x - nx * r * 0.55;
  const ly = y - ny * r * 0.55;
  const shade = ctx.createRadialGradient(lx, ly, r * 0.15, lx, ly, r * 1.75);
  shade.addColorStop(0, "rgba(0,0,10,0)");
  shade.addColorStop(0.5, "rgba(0,0,10,0.12)");
  shade.addColorStop(0.78, "rgba(0,0,10,0.72)");
  shade.addColorStop(1, "rgba(0,0,10,0.96)");
  ctx.fillStyle = shade;
  ctx.fillRect(x - r - 1, y - r - 1, r * 2 + 2, r * 2 + 2);

  // Ombre portée des anneaux sur la planète.
  if (p.ring) {
    ctx.translate(x, y);
    ctx.rotate(RING_ROT);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    const shift = r * 0.16 * (ny >= 0 ? 1 : -1);
    ctx.fillRect(-r, shift - r * 0.06, r * 2, r * 0.12);
  }
  ctx.restore();

  // Atmosphère : liseré lumineux côté soleil.
  if (p.atm !== "0,0,0" && r >= 3) {
    const sa = Math.atan2(-ny, -nx);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(${p.atm},0.5)`;
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.03, sa - 1.3, sa + 1.3);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${p.atm},0.12)`;
    ctx.lineWidth = Math.max(1, r * 0.2);
    ctx.beginPath();
    ctx.arc(x, y, r * 1.08, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  if (p.ring) drawRing(ctx, x, y, r, true);
  if (!moonBehind) drawMoon();

  if (labels && r >= 5) {
    ctx.strokeStyle = "rgba(165,243,252,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + r * 0.75, y - r * 0.75);
    ctx.lineTo(x + r * (p.ring ? 2.6 : 1) + 8, y - r * (p.ring ? 2.1 : 1) - 6);
    ctx.stroke();
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(165,243,252,0.65)";
    ctx.fillText(p.name, x + r * (p.ring ? 2.6 : 1) + 11, y - r * (p.ring ? 2.1 : 1) - 4);
  }
}

/* -------------------------------------------------------------------------- */
/*  Soleils                                                                   */
/* -------------------------------------------------------------------------- */

type StarDef = {
  rgb: string; // "r,g,b" de la lumière
  dark: RGB;
  mid: RGB;
  light: RGB;
  seed: number;
  label: string;
};

const SUN_A: StarDef = {
  rgb: "255,208,120", dark: [168, 70, 12], mid: [244, 156, 40], light: [255, 236, 170], seed: 5, label: "CORE // FRONTEND",
};
const SUN_B: StarDef = {
  rgb: "255,110,64", dark: [110, 22, 6], mid: [214, 70, 28], light: [255, 168, 110], seed: 9, label: "CORE // BACKEND",
};

const sunTex = new Map<number, HTMLCanvasElement>();

function getSunTexture(s: StarDef): HTMLCanvasElement {
  const cached = sunTex.get(s.seed);
  if (cached) return cached;
  const S = 192;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  const d = img.data;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S;
      const v = y / S;
      const n = fbm(u * 14, v * 14, 1000, 4, s.seed);
      const gr = fbm(u * 38, v * 38, 1000, 2, s.seed + 7);
      const t = clamp(0.38 + (n - 0.5) * 1.3 + (gr - 0.5) * 1.0);
      const col = pal([s.dark, s.mid, s.light], t);
      const i = (y * S + x) * 4;
      d[i] = col[0];
      d[i + 1] = col[1];
      d[i + 2] = col[2];
      d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  // Taches solaires
  for (let k = 0; k < 6; k++) {
    const sx = (0.25 + hash2(k, 1, s.seed) * 0.5) * S;
    const sy = (0.25 + hash2(k, 2, s.seed) * 0.5) * S;
    const sr = 3 + hash2(k, 3, s.seed) * 7;
    const grad = g.createRadialGradient(sx, sy, 0, sx, sy, sr);
    grad.addColorStop(0, "rgba(30,6,0,0.7)");
    grad.addColorStop(0.55, "rgba(60,14,0,0.45)");
    grad.addColorStop(1, "rgba(60,14,0,0)");
    g.fillStyle = grad;
    g.beginPath();
    g.arc(sx, sy, sr, 0, TAU);
    g.fill();
  }
  sunTex.set(s.seed, c);
  return c;
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  s: StarDef,
  now: number,
  labels = true
) {
  const pulse = 1 + Math.sin(now * 0.002 + s.seed) * 0.03;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  // Couronne : trois halos emboîtés.
  for (const [mul, a] of [[7, 0.07], [3.6, 0.16], [1.9, 0.38]] as const) {
    const gr = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * mul * pulse);
    gr.addColorStop(0, `rgba(${s.rgb},${a})`);
    gr.addColorStop(1, `rgba(${s.rgb},0)`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, r * mul * pulse, 0, TAU);
    ctx.fill();
  }

  // Protubérances / rayons coronaux.
  for (let k = 0; k < 11; k++) {
    const a = (k / 11) * TAU + now * 0.00005 * (k % 2 ? 1 : -1) + hash2(k, 4, s.seed) * 2;
    const len = r * (1.9 + hash2(k, 5, s.seed) * 1.6 + Math.sin(now * 0.0011 + k * 1.7) * 0.35);
    const ex = x + Math.cos(a) * len;
    const ey = y + Math.sin(a) * len;
    const px = -Math.sin(a) * r * 0.16;
    const py = Math.cos(a) * r * 0.16;
    const lg = ctx.createLinearGradient(x, y, ex, ey);
    lg.addColorStop(0.45, `rgba(${s.rgb},0.14)`);
    lg.addColorStop(1, `rgba(${s.rgb},0)`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.9 + px, y + Math.sin(a) * r * 0.9 + py);
    ctx.lineTo(ex, ey);
    ctx.lineTo(x + Math.cos(a) * r * 0.9 - px, y + Math.sin(a) * r * 0.9 - py);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Surface granulée qui tourne lentement, bord assombri.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(now * 0.00004);
  ctx.drawImage(getSunTexture(s), -r * 1.45, -r * 1.45, r * 2.9, r * 2.9);
  ctx.rotate(-now * 0.00004);
  const limb = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r);
  limb.addColorStop(0, "rgba(255,255,255,0.12)");
  limb.addColorStop(0.7, "rgba(0,0,0,0.05)");
  limb.addColorStop(1, "rgba(40,8,0,0.7)");
  ctx.fillStyle = limb;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();

  // Reflet anamorphique horizontal.
  if (r > 8) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const sg = ctx.createLinearGradient(x - r * 9, y, x + r * 9, y);
    sg.addColorStop(0, `rgba(${s.rgb},0)`);
    sg.addColorStop(0.5, `rgba(${s.rgb},0.28)`);
    sg.addColorStop(1, `rgba(${s.rgb},0)`);
    ctx.fillStyle = sg;
    ctx.fillRect(x - r * 9, y - r * 0.035, r * 18, r * 0.07);
    ctx.restore();

    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,236,200,0.6)";
    if (labels) ctx.fillText(s.label, x, y + r * 1.9 + 14);
  }
}

/* -------------------------------------------------------------------------- */
/*  Ceinture d'astéroïdes                                                     */
/* -------------------------------------------------------------------------- */

const BELT = Array.from({ length: 320 }, () => {
  const c = 150 + Math.floor(Math.random() * 80);
  return {
    a: Math.random() * TAU,
    r: 0.425 + (Math.random() + Math.random() - 1) * 0.03 + 0.03,
    z: (Math.random() - 0.5) * 0.012,
    s: 0.8 + Math.pow(Math.random(), 3) * 2.2,
    col: `rgba(${c},${c - 10},${c - 28},${0.35 + Math.random() * 0.5})`,
  };
});

/* -------------------------------------------------------------------------- */
/*  Caméra et géométrie partagées avec la page                                */
/* -------------------------------------------------------------------------- */

/**
 * Chronologie de la phase « espace » (space : 0 → 1) :
 *  0.00 – 0.04  sortie d'hyperespace
 *  0.02 – 0.38  la caméra tourne vers le système solaire (roulis + panoramique)
 *  0.08 – 0.52  zoom sur le système
 *  0.50 – 0.80  la caméra descend : le système monte, le trou noir surgit du bas
 *  0.64 – 0.98  les planètes, soleils et éléments de la page sont aspirés
 *  0.93 – 1.00  l'écran est avalé
 */
export function getCamera(space: number) {
  const turn = smoothstep(0.015, 0.38, space);
  const zoomIn = smoothstep(0.08, 0.52, space);
  const descend = smoothstep(0.5, 0.8, space);
  return { turn, zoomIn, descend, roll: (1 - turn) * 0.5 };
}

export function getBlackHoleGeometry(w: number, h: number, space: number) {
  const unit = Math.min(w, h);
  const rise = smoothstep(0.5, 0.8, space);
  const grow = smoothstep(0.54, 0.97, space);
  const swallow = smoothstep(0.93, 1, space);
  return {
    x: w * (0.5 + 0.1 * (1 - rise)),
    y: h * (0.5 + 0.95 * (1 - rise)),
    R: unit * (0.02 + 0.2 * Math.pow(grow, 1.6)) + swallow * Math.hypot(w, h) * 0.8,
    swallow,
  };
}

/** Spirale un point vers le trou noir (k : 0 = en place, 1 = avalé). */
function pullPoint(px: number, py: number, hx: number, hy: number, k: number) {
  const dx = px - hx;
  const dy = py - hy;
  const d = Math.hypot(dx, dy) || 1;
  const a = Math.atan2(dy, dx) + k * k * 5.5;
  const nd = d * Math.pow(1 - k, 1.7);
  return { x: hx + Math.cos(a) * nd, y: hy + Math.sin(a) * nd, rad: a + Math.PI };
}

/** Étire l'objet dans la direction du trou noir (spaghettification) et l'estompe. */
function stretchDraw(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rad: number,
  k: number,
  fn: () => void
) {
  ctx.save();
  ctx.globalAlpha = 1 - smoothstep(0.7, 1, k);
  ctx.translate(x, y);
  ctx.rotate(rad);
  ctx.scale(1 + 3.2 * Math.pow(k, 1.5), 1 - 0.55 * k);
  ctx.rotate(-rad);
  ctx.translate(-x, -y);
  fn();
  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/*  Système solaire                                                           */
/* -------------------------------------------------------------------------- */

export function drawSolarSystem(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  space: number
) {
  const unit = Math.min(w, h);
  const cam = getCamera(space);
  const hole = getBlackHoleGeometry(w, h, space);

  const zoom = 0.5 + 1.0 * cam.zoomIn;
  const cx = w * (1.22 - 0.72 * cam.turn); // arrive par la droite, puis se centre
  const cy = h * (0.5 - 0.8 * cam.descend); // la caméra descend : le système monte
  const tilt = 0.2 + 0.16 * cam.turn;
  const U = unit * zoom;

  ctx.save();
  // Roulis : la caméra pivote en se tournant vers le système.
  ctx.translate(w / 2, h / 2);
  ctx.rotate(cam.roll);
  ctx.translate(-w / 2, -h / 2);

  // Orbites elliptiques (excentricité réelle), qui s'effacent quand le puits attire.
  const orbitAlpha = 0.085 * (1 - smoothstep(0.6, 0.85, space));
  if (orbitAlpha > 0.002) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(125,200,255,${orbitAlpha})`;
    for (const p of PLANETS) {
      ctx.beginPath();
      for (let k = 0; k <= 96; k++) {
        const th = (k / 96) * TAU;
        const rad = (p.orbit * (1 - p.e * p.e)) / (1 + p.e * Math.cos(th - p.omega));
        const X = cx + Math.cos(th) * rad * U;
        const Y = cy + Math.sin(th) * rad * U * tilt;
        if (k === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
    }
  }

  const list: { depth: number; draw: () => void }[] = [];

  // Ceinture : moitié arrière puis moitié avant, rotation képlérienne.
  const drawBelt = (front: boolean) => () => {
    for (const b of BELT) {
      const a = b.a + now * 0.00018 * Math.pow(b.r / 0.45, -1.5);
      if ((Math.sin(a) >= 0) !== front) continue;
      let X = cx + Math.cos(a) * b.r * U;
      let Y = cy + Math.sin(a) * b.r * U * tilt + b.z * U;
      const k = smoothstep(0.6 + (b.a / TAU) * 0.2, 0.97, space);
      if (k > 0) {
        if (k > 0.97) continue;
        const q = pullPoint(X, Y, hole.x, hole.y, k);
        X = q.x;
        Y = q.y;
      }
      ctx.fillStyle = b.col;
      ctx.fillRect(X, Y, b.s, b.s);
    }
  };
  list.push({ depth: -3, draw: drawBelt(false) });
  list.push({ depth: 3, draw: drawBelt(true) });

  // Étoiles binaires autour de leur barycentre.
  const phi = now * 0.0004;
  const ox = Math.cos(phi);
  const oy = Math.sin(phi) * tilt;
  const ax = cx + ox * 0.02 * U;
  const ay = cy + oy * 0.02 * U;
  const bx = cx - ox * 0.075 * U;
  const by = cy - oy * 0.075 * U;

  const ks = smoothstep(0.8, 0.985, space);
  const star = (x: number, y: number, r: number, def: StarDef) => () => {
    if (ks <= 0) {
      drawSun(ctx, x, y, r, def, now);
      return;
    }
    const q = pullPoint(x, y, hole.x, hole.y, ks);
    stretchDraw(ctx, q.x, q.y, q.rad, ks, () =>
      drawSun(ctx, q.x, q.y, r * (1 - ks * 0.6), def, now, false)
    );
  };
  list.push({ depth: oy, draw: star(ax, ay, 0.058 * U, SUN_A) });
  list.push({ depth: -oy, draw: star(bx, by, 0.027 * U, SUN_B) });

  PLANETS.forEach((p, i) => {
    const ang = p.phase + now * p.speed;
    const rad = (p.orbit * (1 - p.e * p.e)) / (1 + p.e * Math.cos(ang - p.omega));
    const s = Math.sin(ang);
    const px = cx + Math.cos(ang) * rad * U;
    const py = cy + s * rad * U * tilt;
    const r = Math.max(2, p.size * U * (1 + 0.3 * s));

    // Les planètes extérieures sont happées en premier.
    const k = smoothstep(0.64 + (PLANETS.length - i) * 0.018, 0.985, space);
    if (k <= 0) {
      if (px < -200 || px > w + 200 || py < -200 || py > h + 200) return;
      list.push({ depth: s, draw: () => drawPlanet(ctx, p, px, py, r, ax, ay, now) });
    } else {
      const q = pullPoint(px, py, hole.x, hole.y, k);
      const rr = Math.max(1.5, r * (1 - 0.8 * k));
      list.push({
        depth: s,
        draw: () =>
          stretchDraw(ctx, q.x, q.y, q.rad, k, () =>
            drawPlanet(ctx, p, q.x, q.y, rr, ax, ay, now, false)
          ),
      });
    }
  });

  list.sort((a, b) => a.depth - b.depth);
  for (const item of list) item.draw();

  ctx.restore();
}

/* -------------------------------------------------------------------------- */
/*  Trou noir                                                                 */
/* -------------------------------------------------------------------------- */

const INC = 0.16; // inclinaison du disque (presque de profil)
const DISK_IN = 1.22; // bord interne du disque (en rayons de l'ombre)
const DISK_SPAN = 3.1;

const BH_DISK = Array.from({ length: 2400 }, () => ({
  a: Math.random() * TAU,
  r: DISK_IN + Math.pow(Math.random(), 1.6) * DISK_SPAN,
  s: Math.random(),
  j: Math.random() - 0.5,
}));

const BH_STARS = Array.from({ length: 170 }, () => ({
  a: Math.random() * TAU,
  d: 1.5 + Math.pow(Math.random(), 1.3) * 9,
  s: Math.random(),
}));

/** Filets de matière arrachés au décor, qui spiralent vers le disque. */
const BH_STREAM = Array.from({ length: 240 }, () => ({
  a: Math.random() * TAU,
  u: Math.random(),
  arm: Math.floor(Math.random() * 3),
  s: Math.random(),
}));

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  now: number,
  space: number
) {
  const appear = smoothstep(0.5, 0.58, space);
  if (appear < 0.01) return;

  const geo = getBlackHoleGeometry(w, h, space);
  const bx = geo.x;
  const by = geo.y;
  const R = geo.R;
  const swallow = geo.swallow;
  // Encore trop bas pour être vu (les jets sont inclus dans la marge).
  if (by - R * 14 > h) return;
  const light = appear * (1 - swallow);

  const tilt = -0.22;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const at = (lx: number, ly: number): [number, number] => [
    bx + lx * cosT - ly * sinT,
    by + lx * sinT + ly * cosT,
  ];

  ctx.save();

  // Absorption : le fond s'assombrit autour du trou noir.
  const dark = ctx.createRadialGradient(bx, by, R, bx, by, R * 8);
  dark.addColorStop(0, `rgba(0,0,8,${0.6 * light})`);
  dark.addColorStop(1, "rgba(0,0,8,0)");
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(bx, by, R * 8, 0, TAU);
  ctx.fill();

  ctx.globalCompositeOperation = "lighter";

  // Halo chaud diffus.
  const halo = ctx.createRadialGradient(bx, by, R * 0.9, bx, by, R * 5.5);
  halo.addColorStop(0, `rgba(255,150,60,${0.2 * light})`);
  halo.addColorStop(0.4, `rgba(255,100,30,${0.06 * light})`);
  halo.addColorStop(1, "rgba(255,100,30,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(bx, by, R * 5.5, 0, TAU);
  ctx.fill();

  // Étoiles du fond déformées par la lentille : repoussées et étirées en arcs.
  ctx.lineCap = "round";
  for (const st of BH_STARS) {
    const dApp = 0.5 * (st.d + Math.sqrt(st.d * st.d + 4));
    const rad = dApp * R;
    const half = (R * (0.1 + 0.5 / st.d)) / (2 * rad);
    ctx.strokeStyle = `rgba(${(200 + st.s * 55) | 0},${(215 + st.s * 40) | 0},255,${(0.25 + st.s * 0.45) * light})`;
    ctx.lineWidth = 0.6 + st.s * 1.1;
    ctx.beginPath();
    ctx.arc(bx, by, rad, st.a - half, st.a + half);
    ctx.stroke();
  }

  // Ondes gravitationnelles : anneaux faibles qui s'éloignent du trou noir.
  for (let k = 0; k < 3; k++) {
    const ph = (now * 0.00028 + k / 3) % 1;
    ctx.strokeStyle = `rgba(255,205,160,${Math.pow(1 - ph, 2) * 0.2 * light})`;
    ctx.lineWidth = Math.max(1, R * 0.025 * (1 - ph));
    ctx.beginPath();
    ctx.ellipse(bx, by, R * (1.7 + ph * 6), R * (1.7 + ph * 6) * 0.92, tilt, 0, TAU);
    ctx.stroke();
  }

  // Jets relativistes le long de l'axe de rotation.
  const jet = (dir: 1 | -1, strength: number) => {
    const L = R * (4.8 + 1.2 * Math.sin(now * 0.0017 + dir));
    const base = at(0, dir * R * 0.9);
    const tip = at(0, dir * L);
    const w0 = R * 0.07;
    const w1 = R * 0.34;

    const body = ctx.createLinearGradient(base[0], base[1], tip[0], tip[1]);
    body.addColorStop(0, `rgba(200,222,255,${0.5 * strength * light})`);
    body.addColorStop(0.4, `rgba(110,160,255,${0.16 * strength * light})`);
    body.addColorStop(1, "rgba(80,120,255,0)");
    ctx.fillStyle = body;
    ctx.beginPath();
    const pts = [at(-w0, dir * R * 0.9), at(w0, dir * R * 0.9), at(w1, dir * L), at(-w1, dir * L)];
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();

    const core = ctx.createLinearGradient(base[0], base[1], tip[0], tip[1]);
    core.addColorStop(0, `rgba(235,245,255,${0.7 * strength * light})`);
    core.addColorStop(1, "rgba(160,200,255,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    const cp = [at(-w0 * 0.3, dir * R * 0.9), at(w0 * 0.3, dir * R * 0.9), at(w1 * 0.1, dir * L), at(-w1 * 0.1, dir * L)];
    ctx.moveTo(cp[0][0], cp[0][1]);
    for (let i = 1; i < cp.length; i++) ctx.lineTo(cp[i][0], cp[i][1]);
    ctx.closePath();
    ctx.fill();

    // Nœuds de plasma qui filent vers l'extérieur.
    for (let k = 0; k < 5; k++) {
      const u = (now * 0.00035 + k / 5) % 1;
      const c = at(0, dir * (R * 0.9 + (L - R * 0.9) * u));
      const rad = R * (0.07 + 0.16 * u);
      const rg = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], rad);
      rg.addColorStop(0, `rgba(220,235,255,${(1 - u) * 0.5 * strength * light})`);
      rg.addColorStop(1, "rgba(120,170,255,0)");
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(c[0], c[1], rad, 0, TAU);
      ctx.fill();
    }
  };
  jet(-1, 1);
  jet(1, 0.6);

  // Filets de matière qui spiralent vers le disque.
  const drawStreams = (front: boolean) => {
    ctx.lineCap = "round";
    for (const s of BH_STREAM) {
      const u = (s.u + now * 0.00016 * (0.6 + s.s * 0.8)) % 1;
      const place = (uu: number) => {
        const f = Math.pow(1 - uu, 1.5);
        const rr = R * (DISK_IN + 0.25 + f * 6.5);
        const ang = s.a + Math.pow(1 - uu, 0.6) * 5 + s.arm * (TAU / 3);
        return { sn: Math.sin(ang), pt: at(Math.cos(ang) * rr, Math.sin(ang) * rr * (0.2 + 0.25 * f)) };
      };
      const c = place(u);
      if (c.sn >= 0 !== front) continue;
      const a = Math.pow(Math.sin(u * Math.PI), 0.8) * 0.55 * light;
      if (a < 0.02) continue;
      const p0 = place(Math.max(0, u - 0.012));
      ctx.strokeStyle = `hsla(${22 + u * 30},100%,${60 + u * 30}%,${a})`;
      ctx.lineWidth = 0.7 + s.s * 1.1 + R * 0.004;
      ctx.beginPath();
      ctx.moveTo(p0.pt[0], p0.pt[1]);
      ctx.lineTo(c.pt[0], c.pt[1]);
      ctx.stroke();
    }
  };

  // Nappe lumineuse du disque (moitié arrière, ou avant si `front`).
  const sheet = (front: boolean) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(tilt);
    if (front) {
      ctx.beginPath();
      ctx.rect(-R * 6, 0, R * 12, R * 2);
      ctx.clip();
    }
    ctx.scale(1, INC * 1.6);
    const g = ctx.createRadialGradient(0, 0, R * (DISK_IN - 0.07), 0, 0, R * 4.4);
    g.addColorStop(0, "rgba(255,235,190,0)");
    g.addColorStop(0.04, `rgba(255,232,180,${0.55 * light})`);
    g.addColorStop(0.2, `rgba(255,160,70,${0.3 * light})`);
    g.addColorStop(0.6, `rgba(210,80,30,${0.1 * light})`);
    g.addColorStop(1, "rgba(160,50,20,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R * 4.4, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  // Particule du disque : couleur par température + effet Doppler.
  const plot = (X: number, Y: number, size: number, t: number, beam: number, alpha: number) => {
    const boost = Math.pow(beam, 2.2);
    const a = clamp(alpha * Math.min(1.5, boost) * light, 0, 1);
    if (a < 0.01) return;
    const hue = 50 - t * 40 + (beam - 1) * 8;
    const sat = 100 - Math.max(0, beam - 1) * 45;
    const lit = 86 - t * 42 + (beam - 1) * 14;
    ctx.fillStyle = `hsla(${hue},${sat}%,${clamp(lit, 20, 96)}%,${a})`;
    ctx.fillRect(X, Y, size * 1.8, size);
  };

  type Img = {
    cs: number;
    sn: number;
    t: number;
    beam: number;
    spiral: number;
    p: (typeof BH_DISK)[number];
  };
  const eachParticle = (fn: (i: Img) => void) => {
    for (const p of BH_DISK) {
      const ang = p.a + now * 0.0011 * Math.pow(p.r, -1.5) * 2.4;
      const t = (p.r - DISK_IN) / DISK_SPAN;
      const cs = Math.cos(ang);
      // Le côté qui s'approche (à gauche) est plus brillant et plus blanc.
      const beam = clamp(1 - (0.65 * cs) / Math.sqrt(p.r * 0.7), 0.35, 1.9);
      // Bras spiraux de densité, cisaillés par la rotation différentielle.
      const spiral = 0.7 + 0.3 * Math.sin(3 * ang + 5 * Math.log(p.r) - now * 0.0006);
      fn({ cs, sn: Math.sin(ang), t, beam, spiral, p });
    }
  };

  drawStreams(false);
  sheet(false);

  // Images déformées : l'arrière du disque se courbe au-dessus de l'ombre,
  // l'avant se reflète faiblement en dessous.
  eachParticle(({ cs, sn, t, beam, spiral, p }) => {
    const size = 0.7 + p.s * 1.4 + R * 0.007;
    if (sn < 0) {
      const rr = R * (1.07 + 0.17 * (p.r - DISK_IN));
      const [X, Y] = at(cs * rr, sn * rr * (0.96 + 0.08 * p.j));
      plot(X, Y, size, t, beam, 0.8 * spiral);
    } else if (p.r < 2.6) {
      const rr = R * (1.03 + 0.07 * (p.r - DISK_IN));
      const [X, Y] = at(cs * rr, sn * rr);
      plot(X, Y, size, t, beam, 0.35 * spiral);
    }
  });

  // Image directe, moitié arrière (passe derrière l'horizon).
  eachParticle(({ cs, sn, t, beam, spiral, p }) => {
    if (sn >= 0) return;
    const rr = p.r * R;
    const [X, Y] = at(cs * rr, sn * rr * INC);
    plot(X, Y, 0.7 + p.s * 1.4 + R * 0.007, t, beam, 0.85 * spiral);
  });

  // Horizon des événements.
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = appear;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(bx, by, R, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.globalCompositeOperation = "lighter";

  // Lueur de la lumière piégée juste à l'extérieur de l'horizon.
  const rim = ctx.createRadialGradient(bx, by, R, bx, by, R * 1.4);
  rim.addColorStop(0, `rgba(255,210,150,${0.4 * light})`);
  rim.addColorStop(1, "rgba(255,150,70,0)");
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(bx, by, R * 1.4, 0, TAU);
  ctx.arc(bx, by, R, 0, TAU, true);
  ctx.fill();

  // Anneau de photons : fin et très lumineux, doublé d'un second anneau plus faible.
  ctx.strokeStyle = `rgba(255,236,205,${0.9 * light})`;
  ctx.lineWidth = Math.max(1, R * 0.03);
  ctx.beginPath();
  ctx.arc(bx, by, R * 1.025, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,190,120,${0.3 * light})`;
  ctx.lineWidth = Math.max(1.5, R * 0.09);
  ctx.stroke();
  ctx.strokeStyle = `rgba(255,220,180,${0.22 * light})`;
  ctx.lineWidth = Math.max(1, R * 0.012);
  ctx.beginPath();
  ctx.arc(bx, by, R * 1.2, 0, TAU);
  ctx.stroke();

  // Image directe, moitié avant : le disque passe devant l'ombre.
  eachParticle(({ cs, sn, t, beam, spiral, p }) => {
    if (sn < 0) return;
    const rr = p.r * R;
    const [X, Y] = at(cs * rr, sn * rr * INC);
    plot(X, Y, 0.8 + p.s * 1.6 + R * 0.008, t, beam, 0.95 * spiral);
  });
  sheet(true);
  drawStreams(true);

  // Reflet anamorphique horizontal, façon objectif de cinéma.
  const streak = ctx.createLinearGradient(bx - R * 7, by, bx + R * 7, by);
  streak.addColorStop(0, "rgba(255,210,160,0)");
  streak.addColorStop(0.5, `rgba(255,214,170,${0.18 * light})`);
  streak.addColorStop(1, "rgba(255,210,160,0)");
  ctx.fillStyle = streak;
  ctx.fillRect(bx - R * 7, by - R * 0.02, R * 14, R * 0.04);

  ctx.restore();

  if (swallow > 0) {
    ctx.fillStyle = `rgba(0,0,0,${swallow})`;
    ctx.fillRect(0, 0, w, h);
  }
}