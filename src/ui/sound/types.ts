export type AmbientTheme =
  | 'explore'
  | 'act2'
  | 'combat'
  | 'combat_rival'
  | 'dialogue_combat'
  | 'camp'
  | 'boss'
  | 'act3'
  | 'act5'
  | 'frost_mystery'
  | 'merchant'
  | 'void'
  | 'ancient_macabre'
  | 'ash_sky';

/** Lista canónica (alinhada ao switch em `gameAudio/GameAmbientPlayer` e ao YAML `ambientTheme`). */
export const AMBIENT_THEMES: readonly AmbientTheme[] = [
  'explore',
  'act2',
  'combat',
  'combat_rival',
  'dialogue_combat',
  'camp',
  'boss',
  'act3',
  'act5',
  'frost_mystery',
  'merchant',
  'void',
  'ancient_macabre',
  'ash_sky',
];
