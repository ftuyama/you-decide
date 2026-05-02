import { GameAmbientPlayer } from './gameAudioAmbient.ts';
import type { GameAudioHost } from './gameAudioHost.ts';
import { GameSfxPlayer } from './gameAudioSfx.ts';
import type { AmbientTheme } from '../types.ts';

/**
 * Audio retro: tons simples + música de fundo procedural (Web Audio).
 * Implementação dividida em `GameSfxPlayer` (efeitos) e `GameAmbientPlayer` (temas).
 */
export class GameAudio {
  private readonly storageVolumeKey: string;
  private ctx: AudioContext | null = null;
  /** 0–1, aplicado a todos os ganhos (música ambiente + efeitos). */
  private volume = 1;
  private readonly ambient: GameAmbientPlayer;
  private readonly sfx: GameSfxPlayer;

  constructor(campaignId: string) {
    this.storageVolumeKey = `${campaignId}_sound_volume`;
    try {
      const raw = localStorage.getItem(this.storageVolumeKey);
      if (raw != null) {
        const n = Number.parseFloat(raw);
        if (Number.isFinite(n)) {
          this.volume = Math.min(1, Math.max(0, n));
        }
      }
    } catch {
      /* noop */
    }

    const host: GameAudioHost = {
      ensureContext: () => this.ensureContext(),
      gain: (base: number) => this.gain(base),
      getAudioContext: () => this.ctx,
    };
    this.ambient = new GameAmbientPlayer(host);
    this.sfx = new GameSfxPlayer(host);
  }

  /** Volume linear 0–1 (persistido em `localStorage`). */
  getVolume(): number {
    return this.volume;
  }

  setVolume(v: number): void {
    const n = Math.min(1, Math.max(0, v));
    this.volume = n;
    try {
      localStorage.setItem(this.storageVolumeKey, String(n));
    } catch {
      /* noop */
    }
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
    this.ambient.startWhenReady();
  }

  /** Troca a música de fundo (idempotente se já for o mesmo tema). */
  setAmbientTheme(theme: AmbientTheme): void {
    this.ambient.setTheme(theme);
  }

  getAmbientTheme(): AmbientTheme | null {
    return this.ambient.getTheme();
  }

  stopAmbient(): void {
    this.ambient.stop();
  }

  playUiClick(): void {
    this.sfx.playUiClick();
  }

  playBlocked(): void {
    this.sfx.playBlocked();
  }

  playDice(): void {
    this.sfx.playDice();
  }

  playHit(): void {
    this.sfx.playHit();
  }

  playSwordSlash(): void {
    this.sfx.playSwordSlash();
  }

  playBluntImpact(): void {
    this.sfx.playBluntImpact();
  }

  playStaffWhoosh(): void {
    this.sfx.playStaffWhoosh();
  }

  playSpellFire(): void {
    this.sfx.playSpellFire();
  }

  playSpellArcaneBurst(): void {
    this.sfx.playSpellArcaneBurst();
  }

  playSpellIceSpark(): void {
    this.sfx.playSpellIceSpark();
  }

  playCritImpact(): void {
    this.sfx.playCritImpact();
  }

  playSpellHeal(): void {
    this.sfx.playSpellHeal();
  }

  playPotionDrink(): void {
    this.sfx.playPotionDrink();
  }

  playBuffCast(): void {
    this.sfx.playBuffCast();
  }

  playWarriorsFocus(): void {
    this.sfx.playWarriorsFocus();
  }

  playArmorShatter(): void {
    this.sfx.playArmorShatter();
  }

  playLethalStrike(): void {
    this.sfx.playLethalStrike();
  }

  playMiss(): void {
    this.sfx.playMiss();
  }

  playDamageTaken(): void {
    this.sfx.playDamageTaken();
  }

  playStressSting(): void {
    this.sfx.playStressSting();
  }

  playCheckFail(): void {
    this.sfx.playCheckFail();
  }

  playCheckSuccess(): void {
    this.sfx.playCheckSuccess();
  }

  playCampRest(): void {
    this.sfx.playCampRest();
  }

  playDayAdvance(): void {
    this.sfx.playDayAdvance();
  }

  playItemAcquire(): void {
    this.sfx.playItemAcquire();
  }

  playFaithMiracle(): void {
    this.sfx.playFaithMiracle();
  }

  playVictory(): void {
    this.sfx.playVictory();
  }

  playLevelUpCelebration(): void {
    this.sfx.playLevelUpCelebration();
  }

  /** Arquétipo narrativo desbloqueado (ex.: Cavaleiro caído). */
  playPathPromotion(): void {
    this.sfx.playPathPromotion();
  }

  playDefeat(): void {
    this.sfx.playDefeat();
  }

  playFlee(): void {
    this.sfx.playFlee();
  }

  playBossTwistRevelation(): void {
    this.sfx.playBossTwistRevelation();
  }

  private gain(base: number): number {
    return base * this.volume;
  }
}
