import type { ItemDef } from '../../../engine/schema';

const z = (x: Partial<ItemDef> & Pick<ItemDef, 'id' | 'name' | 'slot'>): ItemDef => ({
  bonusStr: 0,
  bonusAgi: 0,
  bonusMind: 0,
  bonusLuck: 0,
  armor: 0,
  damage: 0,
  ...x,
});

export const items: Record<string, ItemDef> = {
  rusty_sword: z({
    id: 'rusty_sword',
    name: 'Espada Enferrujada',
    slot: 'weapon',
    bonusStr: 1,
    bonusLuck: 1,
    damage: 1,
  }),
  oak_staff: z({
    id: 'oak_staff',
    name: 'Cajado de Carvalho',
    slot: 'weapon',
    bonusMind: 1,
    bonusLuck: 1,
    damage: 1,
  }),
  mace: z({
    id: 'mace',
    name: 'Maça Ritual',
    slot: 'weapon',
    bonusMind: 1,
    bonusLuck: 1,
    damage: 2,
  }),
  leather: z({
    id: 'leather',
    name: 'Couro Endurecido',
    slot: 'armor',
    armor: 1,
    bonusAgi: 1,
  }),
  cloth_robe: z({
    id: 'cloth_robe',
    name: 'Manto Simples',
    slot: 'armor',
    armor: 0,
    bonusMind: 1,
  }),
  chain_shirt: z({
    id: 'chain_shirt',
    name: 'Cota de Malha Leve',
    slot: 'armor',
    armor: 2,
  }),
  third_bell: z({
    id: 'third_bell',
    name: 'Anel do Terceiro Sino',
    slot: 'relic',
    bonusMind: 2,
    cursed: true,
  }),
  rumor_map: z({
    id: 'rumor_map',
    name: 'Mapa Rasgado',
    slot: 'relic',
    rumor: true,
  }),
};
