import type { DialogueEnemyDef } from '../../../../engine/schema/index.ts';
import { act1_mirror_twin } from './act1_mirror_twin.ts';
import {
  act2_circulo_envoy_verbal,
  act2_culto_envoy_verbal,
  act2_vigilia_envoy_verbal,
} from './act2_envoy_hostile_verbal.ts';
import { act3_cult_negotiate_verbal } from './act3_cult_negotiate_verbal.ts';
import { act4_morvayn_parley } from './act4_morvayn_parley.ts';
import { act6_mirror_sovereign_verbal } from './act6_mirror_sovereign_verbal.ts';
import {
  kael_rival_act2_verbal,
  kael_rival_act4_verbal,
  kael_rival_act5_verbal,
  kael_rival_act6_verbal,
} from './kael_rival_verbal.ts';

export const dialogueEnemies: Record<string, DialogueEnemyDef> = {
  act1_mirror_twin,
  act2_vigilia_envoy_verbal,
  act2_circulo_envoy_verbal,
  act2_culto_envoy_verbal,
  act3_cult_negotiate_verbal,
  act4_morvayn_parley,
  act6_mirror_sovereign_verbal,
  kael_rival_act2_verbal,
  kael_rival_act4_verbal,
  kael_rival_act5_verbal,
  kael_rival_act6_verbal,
};
