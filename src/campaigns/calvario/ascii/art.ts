import { ACT1_SCENE_ART } from './scenes/act1.ts';
import { ACT2_SCENE_ART } from './scenes/act2.ts';
import { ACT3_SCENE_ART } from './scenes/act3.ts';
import { ACT4_SCENE_ART } from './scenes/act4.ts';
import { ACT5_SCENE_ART } from './scenes/act5.ts';
import { ACT6_SCENE_ART } from './scenes/act6.ts';
import { CORE_SCENE_ART } from './scenes/core.ts';

/** Arte ASCII reutilizável — paisagens e cenas (artKey no frontmatter). */
export const SCENE_ART: Record<string, string> = {
  ...CORE_SCENE_ART,
  ...ACT1_SCENE_ART,
  ...ACT2_SCENE_ART,
  ...ACT3_SCENE_ART,
  ...ACT4_SCENE_ART,
  ...ACT5_SCENE_ART,
  ...ACT6_SCENE_ART,
};
