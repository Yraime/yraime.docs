
/**
 * SpaceSFX — moteur sonore spatial cinématographique
 * Web Audio API uniquement : aucun fichier audio externe.
 *
 * Effets :
 * - Souffle d'hyperespace évolutif
 * - Nappe grave avec battements de fréquences
 * - Grondement du trou noir
 * - Aspiration gravitationnelle multicouche
 * - Déchirure spatiale et turbulence
 * - Impact final avec résonance métallique
 * - Whoosh stéréo, bips d'interface
 *
 * Utilisation :
 *   sfx.setEnabled(true); // depuis un clic utilisateur
 *   sfx.update(progress, space, speed); // chaque frame
 *   sfx.whoosh(-1); // gauche
 *   sfx.boom(); // impact final
 *   sfx.setVolume(0.7);
 *   sfx.suspend();
 */

function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

const clamp = (v: number, a: number, b: number) =>
  Math.min(b, Math.max(a, v));

class SpaceSFX {
  private ac: AudioContext | null = null;
  private enabled = false;
  private volume = 0.7;

  private master!: GainNode;
  private ambience!: GainNode;
  private noiseBuf!: AudioBuffer;

  // Hyperespace
  private warpGain!: GainNode;
  private warpFilter!: BiquadFilterNode;

  // Nappe musicale
  private droneGain!: GainNode;
  private droneFilter!: BiquadFilterNode;
  private droneOscs: OscillatorNode[] = [];

  // Trou noir
  private rumbleGain!: GainNode;
  private rumbleOsc!: OscillatorNode;
  private rumbleLfo!: OscillatorNode;
  private rumbleLfoGain!: GainNode;

  // Contrôle des événements
  private fired = {
    jump: false,
    suck: false,
    boom: false,
  };

  private lastWhoosh = 0;
  private lastHover = 0;

  /* ---------------------------------------------------------------------- */
  /* Cycle de vie                                                            */
  /* ---------------------------------------------------------------------- */

  setEnabled(on: boolean) {
    this.enabled = on;

    if (on && !this.ac) {
      this.init();
    }

    if (!this.ac) return;

    const ac = this.ac;
    const t = ac.currentTime;

    if (on) {
      void ac.resume();

      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(this.volume, t, 0.12);

      this.click();
    } else {
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(0, t, 0.08);
    }
  }

  setVolume(value: number) {
    this.volume = clamp(value, 0, 1);

    if (!this.ac) return;

    const t = this.ac.currentTime;
    this.master.gain.setTargetAtTime(
      this.enabled ? this.volume : 0,
      t,
      0.08
    );
  }

  suspend() {
    this.enabled = false;
    void this.ac?.suspend();
  }

  private init() {
    const AC =
      window.AudioContext ??
      (
        window as unknown as {
          webkitAudioContext: typeof AudioContext;
        }
      ).webkitAudioContext;

    const ac = new AC();
    this.ac = ac;

    // Bruit aléatoire réutilisable.
    this.noiseBuf = ac.createBuffer(
      1,
      ac.sampleRate * 3,
      ac.sampleRate
    );

    const data = this.noiseBuf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    // Bus principal + compresseur de sécurité.
    this.master = ac.createGain();
    this.master.gain.value = 0;

    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 5;
    comp.attack.value = 0.008;
    comp.release.value = 0.25;

    this.master.connect(comp);
    comp.connect(ac.destination);

    // Bus d'ambiance indépendant.
    this.ambience = ac.createGain();
    this.ambience.gain.value = 1;
    this.ambience.connect(this.master);

    /* -------------------------- Hyperespace -------------------------- */

    const warp = ac.createBufferSource();
    warp.buffer = this.noiseBuf;
    warp.loop = true;

    this.warpFilter = ac.createBiquadFilter();
    this.warpFilter.type = "bandpass";
    this.warpFilter.Q.value = 0.65;
    this.warpFilter.frequency.value = 500;

    this.warpGain = ac.createGain();
    this.warpGain.gain.value = 0;

    warp
      .connect(this.warpFilter)
      .connect(this.warpGain)
      .connect(this.ambience);

    warp.start();

    /* -------------------------- Nappe grave -------------------------- */

    this.droneFilter = ac.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 250;
    this.droneFilter.Q.value = 1.2;

    this.droneGain = ac.createGain();
    this.droneGain.gain.value = 0;

    this.droneFilter
      .connect(this.droneGain)
      .connect(this.ambience);

    const droneFrequencies: [OscillatorType, number][] = [
      ["sawtooth", 55],
      ["sawtooth", 55.45],
      ["sine", 110],
      ["sine", 27.5],
    ];

    for (const [type, freq] of droneFrequencies) {
      const osc = ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(this.droneFilter);
      osc.start();

      this.droneOscs.push(osc);
    }

    /* ------------------------- Trou noir ---------------------------- */

    this.rumbleOsc = ac.createOscillator();
    this.rumbleOsc.type = "sine";
    this.rumbleOsc.frequency.value = 42;

    this.rumbleGain = ac.createGain();
    this.rumbleGain.gain.value = 0;

    this.rumbleLfo = ac.createOscillator();
    this.rumbleLfo.type = "sine";
    this.rumbleLfo.frequency.value = 0.32;

    this.rumbleLfoGain = ac.createGain();
    this.rumbleLfoGain.gain.value = 0.06;

    this.rumbleLfo
      .connect(this.rumbleLfoGain)
      .connect(this.rumbleGain.gain);

    this.rumbleOsc
      .connect(this.rumbleGain)
      .connect(this.ambience);

    this.rumbleOsc.start();
    this.rumbleLfo.start();
  }

