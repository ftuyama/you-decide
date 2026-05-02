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

  playBlocked(): void {
    this.playTone(90, 0.06, 0.05, 'sine');
  }

  playDice(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.07);
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
    const g = this.host.gain(0.08);
    if (g <= 0) return;
    const o = ctx.createOscillator();
    const gn = ctx.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(180, t0);
    o.frequency.exponentialRampToValueAtTime(45, t0 + 0.08);
    gn.gain.setValueAtTime(g * 0.6, t0);
    gn.gain.exponentialRampToValueAtTime(0.01, t0 + 0.1);
    o.connect(gn);
    gn.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + 0.11);
    const ping = ctx.createOscillator();
    const gPing = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.value = 660;
    gPing.gain.setValueAtTime(0.001, t0 + 0.02);
    gPing.gain.exponentialRampToValueAtTime(this.host.gain(0.05), t0 + 0.028);
    gPing.gain.exponentialRampToValueAtTime(0.01, t0 + 0.09);
    ping.connect(gPing);
    gPing.connect(ctx.destination);
    ping.start(t0 + 0.02);
    ping.stop(t0 + 0.1);
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

  /** Foco de Guerreiro — corte seco + tensão (diferente do sino mágico de outros buffs). */
  playWarriorsFocus(): void {
    const ctx = this.host.ensureContext();
    const t0 = ctx.currentTime;
    const g = this.host.gain(0.072);
    if (g <= 0) return;
    const edge = ctx.createOscillator();
    const gEdge = ctx.createGain();
    edge.type = 'square';
    edge.frequency.setValueAtTime(380, t0);
    edge.frequency.exponentialRampToValueAtTime(140, t0 + 0.038);
    gEdge.gain.setValueAtTime(g * 0.38, t0);
    gEdge.gain.exponentialRampToValueAtTime(0.01, t0 + 0.055);
    edge.connect(gEdge);
    gEdge.connect(ctx.destination);
    edge.start(t0);
    edge.stop(t0 + 0.06);
    const rush = ctx.createOscillator();
    const gRush = ctx.createGain();
    rush.type = 'sawtooth';
    rush.frequency.setValueAtTime(420, t0 + 0.012);
    rush.frequency.exponentialRampToValueAtTime(110, t0 + 0.1);
    gRush.gain.setValueAtTime(0.001, t0 + 0.012);
    gRush.gain.exponentialRampToValueAtTime(g * 0.32, t0 + 0.022);
    gRush.gain.exponentialRampToValueAtTime(0.01, t0 + 0.12);
    rush.connect(gRush);
    gRush.connect(ctx.destination);
    rush.start(t0 + 0.012);
    rush.stop(t0 + 0.13);
    const ping = ctx.createOscillator();
    const gPing = ctx.createGain();
    ping.type = 'triangle';
    ping.frequency.value = 247.31;
    gPing.gain.setValueAtTime(0.001, t0 + 0.04);
    gPing.gain.exponentialRampToValueAtTime(g * 0.28, t0 + 0.05);
    gPing.gain.exponentialRampToValueAtTime(0.01, t0 + 0.11);
    ping.connect(gPing);
    gPing.connect(ctx.destination);
    ping.start(t0 + 0.04);
    ping.stop(t0 + 0.12);
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
    const g = this.host.gain(0.055);
    if (g <= 0) return;
    const thud = ctx.createOscillator();
    const gThud = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(95, t0);
    thud.frequency.exponentialRampToValueAtTime(38, t0 + 0.14);
    gThud.gain.setValueAtTime(g * 0.75, t0);
    gThud.gain.exponentialRampToValueAtTime(0.01, t0 + 0.2);
    thud.connect(gThud);
    gThud.connect(ctx.destination);
    thud.start(t0);
    thud.stop(t0 + 0.22);
    const tail = ctx.createOscillator();
    const gTail = ctx.createGain();
    tail.type = 'triangle';
    tail.frequency.value = 330;
    gTail.gain.setValueAtTime(0.001, t0 + 0.04);
    gTail.gain.exponentialRampToValueAtTime(g * 0.2, t0 + 0.055);
    gTail.gain.exponentialRampToValueAtTime(0.01, t0 + 0.16);
    tail.connect(gTail);
    gTail.connect(ctx.destination);
    tail.start(t0 + 0.04);
    tail.stop(t0 + 0.17);
  }

  /** Erro / falha leve (ataque falha, sorte má) */
  playMiss(): void {
    this.playTone(220, 0.08, 0.05, 'triangle');
    this.playTone(140, 0.12, 0.04, 'sine');
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
    this.playTone(100, 0.15, 0.07, 'sawtooth');
    this.playTone(80, 0.2, 0.05, 'sine');
  }

  /** Teste passou (leve) */
  playCheckSuccess(): void {
    this.playTone(660, 0.06, 0.05, 'sine');
    this.playTone(880, 0.08, 0.04, 'sine');
  }

  /** Descanso no acampamento — acorde suave (recuperação). */
  playCampRest(): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(0.08);
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
      o.stop(t0 + 0.55);
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
    const g = this.host.gain(0.07);
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
  private playTone(freq: number, dur: number, vol: number, type: OscillatorType = 'sine'): void {
    const ctx = this.host.ensureContext();
    const g = this.host.gain(vol);
    playOneShotTone(ctx, ctx.destination, freq, dur, g, type);
  }
}
