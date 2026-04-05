import { ITEM_SPRITES } from '../../itemSprites.ts';

const S = (key: string): string => {
  const v = ITEM_SPRITES[key];
  if (v === undefined) throw new Error(`Missing item sprite: ${key}`);
  return v;
};

export const iron_dagger = S('iron_dagger');
export const rusty_sword = S('rusty_sword');
export const oak_staff = S('oak_staff');
export const mace = S('mace');
export const leather = S('leather');
export const cloth_robe = S('cloth_robe');
export const chain_shirt = S('chain_shirt');
export const third_bell = S('third_bell');
export const rumor_map = S('rumor_map');
export const frost_wyrm_scale = S('frost_wyrm_scale');
export const potion_hp = S('potion_hp');
export const potion_mana = S('potion_mana');
export const potion_stress = S('potion_stress');
