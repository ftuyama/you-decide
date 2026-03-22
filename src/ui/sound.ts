const STORAGE_MUTE = 'calvario_sound_muted';

/**
 * Áudio retro: tons simples + música de fundo procedural (Web Audio).
 * Requer gesto do utilizador para AudioContext; sem ficheiros externos.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  /** Limpeza da música de fundo (osciladores + intervalo + nós) */
  private bgCleanup: (() => void) | null = null;
  private bgPulseTimer: ReturnType<typeof setInterval> | null = null;

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

  /** Chamar após clique/tecla para desbloquear áudio no browser */
  ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Inicia a música de fundo só depois do AudioContext estar `running`.
   * O `resume()` tem de ser pedido no gesto do utilizador; o pad não pode
   * ser criado enquanto o contexto está `suspended` (Chrome/Safari).
   */
  startAmbientWhenReady(): void {
    if (this.muted) return;
    const ctx = this.ensureContext();
    const run = (): void => {
      if (this.muted || this.bgCleanup) return;
      this.playAmbient();
    };
    if (ctx.state === 'running') {
      run();
    } else {
      void ctx.resume().then(run);
    }
  }

  private gain(base: number): number {
    return this.muted ? 0 : base;
  }

  playUiClick(): void {
    this.playTone(520, 0.04, 0.06, 'square');
  }

  /** Parede ou movimento bloqueado */
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
   * Música de fundo: pad em lá menor (sub + acorde) com pulsação lenta.
   * Idempotente: se já a tocar, não duplica.
   */
  playAmbient(): void {
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

    /** Hz: sub, fundamental, terça menor, quinta (Am) */
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

  stopAmbient(): void {
    if (this.bgPulseTimer) {
      clearInterval(this.bgPulseTimer);
      this.bgPulseTimer = null;
    }
    if (this.bgCleanup) {
      this.bgCleanup();
      this.bgCleanup = null;
    }
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
