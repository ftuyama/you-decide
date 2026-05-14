import { playOneShotTone } from '../primitives.ts';
import type { GameAudioHost } from './gameAudioHost.ts';

/** Efeitos sonoros curtos (UI, combate, progressão). */
export class GameSfxPlayer {
  private readonly host: GameAudioHost;

  constructor(host: GameAudioHost) {
    this.host = host;
  }

  playUiClick(): void {
    this.playTone(520, 0.04, 0.06, 'square');
  }

  /** Confirmação de classe — Cavaleiro: choque metálico + acorde grave heroico. */
  playClassCommitKnight(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.13);
    if (g <= 0) return;
    const clang = ctx.createOscillator();
    const gClang = ctx.createGain();
    clang.type = 'square';
    clang.frequency.setValueAtTime(420, t0);
    clang.frequency.exponentialRampToValueAtTime(110, t0 + 0.06);
    gClang.gain.setValueAtTime(g * 0.42, t0);
    gClang.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
    clang.connect(gClang);
    gClang.connect(ctx.destination);
    clang.start(t0);
    clang.stop(t0 + 0.11);
    const ringT = t0 + 0.04;
    for (const f of [146.83, 220.0, 293.66]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, ringT);
      gn.gain.exponentialRampToValueAtTime(g * 0.52, ringT + 0.035);
      gn.gain.exponentialRampToValueAtTime(0.001, ringT + 0.52);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(ringT);
      o.stop(ringT + 0.55);
    }
  }

  /** Confirmação de classe — Clériga: sinos graves ascendentes + halo curto. */
  playClassCommitCleric(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.12);
    if (g <= 0) return;
    const bells = [
      { f: 392.0, t: 0, dur: 0.55 },
      { f: 523.25, t: 0.14, dur: 0.62 },
      { f: 659.25, t: 0.3, dur: 0.7 },
    ];
    for (const { f, t, dur } of bells) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const st = t0 + t;
      gn.gain.setValueAtTime(0.001, st);
      gn.gain.exponentialRampToValueAtTime(g * 0.72, st + 0.028);
      gn.gain.exponentialRampToValueAtTime(0.001, st + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(st);
      o.stop(st + dur + 0.04);
    }
    const haloT = t0 + 0.38;
    for (const f of [329.63, 493.88]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, haloT);
      gn.gain.exponentialRampToValueAtTime(g * 0.22, haloT + 0.12);
      gn.gain.exponentialRampToValueAtTime(0.001, haloT + 0.85);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(haloT);
      o.stop(haloT + 0.9);
    }
  }

  /** Confirmação de classe — Mago: subida arcana + cristais agudos. */
  playClassCommitMage(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.11);
    if (g <= 0) return;
    const sweep = ctx.createOscillator();
    const gSw = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(220, t0);
    sweep.frequency.exponentialRampToValueAtTime(1680, t0 + 0.09);
    gSw.gain.setValueAtTime(g * 0.28, t0);
    gSw.gain.exponentialRampToValueAtTime(0.01, t0 + 0.14);
    sweep.connect(gSw);
    gSw.connect(ctx.destination);
    sweep.start(t0);
    sweep.stop(t0 + 0.15);
    [2200, 2800, 1900].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      const st = t0 + 0.05 + i * 0.04;
      gn.gain.setValueAtTime(0.001, st);
      gn.gain.exponentialRampToValueAtTime(g * 0.26, st + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.01, st + 0.09);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(st);
      o.stop(st + 0.1);
    });
  }

  playBlocked(): void {
    this.playTone(90, 0.06, 0.45, 'sine');
  }

  playDice(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.17);
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

  /** Corte de lâmina (ataque físico estilo espada/adaga). */
  playSwordSlash(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.1);
    if (g <= 0) return;
    const whoosh = ctx.createOscillator();
    const gWhoosh = ctx.createGain();
    whoosh.type = 'sawtooth';
    whoosh.frequency.setValueAtTime(380, t0);
    whoosh.frequency.exponentialRampToValueAtTime(2200, t0 + 0.028);
    whoosh.frequency.exponentialRampToValueAtTime(520, t0 + 0.09);
    gWhoosh.gain.setValueAtTime(g * 0.55, t0);
    gWhoosh.gain.exponentialRampToValueAtTime(0.01, t0 + 0.11);
    whoosh.connect(gWhoosh);
    gWhoosh.connect(ctx.destination);
    whoosh.start(t0);
    whoosh.stop(t0 + 0.12);
    const ring = ctx.createOscillator();
    const gRing = ctx.createGain();
    ring.type = 'square';
    ring.frequency.setValueAtTime(2100, t0 + 0.015);
    ring.frequency.exponentialRampToValueAtTime(900, t0 + 0.055);
    gRing.gain.setValueAtTime(g * 0.22, t0 + 0.015);
    gRing.gain.exponentialRampToValueAtTime(0.01, t0 + 0.08);
    ring.connect(gRing);
    gRing.connect(ctx.destination);
    ring.start(t0 + 0.015);
    ring.stop(t0 + 0.09);
  }

  /** Impacto contundente (maça). */
  playBluntImpact(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.115);
    if (g <= 0) return;
    const click = ctx.createOscillator();
    const gClick = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(2400, t0);
    click.frequency.exponentialRampToValueAtTime(480, t0 + 0.022);
    gClick.gain.setValueAtTime(g * 0.14, t0);
    gClick.gain.exponentialRampToValueAtTime(0.01, t0 + 0.035);
    click.connect(gClick);
    gClick.connect(ctx.destination);
    click.start(t0);
    click.stop(t0 + 0.04);
    const thud = ctx.createOscillator();
    const gThud = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(155, t0 + 0.008);
    thud.frequency.exponentialRampToValueAtTime(48, t0 + 0.15);
    gThud.gain.setValueAtTime(0.001, t0);
    gThud.gain.setValueAtTime(g * 0.92, t0 + 0.008);
    gThud.gain.exponentialRampToValueAtTime(0.01, t0 + 0.2);
    thud.connect(gThud);
    gThud.connect(ctx.destination);
    thud.start(t0);
    thud.stop(t0 + 0.22);
    const crack = ctx.createOscillator();
    const gCrack = ctx.createGain();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(340, t0 + 0.024);
    crack.frequency.exponentialRampToValueAtTime(110, t0 + 0.065);
    gCrack.gain.setValueAtTime(g * 0.32, t0 + 0.024);
    gCrack.gain.exponentialRampToValueAtTime(0.01, t0 + 0.095);
    crack.connect(gCrack);
    gCrack.connect(ctx.destination);
    crack.start(t0 + 0.024);
    crack.stop(t0 + 0.11);
  }

  /** Golpe com cajado (whoosh leve + toque mágico). */
  playStaffWhoosh(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.085);
    if (g <= 0) return;
    const air = ctx.createOscillator();
    const gAir = ctx.createGain();
    air.type = 'sine';
    air.frequency.setValueAtTime(480, t0);
    air.frequency.exponentialRampToValueAtTime(1400, t0 + 0.04);
    air.frequency.exponentialRampToValueAtTime(620, t0 + 0.1);
    gAir.gain.setValueAtTime(g * 0.5, t0);
    gAir.gain.exponentialRampToValueAtTime(0.01, t0 + 0.12);
    air.connect(gAir);
    gAir.connect(ctx.destination);
    air.start(t0);
    air.stop(t0 + 0.13);
    const chime = ctx.createOscillator();
    const gChime = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.value = 990;
    gChime.gain.setValueAtTime(0.001, t0 + 0.04);
    gChime.gain.exponentialRampToValueAtTime(g * 0.35, t0 + 0.055);
    gChime.gain.exponentialRampToValueAtTime(0.01, t0 + 0.14);
    chime.connect(gChime);
    gChime.connect(ctx.destination);
    chime.start(t0 + 0.04);
    chime.stop(t0 + 0.15);
  }

  /** Magia de fogo / brasa. */
  playSpellFire(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.095);
    if (g <= 0) return;
    const rush = ctx.createOscillator();
    const gRush = ctx.createGain();
    rush.type = 'sawtooth';
    rush.frequency.setValueAtTime(90, t0);
    rush.frequency.exponentialRampToValueAtTime(380, t0 + 0.05);
    gRush.gain.setValueAtTime(g * 0.45, t0);
    gRush.gain.exponentialRampToValueAtTime(0.01, t0 + 0.12);
    rush.connect(gRush);
    gRush.connect(ctx.destination);
    rush.start(t0);
    rush.stop(t0 + 0.13);
    [1800, 2400, 1600].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      gn.gain.setValueAtTime(0.001, t0 + i * 0.022);
      gn.gain.exponentialRampToValueAtTime(g * 0.12, t0 + i * 0.022 + 0.008);
      gn.gain.exponentialRampToValueAtTime(0.01, t0 + i * 0.022 + 0.05);
      o.connect(gn);
      gn.connect(ctx.destination);
      const st = t0 + i * 0.022;
      o.start(st);
      o.stop(st + 0.06);
    });
  }

  /** Rajada arcana genérica (raio, dano mágico). */
  playSpellArcaneBurst(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.09);
    if (g <= 0) return;
    const body = ctx.createOscillator();
    const gBody = ctx.createGain();
    body.type = 'triangle';
    body.frequency.setValueAtTime(440, t0);
    body.frequency.exponentialRampToValueAtTime(1320, t0 + 0.04);
    body.frequency.exponentialRampToValueAtTime(660, t0 + 0.11);
    gBody.gain.setValueAtTime(g * 0.55, t0);
    gBody.gain.exponentialRampToValueAtTime(0.01, t0 + 0.14);
    body.connect(gBody);
    gBody.connect(ctx.destination);
    body.start(t0);
    body.stop(t0 + 0.15);
    const sparkle = ctx.createOscillator();
    const gSp = ctx.createGain();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(2400, t0 + 0.02);
    sparkle.frequency.exponentialRampToValueAtTime(880, t0 + 0.08);
    gSp.gain.setValueAtTime(g * 0.2, t0 + 0.02);
    gSp.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
    sparkle.connect(gSp);
    gSp.connect(ctx.destination);
    sparkle.start(t0 + 0.02);
    sparkle.stop(t0 + 0.11);
  }

  /** Relâmpago / gelo prateado (tom mais “cristalino”). */
  playSpellIceSpark(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.088);
    if (g <= 0) return;
    [2640, 1980, 3520].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      gn.gain.setValueAtTime(0.001, t0 + i * 0.018);
      gn.gain.exponentialRampToValueAtTime(g * 0.22, t0 + i * 0.018 + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.01, t0 + i * 0.018 + 0.07);
      o.connect(gn);
      gn.connect(ctx.destination);
      const st = t0 + i * 0.018;
      o.start(st);
      o.stop(st + 0.08);
    });
  }

  /** Reforço sonoro em crítico (golpe ou magia). */
  playCritImpact(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.4);
    if (g <= 0) return;
    const snap = ctx.createOscillator();
    const gSnap = ctx.createGain();
    snap.type = 'square';
    snap.frequency.setValueAtTime(2800, t0);
    snap.frequency.exponentialRampToValueAtTime(520, t0 + 0.03);
    gSnap.gain.setValueAtTime(g * 0.26, t0);
    gSnap.gain.exponentialRampToValueAtTime(0.01, t0 + 0.045);
    snap.connect(gSnap);
    gSnap.connect(ctx.destination);
    snap.start(t0);
    snap.stop(t0 + 0.05);
    const chunk = ctx.createOscillator();
    const gChunk = ctx.createGain();
    chunk.type = 'square';
    chunk.frequency.setValueAtTime(210, t0);
    chunk.frequency.exponentialRampToValueAtTime(48, t0 + 0.088);
    gChunk.gain.setValueAtTime(g * 0.54, t0);
    gChunk.gain.exponentialRampToValueAtTime(0.01, t0 + 0.105);
    chunk.connect(gChunk);
    gChunk.connect(ctx.destination);
    chunk.start(t0);
    chunk.stop(t0 + 0.115);
    const ring = ctx.createOscillator();
    const gRing = ctx.createGain();
    ring.type = 'triangle';
    ring.frequency.value = 783.99;
    gRing.gain.setValueAtTime(0.001, t0 + 0.012);
    gRing.gain.exponentialRampToValueAtTime(g * 0.32, t0 + 0.024);
    gRing.gain.exponentialRampToValueAtTime(0.01, t0 + 0.11);
    ring.connect(gRing);
    gRing.connect(ctx.destination);
    ring.start(t0 + 0.012);
    ring.stop(t0 + 0.12);
    const spark = ctx.createOscillator();
    const gSpark = ctx.createGain();
    spark.type = 'sine';
    spark.frequency.setValueAtTime(1567.98, t0 + 0.022);
    spark.frequency.exponentialRampToValueAtTime(880, t0 + 0.09);
    gSpark.gain.setValueAtTime(0.001, t0 + 0.022);
    gSpark.gain.exponentialRampToValueAtTime(g * 0.15, t0 + 0.032);
    gSpark.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
    spark.connect(gSpark);
    gSpark.connect(ctx.destination);
    spark.start(t0 + 0.022);
    spark.stop(t0 + 0.105);
  }

  /** Magia de cura no líder (tom suave ascendente + brilho). */
  playSpellHeal(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.1);
    if (g <= 0) return;
    const notes = [
      { f: 392, t: 0, dur: 0.1 },
      { f: 523.25, t: 0.07, dur: 0.12 },
      { f: 659.25, t: 0.16, dur: 0.14 },
      { f: 783.99, t: 0.28, dur: 0.18 },
    ];
    for (const { f, t, dur } of notes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g * 0.55, t0 + t + 0.025);
      gn.gain.exponentialRampToValueAtTime(0.01, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.02);
    }
    const hum = ctx.createOscillator();
    const gHum = ctx.createGain();
    hum.type = 'triangle';
    hum.frequency.setValueAtTime(130.81, t0);
    hum.frequency.exponentialRampToValueAtTime(196, t0 + 0.35);
    gHum.gain.setValueAtTime(g * 0.18, t0);
    gHum.gain.exponentialRampToValueAtTime(0.01, t0 + 0.45);
    hum.connect(gHum);
    gHum.connect(ctx.destination);
    hum.start(t0);
    hum.stop(t0 + 0.48);
  }

  /** Poção consumida — sequência “glub glub” (goles). */
  playPotionDrink(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.4);
    if (g <= 0) return;
    const glugSteps = [0, 0.09, 0.19, 0.3];
    for (let i = 0; i < glugSteps.length; i++) {
      const st = t0 + glugSteps[i]!;
      const body = ctx.createOscillator();
      const gBody = ctx.createGain();
      body.type = 'triangle';
      body.frequency.setValueAtTime(165 + i * 12, st);
      body.frequency.exponentialRampToValueAtTime(72, st + 0.055);
      gBody.gain.setValueAtTime(0.001, st);
      gBody.gain.linearRampToValueAtTime(g * (0.38 - i * 0.05), st + 0.012);
      gBody.gain.exponentialRampToValueAtTime(0.01, st + 0.072);
      body.connect(gBody);
      gBody.connect(ctx.destination);
      body.start(st);
      body.stop(st + 0.08);
      const lip = ctx.createOscillator();
      const gLip = ctx.createGain();
      lip.type = 'sine';
      lip.frequency.setValueAtTime(520 + i * 40, st + 0.008);
      lip.frequency.exponentialRampToValueAtTime(240, st + 0.04);
      gLip.gain.setValueAtTime(0.001, st + 0.008);
      gLip.gain.linearRampToValueAtTime(g * 0.16, st + 0.018);
      gLip.gain.exponentialRampToValueAtTime(0.01, st + 0.055);
      lip.connect(gLip);
      gLip.connect(ctx.destination);
      lip.start(st + 0.008);
      lip.stop(st + 0.06);
    }
    const swallow = ctx.createOscillator();
    const gSw = ctx.createGain();
    swallow.type = 'sine';
    swallow.frequency.setValueAtTime(195, t0 + 0.38);
    swallow.frequency.exponentialRampToValueAtTime(110, t0 + 0.48);
    gSw.gain.setValueAtTime(0.001, t0 + 0.38);
    gSw.gain.linearRampToValueAtTime(g * 0.22, t0 + 0.395);
    gSw.gain.exponentialRampToValueAtTime(0.01, t0 + 0.52);
    swallow.connect(gSw);
    gSw.connect(ctx.destination);
    swallow.start(t0 + 0.38);
    swallow.stop(t0 + 0.54);
  }

  /** Buff de combate (Foco, Muralha, etc.) — sino curto e discreto. */
  playBuffCast(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.065);
    if (g <= 0) return;
    const freqs = [523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const st = t0 + i * 0.045;
      gn.gain.setValueAtTime(0.001, st);
      gn.gain.exponentialRampToValueAtTime(g * 0.42, st + 0.012);
      gn.gain.exponentialRampToValueAtTime(0.01, st + 0.11);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(st);
      o.stop(st + 0.13);
    });
  }

  /**
   * Foco de Guerreiro — aproximação de grito humano (ruído aspirado + pregas + peito),
   * sem sample; Web Audio só.
   */
  playWarriorsFocus(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.272);
    if (g <= 0) return;
    const dur = 0.64;
    const len = Math.ceil(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const samples = buf.getChannelData(0);
    for (let i = 0; i < len; i++) samples[i] = Math.random() * 2 - 1;

    const hi = ctx.createBufferSource();
    hi.buffer = buf;
    const bpHi = ctx.createBiquadFilter();
    bpHi.type = 'bandpass';
    bpHi.Q.value = 3.4;
    bpHi.frequency.setValueAtTime(3100, t0);
    bpHi.frequency.exponentialRampToValueAtTime(680, t0 + 0.52);
    const gHi = ctx.createGain();
    gHi.gain.setValueAtTime(0.001, t0);
    gHi.gain.linearRampToValueAtTime(g * 0.4, t0 + 0.038);
    gHi.gain.exponentialRampToValueAtTime(0.01, t0 + 0.6);
    hi.connect(bpHi);
    bpHi.connect(gHi);
    gHi.connect(ctx.destination);
    hi.start(t0);
    hi.stop(t0 + dur);

    const lo = ctx.createBufferSource();
    lo.buffer = buf;
    const bpLo = ctx.createBiquadFilter();
    bpLo.type = 'bandpass';
    bpLo.Q.value = 2.2;
    bpLo.frequency.setValueAtTime(520, t0 + 0.012);
    bpLo.frequency.exponentialRampToValueAtTime(200, t0 + 0.5);
    const gLo = ctx.createGain();
    gLo.gain.setValueAtTime(0.001, t0 + 0.012);
    gLo.gain.linearRampToValueAtTime(g * 0.22, t0 + 0.05);
    gLo.gain.exponentialRampToValueAtTime(0.01, t0 + 0.58);
    lo.connect(bpLo);
    bpLo.connect(gLo);
    gLo.connect(ctx.destination);
    lo.start(t0 + 0.012);
    lo.stop(t0 + dur);

    const fold = ctx.createOscillator();
    const lpFold = ctx.createBiquadFilter();
    lpFold.type = 'lowpass';
    lpFold.Q.value = 0.85;
    lpFold.frequency.setValueAtTime(3800, t0 + 0.016);
    lpFold.frequency.exponentialRampToValueAtTime(900, t0 + 0.5);
    fold.type = 'sawtooth';
    fold.frequency.setValueAtTime(410, t0 + 0.016);
    fold.frequency.exponentialRampToValueAtTime(92, t0 + 0.52);
    const gFold = ctx.createGain();
    gFold.gain.setValueAtTime(0.001, t0 + 0.016);
    gFold.gain.linearRampToValueAtTime(g * 0.13, t0 + 0.06);
    gFold.gain.exponentialRampToValueAtTime(0.01, t0 + 0.58);
    fold.connect(lpFold);
    lpFold.connect(gFold);
    gFold.connect(ctx.destination);
    fold.start(t0 + 0.016);
    fold.stop(t0 + 0.6);
  }

  /** Armadura inimiga quebrada (estilhaço / cristal). */
  playArmorShatter(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.085);
    if (g <= 0) return;
    const crack = ctx.createOscillator();
    const gCrack = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(4200, t0);
    crack.frequency.exponentialRampToValueAtTime(900, t0 + 0.045);
    gCrack.gain.setValueAtTime(g * 0.35, t0);
    gCrack.gain.exponentialRampToValueAtTime(0.01, t0 + 0.08);
    crack.connect(gCrack);
    gCrack.connect(ctx.destination);
    crack.start(t0);
    crack.stop(t0 + 0.09);
    const shard = ctx.createOscillator();
    const gShard = ctx.createGain();
    shard.type = 'triangle';
    shard.frequency.setValueAtTime(2400, t0 + 0.012);
    shard.frequency.exponentialRampToValueAtTime(400, t0 + 0.06);
    gShard.gain.setValueAtTime(g * 0.22, t0 + 0.012);
    gShard.gain.exponentialRampToValueAtTime(0.01, t0 + 0.07);
    shard.connect(gShard);
    gShard.connect(ctx.destination);
    shard.start(t0 + 0.012);
    shard.stop(t0 + 0.075);
  }

  /** Golpe que abate o inimigo (uma vez por fatia de log). */
  playLethalStrike(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.45);
    if (g <= 0) return;
    const crack = ctx.createOscillator();
    const gCrack = ctx.createGain();
    crack.type = 'square';
    crack.frequency.setValueAtTime(3200, t0);
    crack.frequency.exponentialRampToValueAtTime(420, t0 + 0.038);
    gCrack.gain.setValueAtTime(g * 0.34, t0);
    gCrack.gain.exponentialRampToValueAtTime(0.01, t0 + 0.055);
    crack.connect(gCrack);
    gCrack.connect(ctx.destination);
    crack.start(t0);
    crack.stop(t0 + 0.06);
    const thud = ctx.createOscillator();
    const gThud = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(82, t0);
    thud.frequency.exponentialRampToValueAtTime(28, t0 + 0.18);
    gThud.gain.setValueAtTime(g * 0.78, t0);
    gThud.gain.exponentialRampToValueAtTime(0.01, t0 + 0.26);
    thud.connect(gThud);
    gThud.connect(ctx.destination);
    thud.start(t0);
    thud.stop(t0 + 0.28);
    const knell = ctx.createOscillator();
    const gKnell = ctx.createGain();
    knell.type = 'triangle';
    knell.frequency.setValueAtTime(147, t0 + 0.055);
    knell.frequency.exponentialRampToValueAtTime(98, t0 + 0.38);
    gKnell.gain.setValueAtTime(0.001, t0 + 0.055);
    gKnell.gain.exponentialRampToValueAtTime(g * 0.32, t0 + 0.075);
    gKnell.gain.exponentialRampToValueAtTime(0.01, t0 + 0.42);
    knell.connect(gKnell);
    gKnell.connect(ctx.destination);
    knell.start(t0 + 0.055);
    knell.stop(t0 + 0.44);
    const snuff = ctx.createOscillator();
    const gSnuff = ctx.createGain();
    snuff.type = 'sine';
    snuff.frequency.setValueAtTime(880, t0 + 0.028);
    snuff.frequency.exponentialRampToValueAtTime(220, t0 + 0.14);
    gSnuff.gain.setValueAtTime(0.001, t0 + 0.028);
    gSnuff.gain.exponentialRampToValueAtTime(g * 0.12, t0 + 0.04);
    gSnuff.gain.exponentialRampToValueAtTime(0.01, t0 + 0.16);
    snuff.connect(gSnuff);
    gSnuff.connect(ctx.destination);
    snuff.start(t0 + 0.028);
    snuff.stop(t0 + 0.17);
  }

  /** Erro / falha leve (ataque falha, sorte má) */
  playMiss(): void {
    this.playTone(220, 0.08, 0.15, 'triangle');
    this.playTone(140, 0.12, 0.14, 'sine');
  }

  /** Dano recebido pelo herói */
  playDamageTaken(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.09);
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
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.08);
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
    this.playTone(100, 0.25, 0.07, 'sawtooth');
    this.playTone(80, 0.25, 0.05, 'sine');
  }

  /** Teste passou (leve) */
  playCheckSuccess(): void {
    this.playTone(660, 0.06, 0.05, 'sine');
    this.playTone(880, 0.08, 0.04, 'sine');
  }

  /** Descanso no acampamento — acorde suave (recuperação). */
  playCampRest(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.18);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const freqs = [130.81, 261.63, 329.63, 392.0];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0);
      gn.gain.exponentialRampToValueAtTime(g * (f < 200 ? 0.35 : 0.42), t0 + 0.06);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + 0.52);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + 1.55);
    }
  }

  /** Virada de dia narrativo — graves lentos, descida suave (tempo que pesa, não fanfarra). */
  playDayAdvance(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.42);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const notes: Array<{ f: number; t: number; dur: number }> = [
      { f: 196.0, t: 0, dur: 1.15 },
      { f: 174.61, t: 0.95, dur: 1.25 },
      { f: 155.56, t: 2.05, dur: 1.35 },
    ];
    for (const { f, t, dur } of notes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      const start = t0 + t;
      gn.gain.setValueAtTime(0.001, start);
      gn.gain.exponentialRampToValueAtTime(g * 0.9, start + 0.28);
      gn.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(start);
      o.stop(start + dur + 0.08);
    }
  }

  /** Item novo no inventário (fanfarra curta em três notas). */
  playItemAcquire(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.17);
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
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.15);
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
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.15);
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
   * Promoção de arquétipo narrativo — graves em serra + ressonância menor (distinto da subida de nível).
   */
  playPathPromotion(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.24);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const lows = [
      { f: 155.56, t: 0, dur: 0.32 },
      { f: 184.99, t: 0.2, dur: 0.38 },
    ];
    for (const { f, t, dur } of lows) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      const start = t0 + t;
      gn.gain.setValueAtTime(0.001, start);
      gn.gain.exponentialRampToValueAtTime(g * 0.32, start + 0.05);
      gn.gain.exponentialRampToValueAtTime(0.001, start + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(start);
      o.stop(start + dur + 0.06);
    }
    const ringT = t0 + 0.48;
    for (const f of [311.13, 415.3, 523.25]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, ringT);
      gn.gain.exponentialRampToValueAtTime(g * 0.48, ringT + 0.04);
      gn.gain.exponentialRampToValueAtTime(0.001, ringT + 0.8);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(ringT);
      o.stop(ringT + 0.85);
    }
  }

  /** Fanfarra curta ao subir de nível (após vitória). */
  playLevelUpCelebration(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.15);
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

  /** Fuga bem-sucedida — passos rápidos ascendentes + ressonância curta (não é derrota). */
  playFlee(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.12);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    const steps: { f: number; t: number; dur: number }[] = [
      { f: 220.0, t: 0, dur: 0.06 },
      { f: 277.18, t: 0.07, dur: 0.06 },
      { f: 349.23, t: 0.15, dur: 0.07 },
      { f: 440.0, t: 0.25, dur: 0.08 },
    ];
    for (const { f, t, dur } of steps) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g, t0 + t + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.03);
    }
    const ringT = t0 + 0.38;
    for (const f of [523.25, 659.25]) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, ringT);
      gn.gain.exponentialRampToValueAtTime(g * 0.35, ringT + 0.04);
      gn.gain.exponentialRampToValueAtTime(0.001, ringT + 0.35);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(ringT);
      o.stop(ringT + 0.4);
    }
  }

  /**
   * Derrota / fim de combate mau — descida lenta em sol menor, com legato e sub-grave no fim.
   */
  playDefeat(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.15);
    if (g <= 0) return;
    const t0 = ctx.currentTime;
    // G4 → G3 (escala menor natural), notas sobrepostas para frase mais longa e melancólica
    const notes: { f: number; t: number; dur: number }[] = [
      { f: 392.0, t: 0, dur: 0.58 },
      { f: 349.23, t: 0.3, dur: 0.62 },
      { f: 311.13, t: 0.64, dur: 0.65 },
      { f: 293.66, t: 1.0, dur: 0.68 },
      { f: 261.63, t: 1.38, dur: 0.72 },
      { f: 233.08, t: 1.8, dur: 0.78 },
      { f: 196.0, t: 2.28, dur: 0.95 },
    ];
    for (const { f, t, dur } of notes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g * 0.78, t0 + t + 0.05);
      gn.gain.exponentialRampToValueAtTime(g * 0.42, t0 + t + dur * 0.45);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.05);
    }
    const subNotes: { f: number; t: number; dur: number }[] = [
      { f: 130.81, t: 1.38, dur: 0.75 },
      { f: 116.54, t: 1.8, dur: 0.82 },
      { f: 98.0, t: 2.28, dur: 1.05 },
    ];
    for (const { f, t, dur } of subNotes) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      gn.gain.setValueAtTime(0.001, t0 + t);
      gn.gain.exponentialRampToValueAtTime(g * 0.28, t0 + t + 0.12);
      gn.gain.exponentialRampToValueAtTime(g * 0.14, t0 + t + dur * 0.5);
      gn.gain.exponentialRampToValueAtTime(0.001, t0 + t + dur);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(t0 + t);
      o.stop(t0 + t + dur + 0.06);
    }
  }

  /**
   * Clique seco de ferrolho/chave, pausa curta, rangido de porta (triângulo + atrito).
   * Overlay `artHighlightSfx: door_open`.
   */
  playDoorOpen(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.17);
    if (g <= 0) return;

    const click = ctx.createOscillator();
    const gClick = ctx.createGain();
    click.type = 'square';
    click.frequency.value = 540;
    gClick.gain.setValueAtTime(0.001, t0);
    gClick.gain.linearRampToValueAtTime(g * 0.52, t0 + 0.002);
    gClick.gain.exponentialRampToValueAtTime(0.01, t0 + 0.016);
    click.connect(gClick);
    gClick.connect(ctx.destination);
    click.start(t0);
    click.stop(t0 + 0.02);

    const clickHi = ctx.createOscillator();
    const gHi = ctx.createGain();
    clickHi.type = 'sine';
    clickHi.frequency.value = 2260;
    gHi.gain.setValueAtTime(0.001, t0);
    gHi.gain.linearRampToValueAtTime(g * 0.14, t0 + 0.0015);
    gHi.gain.exponentialRampToValueAtTime(0.01, t0 + 0.008);
    clickHi.connect(gHi);
    gHi.connect(ctx.destination);
    clickHi.start(t0);
    clickHi.stop(t0 + 0.012);

    const creakStart = t0 + 0.052;
    const creakEnd = creakStart + 0.78;
    const door = ctx.createOscillator();
    const gDoor = ctx.createGain();
    door.type = 'triangle';
    door.frequency.setValueAtTime(128, creakStart);
    door.frequency.exponentialRampToValueAtTime(54, creakEnd);
    gDoor.gain.setValueAtTime(0.001, creakStart);
    gDoor.gain.linearRampToValueAtTime(g * 0.48, creakStart + 0.1);
    gDoor.gain.linearRampToValueAtTime(g * 0.34, creakStart + 0.26);
    gDoor.gain.linearRampToValueAtTime(g * 0.58, creakStart + 0.44);
    gDoor.gain.linearRampToValueAtTime(g * 0.3, creakStart + 0.62);
    gDoor.gain.exponentialRampToValueAtTime(0.01, creakEnd + 0.08);
    door.connect(gDoor);
    gDoor.connect(ctx.destination);
    door.start(creakStart);
    door.stop(creakEnd + 0.1);

    const hinge = ctx.createOscillator();
    const gHg = ctx.createGain();
    hinge.type = 'triangle';
    hinge.frequency.setValueAtTime(248, creakStart + 0.03);
    hinge.frequency.exponentialRampToValueAtTime(108, creakEnd - 0.04);
    gHg.gain.setValueAtTime(0.001, creakStart + 0.03);
    gHg.gain.linearRampToValueAtTime(g * 0.16, creakStart + 0.12);
    gHg.gain.exponentialRampToValueAtTime(0.01, creakEnd + 0.02);
    hinge.connect(gHg);
    gHg.connect(ctx.destination);
    hinge.start(creakStart + 0.03);
    hinge.stop(creakEnd + 0.05);

    const scrapeDur = 0.72;
    const scrapeLen = Math.ceil(ctx.sampleRate * scrapeDur);
    const scrapeBuf = ctx.createBuffer(1, scrapeLen, ctx.sampleRate);
    const sc = scrapeBuf.getChannelData(0);
    for (let i = 0; i < scrapeLen; i++) sc[i] = Math.random() * 2 - 1;
    const scrape = ctx.createBufferSource();
    scrape.buffer = scrapeBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 1.15;
    bp.frequency.setValueAtTime(420, creakStart + 0.04);
    bp.frequency.exponentialRampToValueAtTime(130, creakEnd - 0.02);
    const gSc = ctx.createGain();
    gSc.gain.setValueAtTime(0.001, creakStart + 0.04);
    gSc.gain.linearRampToValueAtTime(g * 0.28, creakStart + 0.14);
    gSc.gain.linearRampToValueAtTime(g * 0.36, creakStart + 0.38);
    gSc.gain.exponentialRampToValueAtTime(0.01, creakEnd + 0.04);
    scrape.connect(bp);
    bp.connect(gSc);
    gSc.connect(ctx.destination);
    scrape.start(creakStart + 0.04);
    scrape.stop(creakEnd + 0.06);
  }

  /**
   * Grave com subida lenta, par de batimento suave e linha de sinos ao longo da cauda (~3s).
   * Overlay `artHighlightSfx: mysterious`.
   */
  playMysteriousHighlight(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.14);
    if (g <= 0) return;
    const end = t0 + 3.05;

    const hum = ctx.createOscillator();
    const gHum = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(52, t0);
    hum.frequency.exponentialRampToValueAtTime(61, t0 + 0.78);
    hum.frequency.exponentialRampToValueAtTime(48, end - 0.22);
    gHum.gain.setValueAtTime(0.001, t0);
    gHum.gain.exponentialRampToValueAtTime(g * 0.38, t0 + 0.55);
    gHum.gain.exponentialRampToValueAtTime(g * 0.44, t0 + 1.35);
    gHum.gain.exponentialRampToValueAtTime(0.001, end);
    hum.connect(gHum);
    gHum.connect(ctx.destination);
    hum.start(t0);
    hum.stop(end + 0.04);

    const humBeat = ctx.createOscillator();
    const gBeat = ctx.createGain();
    humBeat.type = 'sine';
    humBeat.frequency.setValueAtTime(52.6, t0);
    humBeat.frequency.exponentialRampToValueAtTime(61.7, t0 + 0.78);
    humBeat.frequency.exponentialRampToValueAtTime(48.6, end - 0.22);
    gBeat.gain.setValueAtTime(0.001, t0);
    gBeat.gain.exponentialRampToValueAtTime(g * 0.22, t0 + 0.58);
    gBeat.gain.exponentialRampToValueAtTime(g * 0.26, t0 + 1.42);
    gBeat.gain.exponentialRampToValueAtTime(0.001, end);
    humBeat.connect(gBeat);
    gBeat.connect(ctx.destination);
    humBeat.start(t0);
    humBeat.stop(end + 0.04);

    const sub = ctx.createOscillator();
    const gSub = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(26, t0);
    sub.frequency.exponentialRampToValueAtTime(30.5, t0 + 0.78);
    sub.frequency.exponentialRampToValueAtTime(24, end - 0.28);
    gSub.gain.setValueAtTime(0.001, t0);
    gSub.gain.exponentialRampToValueAtTime(g * 0.2, t0 + 0.62);
    gSub.gain.exponentialRampToValueAtTime(0.001, end);
    sub.connect(gSub);
    gSub.connect(ctx.destination);
    sub.start(t0);
    sub.stop(end + 0.04);

    const chimeT = t0 + 0.08;
    const chimeEnd = chimeT + 2.52;
    const partials: { f: number; w: number; at: number }[] = [
      { f: 523.25, w: 0.11, at: 0 },
      { f: 783.99, w: 0.08, at: 0.012 },
      { f: 1046.5, w: 0.055, at: 0.022 },
      { f: 1318.51, w: 0.038, at: 0.03 },
      { f: 622.26, w: 0.058, at: 0.14 },
      { f: 392.0, w: 0.045, at: 0.34 },
      { f: 349.23, w: 0.038, at: 0.52 },
      { f: 698.46, w: 0.032, at: 0.7 },
      { f: 466.16, w: 0.033, at: 0.9 },
      { f: 587.33, w: 0.028, at: 1.12 },
      { f: 440.0, w: 0.026, at: 1.34 },
      { f: 493.88, w: 0.023, at: 1.58 },
      { f: 523.25, w: 0.02, at: 1.82 },
    ];
    for (const { f, w, at } of partials) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const s = chimeT + at;
      gn.gain.setValueAtTime(0.001, s);
      gn.gain.exponentialRampToValueAtTime(g * w, s + 0.034);
      gn.gain.exponentialRampToValueAtTime(g * w * 0.38, s + 0.42);
      gn.gain.exponentialRampToValueAtTime(0.001, chimeEnd);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(s);
      o.stop(chimeEnd + 0.02);
    }

    const airDur = 0.48;
    const airLen = Math.ceil(ctx.sampleRate * airDur);
    const airBuf = ctx.createBuffer(1, airLen, ctx.sampleRate);
    const air = airBuf.getChannelData(0);
    for (let i = 0; i < airLen; i++) air[i] = Math.random() * 2 - 1;
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = airBuf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4200, t0);
    lp.frequency.exponentialRampToValueAtTime(1100, t0 + airDur);
    const gAir = ctx.createGain();
    gAir.gain.setValueAtTime(0.001, t0);
    gAir.gain.linearRampToValueAtTime(g * 0.07, t0 + 0.06);
    gAir.gain.exponentialRampToValueAtTime(0.001, t0 + airDur);
    airSrc.connect(hp);
    hp.connect(lp);
    lp.connect(gAir);
    gAir.connect(ctx.destination);
    airSrc.start(t0);
    airSrc.stop(t0 + airDur + 0.02);
  }

  /** Twist de boss — abertura “sino” inharmónico (senos, sensação errada) + três acordes dissonantes. */
  playBossTwistRevelation(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.32);
    if (g <= 0) return;
    const t0 = ctx.currentTime;

    const openEnd = t0 + 0.34;
    const unBell: { f: number; delay: number; w: number }[] = [
      { f: 616.5, delay: 0, w: 0.26 },
      { f: 971.2, delay: 0.01, w: 0.21 },
      { f: 1290.0, delay: 0.019, w: 0.17 },
      { f: 1744.0, delay: 0.028, w: 0.14 },
    ];
    for (const { f, delay, w } of unBell) {
      const o = ctx.createOscillator();
      const gn = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const s = t0 + delay;
      gn.gain.setValueAtTime(0.001, s);
      gn.gain.exponentialRampToValueAtTime(g * w, s + 0.032);
      gn.gain.exponentialRampToValueAtTime(0.001, openEnd);
      o.connect(gn);
      gn.connect(ctx.destination);
      o.start(s);
      o.stop(openEnd + 0.025);
    }

    const chordHits: { at: number; tail: number; freqs: { f: number; w: number }[] }[] = [
      {
        at: 0.09,
        tail: 0.52,
        freqs: [
          { f: 311.13, w: 0.34 },
          { f: 329.63, w: 0.34 },
          { f: 392.0, w: 0.3 },
          { f: 466.16, w: 0.26 },
        ],
      },
      {
        at: 0.38,
        tail: 0.5,
        freqs: [
          { f: 293.66, w: 0.32 },
          { f: 311.13, w: 0.32 },
          { f: 369.99, w: 0.28 },
          { f: 440.0, w: 0.24 },
        ],
      },
      {
        at: 0.7,
        tail: 0.62,
        freqs: [
          { f: 277.18, w: 0.3 },
          { f: 293.66, w: 0.3 },
          { f: 349.23, w: 0.28 },
          { f: 415.3, w: 0.26 },
        ],
      },
    ];
    for (const hit of chordHits) {
      const ringT = t0 + hit.at;
      const endT = ringT + hit.tail;
      for (const { f, w } of hit.freqs) {
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        gn.gain.setValueAtTime(0.001, ringT);
        gn.gain.exponentialRampToValueAtTime(g * w, ringT + 0.04);
        gn.gain.exponentialRampToValueAtTime(0.001, endT);
        o.connect(gn);
        gn.connect(ctx.destination);
        o.start(ringT);
        o.stop(endT + 0.04);
      }
    }
  }

  private playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(vol);
    playOneShotTone(ctx, ctx.destination, freq, dur, g, type);
  }
}
