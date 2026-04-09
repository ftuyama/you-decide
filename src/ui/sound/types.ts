export type AmbientTheme =
  | 'explore'
  | 'combat'
  | 'camp'
  | 'boss'
  | 'act3'
  | 'act5'
  | 'frost_mystery'
  | 'merchant'
  | 'void'
  | 'ancient_macabre';

/** Lista canónica (alinhada ao switch em `GameAudio` e ao YAML `ambientTheme`). */
export const AMBIENT_THEMES: readonly AmbientTheme[] = [
  'explore',
  'combat',
  'camp',
  'boss',
  'act3',
  'act5',
  'frost_mystery',
  'merchant',
  'void',
  'ancient_macabre',
];
