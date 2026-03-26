import { ACT1_SCENE_ART } from './scenes/act1';
import { ACT2_SCENE_ART } from './scenes/act2';
import { ACT3_SCENE_ART } from './scenes/act3';
import { ACT4_SCENE_ART } from './scenes/act4';
import { ACT5_SCENE_ART } from './scenes/act5';
import { ACT6_SCENE_ART } from './scenes/act6';
import { CORE_SCENE_ART } from './scenes/core';

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
