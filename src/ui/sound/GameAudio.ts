import {
  ACT5_ICE_MELODY,
  BOSS_LEAD_MELODY,
  CAMP_MELODY,
  EXPLORE_PIANO_MELODY,
  MERCHANT_LUTE_MELODY,
  VOID_DRONE_MELODY,
} from './melodies.ts';
import { playOneShotTone, triggerArp, triggerHat, triggerKick, triggerPluck, triggerSnare } from './primitives.ts';
import type { AmbientTheme } from './types.ts';

/**
 * Audio retro: tons simples + música de fundo procedural (Web Audio).
 * Temas: exploração, combate (batida), acampamento, chefe.
 */
export class GameAudio {
  private readonly storageMuteKey: string;
  private ctx: AudioContext | null = null;
  private muted = false;
  private bgCleanup: (() => void) | null = null;
  private bgPulseTimer: ReturnType<typeof setInterval> | null = null;
  private bgRhythmTimer: ReturnType<typeof setInterval> | null = null;
  private currentTheme: AmbientTheme | null = null;

  constructor(campaignId: string) {
    this.storageMuteKey = `${campaignId}_sound_muted`;
    try {
      this.muted = localStorage.getItem(this.storageMuteKey) === '1';
    } catch {
      /* noop */
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    try {
      localStorage.setItem(this.storageMuteKey, m ? '1' : '0');
    } catch {
      /* noop */
    }
    if (m) this.stopAmbient();
  }

  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  startAmbientWhenReady(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const run = (): void => {
      if (this.muted) return;
      if (!this.currentTheme) {
        this.setAmbientTheme('explore');
      }
    };
    if (ctx.state === 'running') {
      run();
    } else {
      void ctx.resume().then(run);
    }
  }

  /** Troca a música de fundo (idempotente se já for o mesmo tema). */
  setAmbientTheme(theme: AmbientTheme): void {
    if (this.muted) return;
    if (this.currentTheme === theme && this.bgCleanup) return;
    this.stopAmbientInternal();
    this.currentTheme = theme;
    switch (theme) {
      case 'explore':
        this.playAmbientExplore();
        break;
      case 'combat':
        this.playAmbientCombat();
        break;
      case 'camp':
        this.playAmbientCamp();
        break;
      case 'boss':
        this.playAmbientBoss();
        break;
      case 'act5':
        this.playAmbientAct5Ice();
        break;
      case 'merchant':
        this.playAmbientMerchant();
        break;
      case 'void':
        this.playAmbientVoid();
        break;
    }
  }

  getAmbientTheme(): AmbientTheme | null {
    return this.currentTheme;
  }

  private gain(base: number): number {
    return this.muted ? 0 : base;
  }

  private stopAmbientInternal(): void {
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

  playUiClick(): void {
    this.playTone(520, 0.04, 0.06, 'square');
  }

  playBlocked(): void {
    this.playTone(90, 0.06, 0.05, 'sine');
  }

  playDice(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.07);
    if (g <= 0) return;
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 180 + i * 90;
      gn.gain.value = g;
      o.connect(gn);
      gn.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.05;
      o.start(t);
      o.stop(t + 0.06);
    }
  }

  playHit(): void {
    this.playTone(95, 0.12, 0.12, 'sawtooth');
  }

  /** Erro / falha leve (ataque falha, sorte má) */
  playMiss(): void {
    this.playTone(220, 0.08, 0.05, 'triangle');
    this.playTone(140, 0.12, 0.04, 'sine');
  }

