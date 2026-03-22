const STORAGE_MUTE = 'calvario_sound_muted';

/** Áudio retro: tons simples; requer gesto do utilizador para AudioContext. */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private muted = false;
  private ambientOsc: OscillatorNode | null = null;

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

  playAmbient(): void {
    if (this.muted || this.ambientOsc) return;
    const ctx = this.ensureContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 55;
    g.gain.value = 0.025;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    this.ambientOsc = o;
  }

  stopAmbient(): void {
    try {
      this.ambientOsc?.stop();
    } catch {
      /* noop */
    }
    this.ambientOsc = null;
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
