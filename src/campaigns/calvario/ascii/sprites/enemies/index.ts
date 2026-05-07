import { ENEMY_SPRITES } from '../../enemySprites.ts';

const S = (key: string): string => {
  const v = ENEMY_SPRITES[key];
  if (v === undefined) throw new Error(`Missing enemy sprite: ${key}`);
  return v;
};

export const act1_rat_swarm = { sprite: S('act1_rat_swarm') };
export const act2_skeleton = { sprite: S('act2_skeleton') };
export const act2_cultist = { sprite: S('act2_cultist') };
export const act2_fallen_angel = { sprite: S('act2_fallen_angel') };
export const act3_stone_guard = { sprite: S('act3_stone_guard') };
export const elemental_golem = { sprite: S('elemental_golem') };
export const act4_morvayn_p1 = { sprite: S('act4_morvayn_p1') };
export const act4_morvayn_p2 = { sprite: S('act4_morvayn_p2') };
export const act4_vigil_hunter = { sprite: S('act4_vigil_hunter') };
export const rival_kael = { sprite: S('rival_kael') };
export const act5_frost_whelp = { sprite: S('act5_frost_whelp') };
export const act5_frost_reaver = { sprite: S('act5_frost_reaver') };
export const act5_ice_dragon_p1 = { sprite: S('act5_ice_dragon_p1') };
export const act5_ice_dragon_p2 = { sprite: S('act5_ice_dragon_p2') };
export const act5_summit_fallen_god = { sprite: S('act5_summit_fallen_god') };
export const act6_veil_herald = { sprite: S('act6_veil_herald') };
export const act6_echo_chorus = { sprite: S('act6_echo_chorus') };
export const act6_penitent_blade = { sprite: S('act6_penitent_blade') };
export const act6_shadow_self = { sprite: S('act6_shadow_self') };
export const act6_shade_fragment = { sprite: S('act6_shade_fragment') };
export const act6_wild_splinter = { sprite: S('act6_wild_splinter') };
export const act6_wild_veil_scribe = { sprite: S('act6_wild_veil_scribe') };
export const act6_wild_murmur_host = { sprite: S('act6_wild_murmur_host') };
export const act6_wild_chain_penitent = { sprite: S('act6_wild_chain_penitent') };
export const act6_wild_glass_regent = { sprite: S('act6_wild_glass_regent') };
export const act6_wild_stain_preacher = { sprite: S('act6_wild_stain_preacher') };