  /* ---------------------------------------------------------------------- */
  /* Contrôle continu                                                       */
  /* ---------------------------------------------------------------------- */

  /**
   * progress : progression du tunnel (0 → 1)
   * space    : progression vers le trou noir (0 → 1)
   * speed    : vitesse normalisée (0 → 1)
   */
  update(progress: number, space: number, speed: number) {
    const ac = this.ac;

    if (!ac || !this.enabled) return;

    progress = clamp(progress, 0, 1);
    space = clamp(space, 0, 1);
    speed = clamp(speed, 0, 1);

    const t = ac.currentTime;

    const stars = smoothstep(0.07, 0.16, progress);
    const blackHole = smoothstep(0.08, 0.82, space);
    const finalFade = 1 - smoothstep(0.985, 1, space);
    const hyper = smoothstep(0.12, 0.3, progress);

    // Souffle : gagne en intensité avec la vitesse.
    this.warpGain.gain.setTargetAtTime(
      stars * finalFade * (0.025 + speed * 0.18),
      t,
      0.12
    );

    this.warpFilter.frequency.setTargetAtTime(
      300 + speed * 4200,
      t,
      0.12
    );

    // Nappe grave : elle s'assombrit progressivement.
    this.droneGain.gain.setTargetAtTime(
      stars * 0.065 * finalFade,
      t,
      0.35
    );

    this.droneFilter.frequency.setTargetAtTime(
      260 + hyper * 450 - blackHole * 170,
      t,
      0.3
    );

    this.droneOscs[0].frequency.setTargetAtTime(
      55 - blackHole * 24,
      t,
      0.5
    );

    this.droneOscs[1].frequency.setTargetAtTime(
      55.45 - blackHole * 23.7,
      t,
      0.5
    );

    this.droneOscs[2].frequency.setTargetAtTime(
      110 - blackHole * 45,
      t,
      0.5
    );

    this.droneOscs[3].frequency.setTargetAtTime(
      27.5 - blackHole * 9,
      t,
      0.5
    );

    // Pulsation du cœur : plus rapide à l'approche.
    this.rumbleLfo.frequency.setTargetAtTime(
      0.3 + blackHole * 1.4,
      t,
      0.5
    );

    this.rumbleLfoGain.gain.setTargetAtTime(
      0.025 + blackHole * 0.045,
      t,
      0.5
    );

    // Grondement principal.
    this.rumbleGain.gain.setTargetAtTime(
      blackHole * 0.3 * finalFade,
      t,
      0.4
    );

    this.rumbleOsc.frequency.setTargetAtTime(
      42 - blackHole * 21,
      t,
      0.5
    );

    // Déclencheurs réarmés en remontant.
    if (progress < 0.05) {
      this.fired.jump = false;
    }

    if (space < 0.5) {
      this.fired.suck = false;
      this.fired.boom = false;
    }

    // Entrée en hyperespace.
    if (!this.fired.jump && progress > 0.085) {
      this.fired.jump = true;
      this.jump();
    }

    // Approche du trou noir.
    if (!this.fired.suck && space > 0.72) {
      this.fired.suck = true;
      this.suction();
    }

    // Impact final : un seul déclenchement au passage du seuil.
    if (!this.fired.boom && space >= 0.99) {
      this.fired.boom = true;
      this.boom();
    }
  }

