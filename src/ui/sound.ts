const STORAGE_MUTE = 'calvario_sound_muted';

export type AmbientTheme = 'explore' | 'combat' | 'camp' | 'boss';

/**
 * Áudio retro: tons simples + música de fundo procedural (Web Audio).
 * Temas: exploração, combate (batida), acampamento, chefe.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private bgCleanup: (() => void) | null = null;
  private bgPulseTimer: ReturnType<typeof setInterval> | null = null;
  private bgRhythmTimer: ReturnType<typeof setInterval> | null = null;
  private currentTheme: AmbientTheme | null = null;

  constructor() {
    try {
      this.muted = localStorage.getItem(STORAGE_MUTE) === '1';
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
      localStorage.setItem(STORAGE_MUTE, m ? '1' : '0');
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
   * Exploração: pad em lá menor com pulsação lenta.
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

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
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
      const t = ctx.currentTime;
      const s = step % 8;
      if (s === 0 || s === 4) {
        this.triggerKick(ctx, master, t);
        bassGain.gain.setTargetAtTime(this.gain(0.18), t, 0.02);
        bassGain.gain.setTargetAtTime(0, t + 0.12, 0.05);
      } else if (s === 2 || s === 6) {
        this.triggerSnare(ctx, master, t);
      }
      if (s % 2 === 0) {
        this.triggerHat(ctx, master, t, s === 0 || s === 4 ? 0.04 : 0.025);
      }
      if (s === 0) {
        this.triggerArp(ctx, master, t);
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

  private triggerKick(ctx: AudioContext, dest: AudioNode, t: number): void {
    const g = this.gain(0.14);
    if (g <= 0) return;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.06);
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    o.connect(gn);
    gn.connect(dest);
    o.start(t);
    o.stop(t + 0.11);
  }

  private triggerSnare(ctx: AudioContext, dest: AudioNode, t: number): void {
    const g = this.gain(0.11);
    if (g <= 0) return;
    const len = 4096;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1800;
    const gn = ctx.createGain();
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    src.connect(bp);
    bp.connect(gn);
    gn.connect(dest);
    src.start(t);
    src.stop(t + 0.12);
  }

  private triggerHat(ctx: AudioContext, dest: AudioNode, t: number, vol: number): void {
    const g = this.gain(vol);
    if (g <= 0) return;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 8000 + Math.random() * 400;
    gn.gain.setValueAtTime(g, t);
    gn.gain.exponentialRampToValueAtTime(0.01, t + 0.03);
    o.connect(gn);
    gn.connect(dest);
    o.start(t);
    o.stop(t + 0.04);
  }

  /** Arpejo curto (pentatónica menor) no compasso */
  private triggerArp(ctx: AudioContext, dest: AudioNode, t: number): void {
    const g = this.gain(0.045);
    if (g <= 0) return;
    const notes = [220, 261.63, 293.66, 329.63];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'square';
      o.frequency.value = f;
      gn.gain.setValueAtTime(g, t + i * 0.05);
      gn.gain.exponentialRampToValueAtTime(0.01, t + i * 0.05 + 0.08);
      o.connect(gn);
      gn.connect(dest);
      o.start(t + i * 0.05);
      o.stop(t + i * 0.05 + 0.09);
    });
  }

  /**
   * Acampamento: mais lento, acordes mais abertos, menos agressivo.
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

    this.bgCleanup = () => {
      if (this.bgPulseTimer) {
        clearInterval(this.bgPulseTimer);
        this.bgPulseTimer = null;
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
   * Boss: metade do tempo, drones graves, pouca percussão.
   */
  private playAmbientBoss(): void {
    if (this.muted || this.bgCleanup) return;
    const ctx = this.ensureContext();
    const master = ctx.createGain();
    master.gain.value = this.gain(0.11);
    master.connect(ctx.destination);

    const drones: OscillatorNode[] = [];
    for (const freq of [55, 82.41, 103.83]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      o.detune.value = (Math.random() - 0.5) * 6;
      g.gain.value = freq === 55 ? 0.22 : 0.14;
      o.connect(g);
      g.connect(master);
      o.start();
      drones.push(o);
    }

    let step = 0;
    const eighth = 250;
    this.bgRhythmTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const t = ctx.currentTime;
      const s = step % 8;
      if (s === 0 || s === 4) {
        this.triggerKick(ctx, master, t);
        this.triggerSnare(ctx, master, t + 0.05);
      }
      if (s === 0) {
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = 123;
        gn.gain.setValueAtTime(this.gain(0.05), t);
        gn.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
        o.connect(gn);
        gn.connect(master);
        o.start(t);
        o.stop(t + 0.45);
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
    if (g <= 0) return;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    gn.gain.value = g;
    o.connect(gn);
    gn.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + dur);
  }
}
