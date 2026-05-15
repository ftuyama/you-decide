import {
  ACT3_DEPTH_MELODY,
  ACT5_ICE_MELODY,
  ASH_SKY_MELODY,
  DIALOGUE_COMBAT_MELODY,
  ANCIENT_MACABRE_MELODY,
  BOSS_LEAD_MELODY,
  CAMP_MELODY,
  EXPLORE_PIANO_MELODY,
  FROST_MYSTERY_MELODY,
  MERCHANT_LUTE_MELODY,
  VOID_DRONE_MELODY,
} from '../melodies.ts';
import { triggerArp, triggerHat, triggerKick, triggerPluck, triggerSnare } from '../primitives.ts';
import type { GameAudioHost } from './gameAudioHost.ts';
import type { AmbientTheme } from '../types.ts';

/** Música ambiente procedural (pads, drones, ritmos). */
export class GameAmbientPlayer {
  private bgCleanup: (() => void) | null = null;
  private bgPulseTimer: ReturnType<typeof setInterval> | null = null;
  private bgRhythmTimer: ReturnType<typeof setInterval> | null = null;
  private currentTheme: AmbientTheme | null = null;

  private readonly host: GameAudioHost;

  constructor(host: GameAudioHost) {
    this.host = host;
  }

  startWhenReady(): void {
    const ctx = this.host.ensureContext();
    const run = (): void => {
      if (!this.currentTheme) {
        this.setTheme('explore');
      }
    };
    if (ctx.state === 'running') {
      run();
    } else {
      void ctx.resume().then(run);
    }
  }

  /** Troca a música de fundo (idempotente se já for o mesmo tema). */
  setTheme(theme: AmbientTheme): void {
    if (this.currentTheme === theme && this.bgCleanup) return;
    this.stopInternal();
    this.currentTheme = theme;
    switch (theme) {
      case 'explore':
        this.playAmbientExplore();
        break;
      case 'act2':
        this.playAmbientAct2();
        break;
      case 'combat':
        this.playAmbientCombat();
        break;
      case 'combat_rival':
        this.playAmbientCombatRival();
        break;
      case 'dialogue_combat':
        this.playAmbientDialogueCombat();
        break;
      case 'camp':
        this.playAmbientCamp();
        break;
      case 'boss':
        this.playAmbientBoss();
        break;
      case 'act3':
        this.playAmbientAct3Depths();
        break;
      case 'act5':
        this.playAmbientAct5Ice();
        break;
      case 'frost_mystery':
        this.playAmbientFrostMystery();
        break;
      case 'merchant':
        this.playAmbientMerchant();
        break;
      case 'void':
        this.playAmbientVoid();
        break;
      case 'ancient_macabre':
        this.playAmbientAncientMacabre();
        break;
      case 'ash_sky':
        this.playAmbientAshSky();
        break;
    }
  }

  getTheme(): AmbientTheme | null {
    return this.currentTheme;
  }

  private stopInternal(): void {
    if (this.bgPulseTimer) {
      clearInterval(this.bgPulseTimer);
      this.bgPulseTimer = null;
    }
    if (this.bgRhythmTimer) {
      clearInterval(this.bgRhythmTimer);
      this.bgRhythmTimer = null;
    }
    if (this.bgCleanup) {
      this.bgCleanup();
      this.bgCleanup = null;
    }
    this.currentTheme = null;
  }

  stop(): void {
    this.stopInternal();
  }