  /* ---------------------------------------------------------------------- */
  /* Whoosh spatial                                                          */
  /* ---------------------------------------------------------------------- */

  whoosh(x = 0) {
    const ac = this.ac;

    if (!ac || !this.enabled) return;

    const t = ac.currentTime;

    if (t - this.lastWhoosh < 0.15) return;

    this.lastWhoosh = t;

    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.exponentialRampToValueAtTime(
      4500,
      t + 0.35
    );
    filter.frequency.exponentialRampToValueAtTime(
      700,
      t + 0.8
    );

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.16, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

    const pan = ac.createStereoPanner();
    pan.pan.setValueAtTime(clamp(x, -1, 1), t);
    pan.pan.linearRampToValueAtTime(
      clamp(x * -0.3, -1, 1),
      t + 0.75
    );

    src
      .connect(filter)
      .connect(gain)
      .connect(pan)
      .connect(this.master);

    src.start(t);
    src.stop(t + 0.9);
  }

  /* ---------------------------------------------------------------------- */
  /* Hyperespace                                                             */
  /* ---------------------------------------------------------------------- */

  private jump() {
    const ac = this.ac!;
    const t = ac.currentTime;

    // Balayage tonal.
    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.exponentialRampToValueAtTime(
      1100,
      t + 0.9
    );

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(220, t);
    filter.frequency.exponentialRampToValueAtTime(
      5000,
      t + 0.95
    );

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);

    osc.connect(filter).connect(gain).connect(this.master);

    osc.start(t);
    osc.stop(t + 1.5);

    // Souffle de transition.
    this.noiseBurst(t, 1.2, 180, 7500, 0.16);