  /** Dano recebido pelo herói */
  playDamageTaken(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.09);
    if (g <= 0) return;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.18);
    gn.gain.setValueAtTime(g, ctx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
    o.connect(gn);
    gn.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.24);
  }

  /** Stress / tensão */
  playStressSting(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.08);
    if (g <= 0) return;
    [310, 295, 280].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      gn.gain.value = g * 0.6;
      o.connect(gn);
      gn.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.04;
      o.start(t);
      o.stop(t + 0.06);
    });
  }

  /** Teste de sorte / perícia falhou */
  playCheckFail(): void {
    this.playTone(100, 0.15, 0.07, 'sawtooth');
    this.playTone(80, 0.2, 0.05, 'sine');
  }

  /** Teste passou (leve) */
  playCheckSuccess(): void {
    this.playTone(660, 0.06, 0.05, 'sine');
    this.playTone(880, 0.08, 0.04, 'sine');
  }

  /** Item novo no inventário (fanfarra curta em três notas). */
  playItemAcquire(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.07);
    if (g <= 0) return;
    [784, 988, 1175].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      gn.gain.setValueAtTime(g, ctx.currentTime + i * 0.07);
      gn.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.07 + 0.12);
      o.connect(gn);
      gn.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.07;
      o.start(t);
      o.stop(t + 0.14);
    });
  }

  /** Milagre de fé — arpejo suave, tom “angelical” (Web Audio). */
  playFaithMiracle(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.09);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, dur: 0.35 },
      { f: 659.25, t: 0.12, dur: 0.38 },
      { f: 783.99, t: 0.26, dur: 0.42 },
      { f: 1046.5, t: 0.42, dur: 0.55 },
    ];
    for (const { f, t, dur } of notes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g * 0.85, t0 + t + 0.04);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.05);
    }
    const chordT = t0 + 0.55;
    for (const f of [392, 523.25, 659.25]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, chordT);
      gn.gain.exponentialRampToValueAtTime(g * 0.25, chordT + 0.08);
      gn.gain.exponentialRampToValueAtTime(0.001, chordT + 1.1);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(chordT);
      o.stop(chordT + 1.2);
    }
  }

  playVictory(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.08);
    if (g <= 0) return;
    [523, 659, 784].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      gn.gain.value = g;
      o.connect(gn);
      gn.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      o.start(t);
      o.stop(t + 0.2);
    });
  }

  /** Fanfarra curta ao subir de nível (após vitória). */
  playLevelUpCelebration(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.1);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const notes = [
      { f: 392, t: 0, dur: 0.12 },
      { f: 523.25, t: 0.1, dur: 0.14 },
      { f: 659.25, t: 0.22, dur: 0.14 },
      { f: 783.99, t: 0.36, dur: 0.16 },
      { f: 1046.5, t: 0.52, dur: 0.28 },
    ];
    for (const { f, t, dur } of notes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g, t0 + t + 0.02);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.04);
    }
    const chordT = t0 + 0.5;
    for (const f of [523.25, 659.25, 783.99]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, chordT);
      gn.gain.exponentialRampToValueAtTime(g * 0.45, chordT + 0.04);
      gn.gain.exponentialRampToValueAtTime(0.001, chordT + 0.55);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(chordT);
      o.stop(chordT + 0.6);
    }
  }

  /**
   * Derrota / fim de combate mau — linha descendente.
   */
  playDefeat(): void {
    const ctx = this.ensureContext();
    const g = this.gain(0.08);
    if (g <= 0) return;
    [392, 349, 311, 277].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      gn.gain.value = g * 0.85;
      o.connect(gn);
      gn.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.12;
      o.start(t);
      o.stop(t + 0.22);
    });
  }

  /**
   * Exploração: pad em lá menor com pulsação lenta + piano discreto.
   */
  private playAmbientExplore(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();

    const master = ctx.createGain();
    master.gain.value = this.gain(0.14);

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
      if (this.muted || !this.ctx) return;
      t += 0.035;
      const breathe = 0.11 + Math.sin(t) * 0.032 + Math.sin(t * 0.37) * 0.014;
      try {
        master.gain.setTargetAtTime(this.gain(breathe), this.ctx.currentTime, 0.55);
      } catch {
        /* noop */
      }
    }, 380);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = EXPLORE_PIANO_MELODY[melodyStep % EXPLORE_PIANO_MELODY.length];
      melodyStep++;
      const when = this.ctx.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.gain(0.018), 'triangle', 1.8);
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
   * Combate: ~120 BPM, kick + snare + hi-hat + baixo pulsante.
   */
  private playAmbientCombat(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.12);
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
      if (this.muted || !this.ctx) return;
      const tNow = ctx.currentTime;
      const s = step % 8;
      if (s === 0 || s === 4) {
        triggerKick(ctx, master, tNow, this.gain(0.14));
        bassGain.gain.setTargetAtTime(this.gain(0.18), tNow, 0.02);
        bassGain.gain.setTargetAtTime(0, tNow + 0.12, 0.05);
      } else if (s === 2 || s === 6) {
        triggerSnare(ctx, master, tNow, this.gain(0.11));
      }
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow, this.gain(s === 0 || s === 4 ? 0.04 : 0.025));
      }
      if (s === 0) {
        triggerArp(ctx, master, tNow, this.gain(0.045));
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
   * Acampamento: cama harmónica quente + melodia lenta e contemplativa.
   */
  private playAmbientCamp(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.12);
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
      if (this.muted || !this.ctx) return;
      t += 0.02;
      const breathe = 0.1 + Math.sin(t * 0.4) * 0.04;
      try {
        master.gain.setTargetAtTime(this.gain(breathe), this.ctx.currentTime, 0.8);
      } catch {
        /* noop */
      }
    }, 520);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = CAMP_MELODY[melodyStep % CAMP_MELODY.length];
      melodyStep++;
      const when = this.ctx.currentTime + 0.02;
      triggerPluck(ctx, master, when, note, this.gain(0.02), 'sine', 2.2);
      // Uma oitava acima, quase imperceptível, para dar "brilho" ao acampamento.
      triggerPluck(ctx, master, when + 0.05, note * 2, this.gain(0.008), 'triangle', 1.8);
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
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.12);

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
      g.gain.value = freq === 55 ? 0.18 : 0.12;
      o.connect(g);
      g.connect(master);
      o.start();
      drones.push(o);
    }

    const bassPattern = [55, 55, 65.41, 73.42, 82.41, 73.42, 65.41, 55];
    let step = 0;
    const eighth = 125;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const tNow = ctx.currentTime;
      const s = step % 16;

      if (s === 0 || s === 3 || s === 8 || s === 11 || s === 14) {
        triggerKick(ctx, master, tNow, this.gain(0.16));
      }
      if (s === 4 || s === 12) {
        triggerSnare(ctx, master, tNow, this.gain(0.12));
      }
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow, this.gain(s % 4 === 0 ? 0.038 : 0.03));
      }

      const bassFreq = bassPattern[step % bassPattern.length];
      triggerPluck(ctx, master, tNow, bassFreq, this.gain(0.05), 'sawtooth', 0.22);

      if (s % 4 === 0) {
        const note = BOSS_LEAD_MELODY[(step / 4) % BOSS_LEAD_MELODY.length];
        triggerPluck(ctx, master, tNow + 0.01, note, this.gain(0.03), 'triangle', 0.5);
        triggerPluck(ctx, master, tNow + 0.08, note * 1.5, this.gain(0.012), 'triangle', 0.35);
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
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.1);
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
      if (this.muted || !this.ctx) return;
      t += 0.03;
      const freezeBreathe = 0.08 + Math.sin(t * 0.55) * 0.022 + Math.sin(t * 0.13) * 0.01;
      try {
        master.gain.setTargetAtTime(this.gain(freezeBreathe), this.ctx.currentTime, 0.7);
      } catch {
        /* noop */
      }
    }, 420);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = ACT5_ICE_MELODY[melodyStep % ACT5_ICE_MELODY.length];
      melodyStep++;
      const when = this.ctx.currentTime + 0.03;
      triggerPluck(ctx, master, when, note, this.gain(0.017), 'triangle', 2.6);
      triggerPluck(ctx, master, when + 0.09, note * 2, this.gain(0.007), 'sine', 1.4);
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
   * Mercador: motivo de alaúde medieval com pulsação de mercado.
   */
  private playAmbientMerchant(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.11);
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
      if (this.muted || !this.ctx) return;
      const tNow = ctx.currentTime + 0.01;
      const s = step % 8;
      const note = MERCHANT_LUTE_MELODY[step % MERCHANT_LUTE_MELODY.length];
      triggerPluck(ctx, master, tNow, note, this.gain(0.022), 'triangle', 0.7);
      if (s % 2 === 0) {
        triggerHat(ctx, master, tNow + 0.015, this.gain(0.016));
      }
      if (s === 0 || s === 4) {
        triggerKick(ctx, master, tNow, this.gain(0.07));
      }
      step++;
    }, 310);

    this.bgPulseTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      try {
        const pulse = step % 4 === 0 ? 0.06 : 0.04;
        droneGain.gain.setTargetAtTime(this.gain(pulse), this.ctx.currentTime, 0.2);
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
   * Void: atmosfera irreal e ameaçadora, sem batida definida.
   */
  private playAmbientVoid(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.08);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -32;
    comp.knee.value = 8;
    comp.ratio.value = 2.8;
    master.connect(comp);
    comp.connect(ctx.destination);

    const layers: { freq: number; level: number; type: OscillatorType }[] = [
      { freq: 46.25, level: 0.22, type: 'sine' },
      { freq: 69.3, level: 0.16, type: 'triangle' },
      { freq: 92.5, level: 0.11, type: 'sine' },
    ];

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    for (const { freq, level, type } of layers) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 18;
      g.gain.value = level * 0.35;
      o.connect(g);
      g.connect(master);
      o.start();
      oscillators.push(o);
      gains.push(g);
    }

    let t = 0;
    this.bgPulseTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      t += 0.025;
      try {
        master.gain.setTargetAtTime(
          this.gain(0.06 + Math.sin(t * 0.31) * 0.02 + Math.sin(t * 0.09) * 0.01),
          this.ctx.currentTime,
          0.9
        );
        for (let i = 0; i < gains.length; i++) {
          const mod = 0.26 + Math.sin(t * (0.5 + i * 0.18)) * 0.1;
          gains[i]!.gain.setTargetAtTime(mod * (layers[i]!.level * 0.35), this.ctx.currentTime, 1.1);
        }
      } catch {
        /* noop */
      }
    }, 500);

    let melodyStep = 0;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const note = VOID_DRONE_MELODY[melodyStep % VOID_DRONE_MELODY.length]!;
      melodyStep++;
      const when = this.ctx.currentTime + 0.03;
      triggerPluck(ctx, master, when, note, this.gain(0.014), 'sine', 1.8);
      triggerPluck(ctx, master, when + 0.11, note * 0.5, this.gain(0.009), 'triangle', 1.5);
    }, 2100);

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

  stopAmbient(): void {
    this.stopAmbientInternal();
  }

  private playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    const ctx = this.ensureContext();
    const g = this.gain(vol);
    playOneShotTone(ctx, ctx.destination, freq, dur, g, type);
  }
}