  private playAmbientAct3Depths(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();

    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.237);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.22;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 51.91, level: 0.473, type: 'sine' }, // G#1
      { freq: 103.83, level: 0.4, type: 'sine' },
      { freq: 123.47, level: 0.328, type: 'triangle' }, // B2
      { freq: 155.56, level: 0.291, type: 'sine' }, // D#3
      { freq: 164.81, level: 0.182, type: 'triangle' }, // 2ª com D# — zumbido tenso
      { freq: 207.65, level: 0.127, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 14;
      g.gain.value = level;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.042;
      const breathe = 0.273 + Math.sin(t) * 0.141 + Math.sin(t * 0.41) * 0.113;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.42);
      } catch {
        /* noop */
      }
    }, 300);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = ACT3_DEPTH_MELODY[melodyStep % ACT3_DEPTH_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.182), 'triangle', 1.65);
      triggerPluck(ctx, master, when + 0.04, note * 0.5, this.host.gain(0.101), 'sine', 2.0);
    }, 1180);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Exploração: pad em lá menor com pulsação lenta + piano discreto.
   */
  private playAmbientExplore(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();

    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.24);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 55, level: 0.22, type: 'sine' },
      { freq: 110, level: 0.2, type: 'sine' },
      { freq: 130.81, level: 0.16, type: 'triangle' },
      { freq: 164.81, level: 0.14, type: 'sine' },
      { freq: 220, level: 0.06, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 10;
      g.gain.value = level * 0.45;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.035;
      const breathe = 0.11 + Math.sin(t) * 0.032 + Math.sin(t * 0.37) * 0.014;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.55);
      } catch {
        /* noop */
      }
    }, 380);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = EXPLORE_PIANO_MELODY[melodyStep % EXPLORE_PIANO_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.118), 'triangle', 1.8);
    }, 1500);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Ato 2: mesma base da exploração, com pulsação e motivo um pouco mais densos.
   */
  private playAmbientAct2(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();

    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.23);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -27;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = 0.003;
    comp.release.value = 0.24;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 55, level: 0.22, type: 'sine' },
      { freq: 110, level: 0.2, type: 'sine' },
      { freq: 123.47, level: 0.16, type: 'triangle' },
      { freq: 164.81, level: 0.14, type: 'sine' },
      { freq: 196, level: 0.08, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 10;
      g.gain.value = level * 0.46;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.04;
      const breathe = 0.12 + Math.sin(t) * 0.036 + Math.sin(t * 0.43) * 0.016;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.52);
      } catch {
        /* noop */
      }
    }, 360);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = EXPLORE_PIANO_MELODY[melodyStep % EXPLORE_PIANO_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.13), 'triangle', 1.7);
      triggerPluck(ctx, master, when + 0.1, note * 0.5, this.host.gain(0.07), 'sine', 1.9);
    }, 1420);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Combate: ~120 BPM, kick + snare + hi-hat + baixo pulsante.
   */
  private playAmbientCombat(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.22);
    master.connect(ctx.destination);

    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.value = 82.41;
    bassGain.gain.value = 0;
    bass.connect(bassGain);
    bassGain.connect(master);
    bass.start();

    let step = 0;
    const eighth = 125;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const tNow = ctx.currentTime;
      const s = step % 8;
      if (s === 0 || s === 4) {
        triggerKick(ctx, master, tNow, this.host.gain(0.14));
        bassGain.gain.setTargetAtTime(this.host.gain(0.18), tNow, 0.02);
        bassGain.gain.setTargetAtTime(0, tNow + 0.12, 0.05);
      } else if (s === 2 || s === 6) {
        triggerSnare(ctx, master, tNow, this.host.gain(0.11));
      }
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow, this.host.gain(s === 0 || s === 4 ? 0.04 : 0.025));
      }
      if (s === 0) {
        triggerArp(ctx, master, tNow, this.host.gain(0.045));
      }
      step++;
    }, eighth);

    this.bgCleanup = () => {
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      try {
        bass.stop();
        master.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Combate contra rival (Kael): andamento grave e marcial, menos arcade e mais tensão de duelo.
   */
  private playAmbientCombatRival(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.22);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 14;
    comp.ratio.value = 3.8;
    comp.attack.value = 0.01;
    comp.release.value = 0.22;
    comp.connect(master);
    master.connect(ctx.destination);

    const lowDrone = ctx.createOscillator();
    const lowDroneGain = ctx.createGain();
    lowDrone.type = 'triangle';
    lowDrone.frequency.value = 55;
    lowDroneGain.gain.value = this.host.gain(0.072);
    lowDrone.connect(lowDroneGain);
    lowDroneGain.connect(comp);
    lowDrone.start();

    const highDrone = ctx.createOscillator();
    const highDroneGain = ctx.createGain();
    highDrone.type = 'sine';
    highDrone.frequency.value = 110;
    highDroneGain.gain.value = this.host.gain(0.032);
    highDrone.connect(highDroneGain);
    highDroneGain.connect(comp);
    highDrone.start();

    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.value = 82.41;
    bassGain.gain.value = 0;
    bass.connect(bassGain);
    bassGain.connect(comp);
    bass.start();

    const stabs = [146.83, 155.56, 174.61, 164.81];
    let stabIx = 0;
    let step = 0;
    const eighth = 152;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const tNow = ctx.currentTime;
      const s = step % 16;

      if (s === 0 || s === 8 || s === 12) {
        triggerKick(ctx, comp, tNow, this.host.gain(s === 0 ? 0.14 : 0.1));
        bassGain.gain.setTargetAtTime(this.host.gain(s === 0 ? 0.13 : 0.1), tNow, 0.018);
        bassGain.gain.setTargetAtTime(0, tNow + 0.16, 0.06);
      }
      if (s === 4 || s === 14) {
        triggerSnare(ctx, comp, tNow, this.host.gain(0.11));
      }
      if (s % 2 === 0) {
        triggerHat(ctx, comp, tNow, this.host.gain(s % 8 === 0 ? 0.02 : 0.014));
      }
      if (s === 6 || s === 10) {
        triggerPluck(
          ctx,
          comp,
          tNow + 0.03,
          stabs[stabIx % stabs.length]!,
          this.host.gain(0.068),
          'triangle',
          0.34,
        );
        stabIx++;
      }
      if (s === 0 || s === 8) {
        triggerPluck(
          ctx,
          comp,
          tNow + 0.02,
          73.42,
          this.host.gain(0.056),
          'sawtooth',
          0.18,
        );
      }
      if (s === 15) {
        triggerArp(ctx, comp, tNow + 0.015, this.host.gain(0.016));
      }
      step++;
    }, eighth);

    this.bgCleanup = () => {
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      try {
        lowDrone.stop();
        highDrone.stop();
        bass.stop();
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Combate verbal: drones espelhados + motivo lento (2ªs menores), sem kit de bateria —
   * contraste com o combate físico (kick/snare).
   */
  private playAmbientDialogueCombat(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.2);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -30;
    comp.knee.value = 16;
    comp.ratio.value = 2.8;
    comp.attack.value = 0.008;
    comp.release.value = 0.35;
    master.connect(comp);
    comp.connect(ctx.destination);

    const root = 123.47; // B2
    const beat = ctx.createOscillator();
    const beatGain = ctx.createGain();
    beat.type = 'sine';
    beat.frequency.value = root * 0.5;
    beatGain.gain.value = 0;
    beat.connect(beatGain);
    beatGain.connect(comp);
    beat.start();

    const layers: { freq: number; level: number; type: OscillatorType; detune: number }[] = [
      { freq: root, level: 0.11, type: 'sine', detune: -5 },
      { freq: root * 1.011, level: 0.1, type: 'sine', detune: 6 },
      { freq: 174.61, level: 0.055, type: 'triangle', detune: 0 },
      { freq: 233.08, level: 0.04, type: 'sine', detune: -3 },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type, detune } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = detune;
      g.gain.value = level * 0.38;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.028;
      const breathe = 0.16 + Math.sin(t * 0.35) * 0.05 + Math.sin(t * 0.11) * 0.035;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.62);
      } catch {
        /* noop */
      }
    }, 440);

    let melodyStep = 0;
    let pulseStep = 0;
    const tickMs = 980;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const tNow = ac.currentTime + 0.02;
      const note = DIALOGUE_COMBAT_MELODY[melodyStep % DIALOGUE_COMBAT_MELODY.length]!;
      melodyStep++;
      triggerPluck(ctx, master, tNow, note, this.host.gain(0.11), 'triangle', 2.85);
      triggerPluck(ctx, master, tNow + 0.09, note * 0.5, this.host.gain(0.064), 'sine', 3.1);
      if (melodyStep % 3 === 0) {
        triggerPluck(ctx, master, tNow + 0.16, note * 1.498, this.host.gain(0.042), 'sine', 1.9);
      }
      pulseStep++;
      if (pulseStep % 2 === 0) {
        const sub = tNow + 0.04;
        beatGain.gain.setTargetAtTime(this.host.gain(0.09), sub, 0.04);
        beatGain.gain.setTargetAtTime(0, sub + 0.22, 0.12);
      }
      if (melodyStep % 5 === 0) {
        triggerHat(ctx, master, tNow + 0.22, this.host.gain(0.018));
      }
    }, tickMs);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      try {
        beat.stop();
      } catch {
        /* noop */
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Acampamento: cama harmónica quente + melodia lenta e contemplativa.
   */
  private playAmbientCamp(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.42);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 98, level: 0.2, type: 'sine' },
      { freq: 123.47, level: 0.22, type: 'triangle' },
      { freq: 146.83, level: 0.18, type: 'sine' },
      { freq: 196, level: 0.1, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.value = level * 0.45;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.02;
      const breathe = 0.1 + Math.sin(t * 0.4) * 0.04;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.8);
      } catch {
        /* noop */
      }
    }, 520);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = CAMP_MELODY[melodyStep % CAMP_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.182), 'sine', 2.2);
      // Uma oitava acima, sutil, para dar "brilho" ao acampamento.
      triggerPluck(ctx, master, when + 0.05, note * 2, this.host.gain(0.143), 'triangle', 1.8);
    }, 1900);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Boss: batida mais agressiva + baixo contínuo + lead heroico.
   */
  private playAmbientBoss(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.15);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 10;
    comp.ratio.value = 5;
    comp.attack.value = 0.005;
    comp.release.value = 0.2;
    master.connect(comp);
    comp.connect(ctx.destination);

    const drones: OscillatorNode[] = [];
    for (const freq of [55, 82.41, 110]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 8;
      g.gain.value = freq === 55 ? 0.12 : 0.1;
      o.connect(g);
      g.connect(master);
      o.start();
      drones.push(o);
    }

    const bassPattern = [55, 55, 65.41, 73.42, 82.41, 73.42, 65.41, 55];
    let step = 0;
    const eighth = 125;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const tNow = ctx.currentTime;
      const s = step % 16;

      if (s === 0 || s === 3 || s === 8 || s === 11 || s === 14) {
        triggerKick(ctx, master, tNow, this.host.gain(0.16));
      }
      if (s === 4 || s === 12) {
        triggerSnare(ctx, master, tNow, this.host.gain(0.15));
      }
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow, this.host.gain(s % 4 === 0 ? 0.138 : 0.13));
      }

      const bassFreq = bassPattern[step % bassPattern.length];
      triggerPluck(ctx, master, tNow, bassFreq, this.host.gain(0.15), 'sawtooth', 0.12);

      if (s % 4 === 0) {
        const note = BOSS_LEAD_MELODY[(step / 4) % BOSS_LEAD_MELODY.length];
        triggerPluck(ctx, master, tNow + 0.01, note, this.host.gain(0.16), 'triangle', 0.5);
        triggerPluck(ctx, master, tNow + 0.08, note * 1.5, this.host.gain(0.132), 'triangle', 0.35);
      }
      step++;
    }, eighth);

    this.bgCleanup = () => {
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of drones) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Ato 5: camada fria e espaçada, com lead cristalino.
   */
  private playAmbientAct5Ice(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.2);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -30;
    comp.knee.value = 10;
    comp.ratio.value = 3;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 73.42, level: 0.15, type: 'sine' }, // D2
      { freq: 146.83, level: 0.13, type: 'triangle' }, // D3
      { freq: 220.0, level: 0.1, type: 'sine' }, // A3
      { freq: 293.66, level: 0.07, type: 'triangle' }, // D4
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 12;
      g.gain.value = level * 0.45;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.03;
      const freezeBreathe = 0.18 + Math.sin(t * 0.55) * 0.122 + Math.sin(t * 0.13) * 0.01;
      try {
        master.gain.setTargetAtTime(this.host.gain(freezeBreathe), ac.currentTime, 0.7);
      } catch {
        /* noop */
      }
    }, 420);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = ACT5_ICE_MELODY[melodyStep % ACT5_ICE_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.03;
      triggerPluck(ctx, master, when, note, this.host.gain(0.187), 'triangle', 2.6);
      triggerPluck(ctx, master, when + 0.09, note * 2, this.host.gain(0.107), 'sine', 1.4);
    }, 1800);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Montanhas (gruta / monge): drones baixos + motivo lento, mais suspenso que o gelo aberto.
   */
  private playAmbientFrostMystery(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.17);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -32;
    comp.knee.value = 14;
    comp.ratio.value = 2.5;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 65.41, level: 0.12, type: 'sine' }, // C2
      { freq: 98.0, level: 0.11, type: 'triangle' }, // G2
      { freq: 130.81, level: 0.09, type: 'sine' }, // C3
      { freq: 174.61, level: 0.06, type: 'triangle' }, // F3
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 8;
      g.gain.value = level * 0.42;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.025;
      const breathe = 0.14 + Math.sin(t * 0.4) * 0.08 + Math.sin(t * 0.09) * 0.02;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.85);
      } catch {
        /* noop */
      }
    }, 520);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = FROST_MYSTERY_MELODY[melodyStep % FROST_MYSTERY_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.04;
      triggerPluck(ctx, master, when, note, this.host.gain(0.14), 'sine', 3.2);
      triggerPluck(ctx, master, when + 0.12, note * 1.5, this.host.gain(0.09), 'triangle', 2.4);
    }, 2400);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Mercador: motivo de alaúde medieval com pulsação de mercado.
   */
  private playAmbientMerchant(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.11);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -26;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ctx.destination);

    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = 'triangle';
    drone.frequency.value = 110;
    droneGain.gain.value = 0.045;
    drone.connect(droneGain);
    droneGain.connect(master);
    drone.start();

    let step = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const tNow = ctx.currentTime + 0.01;
      const s = step % 8;
      const note = MERCHANT_LUTE_MELODY[step % MERCHANT_LUTE_MELODY.length];
      triggerPluck(ctx, master, tNow, note, this.host.gain(0.122), 'triangle', 0.7);
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow + 0.015, this.host.gain(0.116));
      }
      if (s === 0 || s === 4) {
        triggerKick(ctx, master, tNow, this.host.gain(0.17));
      }
      step++;
    }, 310);

    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      try {
        const pulse = step % 4 === 0 ? 0.06 : 0.04;
        droneGain.gain.setTargetAtTime(this.host.gain(pulse), ac.currentTime, 0.2);
      } catch {
        /* noop */
      }
    }, 620);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      try {
        drone.stop();
      } catch {
        /* noop */
      }
      try {
        drone.disconnect();
        droneGain.disconnect();
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Templo antigo / ritual: sub-graves, batimento lento entre parciais, plucks rasgados + batida cardíaca esparsa.
   */
  private playAmbientAncientMacabre(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.24);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 6;
    comp.ratio.value = 5.5;
    comp.attack.value = 0.008;
    comp.release.value = 0.32;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 30.87, level: 0.2, type: 'sine' }, // B0 — sub pressão
      { freq: 41.2, level: 0.26, type: 'sine' },
      { freq: 43.65, level: 0.14, type: 'sine' }, // beating ~2.5 Hz vs 41.2
      { freq: 61.74, level: 0.22, type: 'triangle' },
      { freq: 82.41, level: 0.18, type: 'sawtooth' },
      { freq: 103.83, level: 0.14, type: 'sine' },
      { freq: 116.54, level: 0.12, type: 'sawtooth' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 24;
      g.gain.value = level * 0.55;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.028;
      const breathe =
        0.2 +
        Math.sin(t * 0.14) * 0.14 +
        Math.sin(t * 0.05) * 0.06 +
        Math.sin(t * 0.031) * 0.04;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.75);
      } catch {
        /* noop */
      }
    }, 420);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const step = melodyStep++;
      const note = ANCIENT_MACABRE_MELODY[step % ANCIENT_MACABRE_MELODY.length]!;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.26), 'sawtooth', 3.4);
      triggerPluck(ctx, master, when + 0.12, note * 0.5, this.host.gain(0.15), 'sine', 3.8);
      triggerPluck(ctx, master, when + 0.22, note * 1.414, this.host.gain(0.13), 'triangle', 2.8);
      if (step % 4 === 0) {
        triggerKick(ctx, master, when - 0.02, this.host.gain(0.078));
      }
      const hatVol = step % 5 === 2 ? 0.052 : 0.028;
      triggerHat(ctx, master, when + 0.34, this.host.gain(hatVol));
    }, 2350);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Cinzas do céu: drones desalinhados + melodia lenta com trítonos — “fim visível”.
   */
  private playAmbientAshSky(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.host.gain(0.2);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -27;
    comp.knee.value = 11;
    comp.ratio.value = 3.4;
    comp.attack.value = 0.004;
    comp.release.value = 0.26;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 48.99, level: 0.2, type: 'sine' }, // G1 — terra em vibração
      { freq: 61.74, level: 0.17, type: 'triangle' },
      { freq: 73.42, level: 0.14, type: 'sine' },
      { freq: 92.5, level: 0.11, type: 'sawtooth' },
      { freq: 103.83, level: 0.09, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 22;
      g.gain.value = level * 0.48;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.034;
      const breathe = 0.17 + Math.sin(t * 0.31) * 0.11 + Math.sin(t * 0.09) * 0.05;
      try {
        master.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.55);
      } catch {
        /* noop */
      }
    }, 340);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = ASH_SKY_MELODY[melodyStep % ASH_SKY_MELODY.length];
      melodyStep++;
      const when = ac.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.host.gain(0.19), 'sawtooth', 2.4);
      triggerPluck(ctx, master, when + 0.11, note * 0.5, this.host.gain(0.12), 'triangle', 2.0);
      triggerHat(ctx, master, when + 0.35, this.host.gain(melodyStep % 3 === 0 ? 0.045 : 0.028));
    }, 1320);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        master.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }

  /**
   * Void: drone baixo num bus; linha melódica noutro (ganho estável) para não ficar soterrada.
   * A melodia usa oitava acima — graves puros somam pouco em altifalantes pequenos.
   */
  private playAmbientVoid(): void {
    if (this.bgCleanup) return;
    const ctx = this.host.ensureContext();
    const voidDroneMul = 1.7;
    const voidMelodyMul = 1.4;
    const droneBus = ctx.createGain();
    droneBus.gain.value = this.host.gain(0.15 * voidDroneMul);
    const melodyBus = ctx.createGain();
    melodyBus.gain.value = this.host.gain(0.22 * voidMelodyMul);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -28;
    comp.knee.value = 10;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.003;
    comp.release.value = 0.28;
    droneBus.connect(comp);
    melodyBus.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 55, level: 0.2, type: 'sine' },
      { freq: 110, level: 0.18, type: 'sine' },
      { freq: 146.83, level: 0.13, type: 'triangle' },
      { freq: 174.61, level: 0.1, type: 'sine' },
      { freq: 123.47, level: 0.07, type: 'triangle' },
    ];

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 10;
      g.gain.value = level;
      o.connect(g);
      g.connect(droneBus);
      o.start();
      oscillators.push(o);
      gains.push(g);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      t += 0.026;
      try {
        const breathe =
          (0.43 + Math.sin(t * 0.19) * 0.328 + Math.sin(t * 0.06) * 0.318) * voidDroneMul;
        droneBus.gain.setTargetAtTime(this.host.gain(breathe), ac.currentTime, 0.7);
        for (let i = 0; i < gains.length; i++) {
          const mod = 0.82 + Math.sin(t * (0.11 + i * 0.06)) * 0.32;
          gains[i]!.gain.setTargetAtTime(mod * layers[i]!.level, ac.currentTime, 0.85);
          oscillators[i]!.detune.setTargetAtTime(Math.sin(t * 0.12 + i * 0.9) * 6, ac.currentTime, 0.75);
        }
      } catch {
        /* noop */
      }
    }, 400);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      const ac = this.host.getAudioContext();
      if (!ac) return;
      const note = VOID_DRONE_MELODY[melodyStep % VOID_DRONE_MELODY.length]!;
      melodyStep++;
      const when = ac.currentTime + 0.02;
      const lead = note * 2;
      triggerPluck(ctx, melodyBus, when, lead, this.host.gain(0.29), 'triangle', 2.5);
      triggerPluck(ctx, melodyBus, when + 0.19, lead * 0.5, this.host.gain(0.18), 'sine', 2.2);
    }, 2600);

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
      }
      if (this.bgRhythmTimer) {
        clearInterval(this.bgRhythmTimer);
        this.bgRhythmTimer = null;
      }
      for (const o of oscillators) {
        try {
          o.stop();
        } catch {
          /* noop */
        }
      }
      try {
        droneBus.disconnect();
        melodyBus.disconnect();
        comp.disconnect();
      } catch {
        /* noop */
      }
    };
  }
}
