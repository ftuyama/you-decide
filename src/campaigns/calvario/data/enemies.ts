import type { EnemyDef } from '../../../engine/schema';

export const enemies: Record<string, EnemyDef> = {
  rat_swarm: {
    id: 'rat_swarm',
    name: 'Enxame de Ratos',
    hp: 6,
    maxHp: 6,
    str: 5,
    agi: 10,
    mind: 3,
    armor: 0,
    type: 'normal',
    armorChips: 0,
    sprite: ` ∿∿ cano ∿∿
  )\\.(
 (')(')  olhos
  /  \\   rubros
 ∿∿∿∿∿∿∿∿∿∿∿`,
    spriteWounded: ` ∿∿ cano ∿∿
  )\\.(
 (x)(')  fúria
  /  \\
 ∿∿∿∿∿∿∿∿∿∿∿`,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Esqueleto',
    hp: 10,
    maxHp: 10,
    str: 8,
    agi: 6,
    mind: 2,
    armor: 1,
    type: 'undead',
    armorChips: 0,
    sprite: `  .-===-.
 | o   o |  elmo
 |   <   |  partido
 |___|___|
 /    |    \\
~~   / \\   ~~`,
    spriteWounded: `  .-===-.
 | @   @ |  racha
 |   ~   |  no crânio
 |___|___|
 /    |    \\
~~   / \\   ~~`,
  },
  cultist: {
    id: 'cultist',
    name: 'Cultista',
    hp: 12,
    maxHp: 12,
    str: 7,
    agi: 8,
    mind: 9,
    armor: 0,
    type: 'cultist',
    armorChips: 0,
    sprite: `  ╱‾‾‾╲
 | ███ |  capuz
 | ^ ^ |  bordado
 | ██  |
  ╲___╱`,
  },
  stone_guard: {
    id: 'stone_guard',
    name: 'Guardião de Pedra',
    hp: 22,
    maxHp: 22,
    str: 12,
    agi: 4,
    mind: 3,
    armor: 3,
    type: 'armored',
    armorChips: 3,
    sprite: ` ▄███████▄
 ███ ◆ ███  runas
 █████████  apagadas
 █████████
 ▀▀▀▀▀▀▀▀▀`,
  },
  morvayn_p1: {
    id: 'morvayn_p1',
    name: 'Morvayn, o Necromante',
    hp: 35,
    maxHp: 35,
    str: 10,
    agi: 9,
    mind: 14,
    armor: 2,
    type: 'cultist',
    armorChips: 0,
    sprite: `   .:::.
  ╔|☠|╗   manto
  ║ ◊ ║   de noite
  ║ ~ ║   e osso
  ╚═╦═╝
   ║ ║
  ╱   ╲`,
    spriteWounded: `   .:::.
  ╔|☠|╗   ferido
  ║ ░ ║   o véu
  ║ ~ ║   verde
  ╚═╦═╝
   ║ ║
  ╱   ╲`,
  },
  morvayn_p2: {
    id: 'morvayn_p2',
    name: 'Morvayn (Trono de Ossos)',
    hp: 40,
    maxHp: 40,
    str: 12,
    agi: 8,
    mind: 16,
    armor: 3,
    type: 'armored',
    armorChips: 2,
    sprite: ` ▄█████████▄
██☠││││☠██  trono
███████████  funde-se
▀█████████▀  à carne
 ▀▀▀▀▀▀▀▀▀`,
  },
};