    // Petit impact grave.
    this.noiseBurst(t + 0.72, 0.55, 1800, 100, 0.09);
  }

  /* ---------------------------------------------------------------------- */
  /* Aspiration gravitationnelle                                             */
  /* ---------------------------------------------------------------------- */

  private suction() {
    const ac = this.ac!;
    const t = ac.currentTime;

    // 1. Cœur du trou noir.
    const sub = ac.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(38, t);
    sub.frequency.exponentialRampToValueAtTime(19, t + 3.8);

    const subGain = ac.createGain();
    subGain.gain.setValueAtTime(0.0001, t);
    subGain.gain.exponentialRampToValueAtTime(0.24, t + 2.5);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);

    sub.connect(subGain).connect(this.master);
    sub.start(t);
    sub.stop(t + 4.6);

    // 2. Déchirure spatiale.
    const tear = ac.createOscillator();
    tear.type = "sawtooth";
    tear.frequency.setValueAtTime(42, t);
    tear.frequency.exponentialRampToValueAtTime(260, t + 3.2);
    tear.frequency.exponentialRampToValueAtTime(75, t + 4.1);

    const tearFilter = ac.createBiquadFilter();
    tearFilter.type = "lowpass";
    tearFilter.frequency.setValueAtTime(100, t);
    tearFilter.frequency.exponentialRampToValueAtTime(
      1800,
      t + 3.2
    );
    tearFilter.frequency.exponentialRampToValueAtTime(
      180,
      t + 4.1
    );

    const tearGain = ac.createGain();
    tearGain.gain.setValueAtTime(0.0001, t);
    tearGain.gain.exponentialRampToValueAtTime(
      0.065,
      t + 2.7
    );
    tearGain.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 4.2
    );

    const pan = ac.createStereoPanner();
    pan.pan.setValueAtTime(-0.65, t);
    pan.pan.linearRampToValueAtTime(0.65, t + 2.1);
    pan.pan.linearRampToValueAtTime(0, t + 4);

    tear
      .connect(tearFilter)
      .connect(tearGain)
      .connect(pan)
      .connect(this.master);

    tear.start(t);
    tear.stop(t + 4.3);

    // 3. Turbulence granuleuse.
    const noise = ac.createBufferSource();
    noise.buffer = this.noiseBuf;

    const band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 3;
    band.frequency.setValueAtTime(180, t);
    band.frequency.exponentialRampToValueAtTime(
      1400,
      t + 2.7
    );
    band.frequency.exponentialRampToValueAtTime(
      220,
      t + 4
    );

    const noiseGain = ac.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(
      0.085,
      t + 2.8
    );
    noiseGain.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 4.2
    );

    noise.connect(band).connect(noiseGain).connect(this.master);
    noise.start(t);
    noise.stop(t + 4.3);

    // 4. Souffle final.
    this.noiseBurst(t + 2.4, 1.8, 5000, 100, 0.1);
  }

  /* ---------------------------------------------------------------------- */
  /* Effondrement final                                                      */
  /* ---------------------------------------------------------------------- */

  boom() {
    const ac = this.ac;

    if (!ac || !this.enabled) return;

    const t = ac.currentTime;

    // Onde de choc grave.
    const impact = ac.createOscillator();
    impact.type = "sine";
    impact.frequency.setValueAtTime(105, t);
    impact.frequency.exponentialRampToValueAtTime(24, t + 1.5);

    const impactGain = ac.createGain();
    impactGain.gain.setValueAtTime(0.0001, t);
    impactGain.gain.exponentialRampToValueAtTime(0.48, t + 0.035);
    impactGain.gain.exponentialRampToValueAtTime(
      0.0001,
      t + 2.4
    );

    impact.connect(impactGain).connect(this.master);
    impact.start(t);
    impact.stop(t + 2.5);

    // Onde de matière.
    this.noiseBurst(t, 2.2, 7000, 45, 0.25);

    // Résonances métalliques.
    const resonances: [number, number, number][] = [
      [173, 0.075, 2.8],
      [261, 0.045, 2.1],
      [389, 0.02, 1.6],
    ];

    for (const [freq, vol, duration] of resonances) {
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t + 0.025);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 0.72,
        t + duration
      );

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.setValueAtTime(vol, t + 0.035);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        t + duration
      );

      osc.connect(gain).connect(this.master);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }

    // Second choc décalé.
    this.noiseBurst(t + 0.12, 0.8, 2400, 90, 0.15);

    // Le silence est obtenu par l'animation ou par setEnabled(false).
    // Le master reste actif pour permettre au jeu de continuer.
  }

  /* ---------------------------------------------------------------------- */
  /* Interface                                                               */
  /* ---------------------------------------------------------------------- */

  hover() {
    const ac = this.ac;

    if (!ac || !this.enabled) return;

    if (ac.currentTime - this.lastHover < 0.07) return;

    this.lastHover = ac.currentTime;
    this.blip(1150, 0.045, "sine", 0.035);
  }

  click() {
    if (!this.ac || !this.enabled) return;

    this.blip(620, 0.07, "sine", 0.045);
    this.blip(930, 0.09, "sine", 0.03, 0.055);
  }

  /* ---------------------------------------------------------------------- */
  /* Outils audio                                                            */
  /* ---------------------------------------------------------------------- */

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0
  ) {
    const ac = this.ac;

    if (!ac) return;

    const t = ac.currentTime + delay;

    const osc = ac.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      t + dur
    );

    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /**
   * Bruit filtré dont la fréquence glisse de f0 vers f1.
   * f0 et f1 doivent être strictement positifs.
   */
  private noiseBurst(
    t: number,
    dur: number,
    f0: number,
    f1: number,
    vol: number
  ) {
    const ac = this.ac;

    if (!ac || dur <= 0) return;

    const src = ac.createBufferSource();
    src.buffer = this.noiseBuf;

    const filter = ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(
      Math.max(20, f0),
      t
    );
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(20, f1),
      t + dur
    );

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, vol),
      t + dur * 0.22
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      t + dur
    );

    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }
}

/** Instance unique du moteur audio. */
export const sfx = new SpaceSFX();
