import armor from './armor.svg?raw';
import companions from './companions.svg?raw';
import corruption from './corruption.svg?raw';
import diary from './diary.svg?raw';
import equipment from './equipment.svg?raw';
import factions from './factions.svg?raw';
import faith from './faith.svg?raw';
import gold from './gold.svg?raw';
import heart from './heart.svg?raw';
import inventory from './inventory.svg?raw';
import item from './item.svg?raw';
import map from './map.svg?raw';
import memories from './memories.svg?raw';
import person from './person.svg?raw';
import progress from './progress.svg?raw';
import relic from './relic.svg?raw';
import resources from './resources.svg?raw';
import scroll from './scroll.svg?raw';
import spellbook from './spellbook.svg?raw';
import supply from './supply.svg?raw';
import tier from './tier.svg?raw';
import weapon from './weapon.svg?raw';

/** Ícones SVG inline (ficheiros em `src/ui/icons/`). */
export const icons = {
  armor,
  companions,
  corruption,
  diary,
  equipment,
  factions,
  faith,
  gold,
  heart,
  inventory,
  item,
  map,
  memories,
  person,
  progress,
  relic,
  resources,
  scroll,
  spellbook,
  supply,
  tier,
  weapon,
} as const;

export type IconId = keyof typeof icons;

/** Envolve SVG para UI (14×14 por defeito; use `ui-icon-wrap--sm` para listas). */
export function iconWrap(svg: string, classes = 'ui-icon-wrap'): string {
  return `<span class="${classes}" aria-hidden="true">${svg}</span>`;
}

/** Primeira coluna do resumo colapsável (ícone + texto). */
export function collapseTriggerStart(svg: string, label: string): string {
  return `<span class="sidebar-collapse-trigger-start">${iconWrap(svg)}${label}</span>`;
}
