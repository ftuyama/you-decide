/**
 * Estima stats do líder por nível (tabela PROGRESSION + equipamento inicial)
 * e compara inimigos (CA, HP, acertos, P(levar dano), dano médio por ataque / condicional ao acerto).
 *
 * Uso:
 *   npx tsx scripts/balance-estimate.ts
 *   npx tsx scripts/balance-estimate.ts --ref-level 12 --class knight
 *   npx tsx scripts/balance-estimate.ts --levels 1,5,10,15 --json
 */

import campaignIndex from '../src/campaigns/calvario/index.json';
import { enemies } from '../src/campaigns/calvario/data/enemies.ts';
import { items } from '../src/campaigns/calvario/data/items.ts';
import { calvarioHeroNarrative } from '../src/campaigns/calvario/heroNarrative.ts';
import { DEFAULT_ENEMY_CRIT_CONFIRM } from '../src/engine/combat/constants.ts';
import {
  getArmorValue,
  getCharacterArmorClass,
  getWeaponDamage,
  statMod,
} from '../src/engine/combatStats.ts';
import { attackRollSpecial2d6 } from '../src/engine/rng.ts';
import { emptyGameData, type GameData } from '../src/engine/gameData.ts';
import { projectCharacterToLevel } from '../src/engine/progression.ts';
import {
  CampaignIndexSchema,
  type Character,
  type ClassId,
  type EnemyDef,
} from '../src/engine/schema.ts';
import { createPlayerCharacter } from '../src/engine/state.ts';

const idx = CampaignIndexSchema.parse(campaignIndex);
const data: GameData = emptyGameData(idx, calvarioHeroNarrative);
data.items = items;
data.enemies = enemies;

function strWithItemBonuses(c: Character): number {
  let str = c.str;
  for (const slot of [c.weaponId, c.armorId, c.relicId] as const) {
    if (slot && data.items[slot]) str += data.items[slot]!.bonusStr ?? 0;
  }
  return str;
}

/** Ataque físico neutro (postura normal): 2d6 + mod(STR com itens). */
function playerAtkModNeutral(lead: Character): number {
  return statMod(strWithItemBonuses(lead));
}

/** Postura agressiva: +1 ao modificador de ataque. */
function playerAtkModAggressive(lead: Character): number {
  return statMod(strWithItemBonuses(lead)) + 1;
}

function enemyDefenseCa(def: EnemyDef): number {
  return 7 + Math.floor((def.agi + def.armor) / 2);
}

/** P(2d6 + mod >= TN), sem regra de crítico/falha automática (estimativa). */
function prob2d6PlusModGteTN(mod: number, tn: number): number {
  let hits = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (d1 + d2 + mod >= tn) hits++;
    }
  }
  return hits / 36;
}

function playerDefenseCa(lead: Character, defensive: boolean): number {
  return getCharacterArmorClass(data, lead) + (defensive ? 2 : 0);
}

/** Motor: `max(1, d6 + strMod - reduc)` com d6 uniforme. */
function expectedDamageNormalHit(strMod: number, reduc: number): number {
  let s = 0;
  for (let d = 1; d <= 6; d++) {
    s += Math.max(1, d + strMod - reduc);
  }
  return s / 6;
}

/** Motor: `max(1, 2*d6 + strMod - reduc)` no acerto crítico. */
function expectedDamageCritHit(strMod: number, reduc: number): number {
  let s = 0;
  for (let d = 1; d <= 6; d++) {
    s += Math.max(1, 2 * d + strMod - reduc);
  }
  return s / 6;
}

/**
 * P(acertar) com 2d6 + mod(STR inimigo) vs CA, incluindo falha 1+1 e ameaça 6+6 + critConfirm
 * (igual a `advanceToEnemyTurn` sem vantagem inimiga).
 */
function probEnemyHitExact(
  enemyStrMod: number,
  defScore: number,
  critConfirm: number
): number {
  let p = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const atk = d1 + d2 + enemyStrMod;
      const special = attackRollSpecial2d6(d1, d2);
      if (special === 'fumble') continue;
      if (special === 'crit') {
        p += critConfirm + (1 - critConfirm) * (atk >= defScore ? 1 : 0);
      } else {
        p += atk >= defScore ? 1 : 0;
      }
    }
  }
  return p / 36;
}

/**
 * Dano médio por ataque do inimigo (inclui turnos em que erra = 0).
 * Crítico confirmado: dano médio com fórmula de crítico; caso contrário, se acertar, dano médio normal.
 */
function expectedPlayerDamagePerEnemyAttack(
  enemyStrMod: number,
  defScore: number,
  reduc: number,
  critConfirm: number
): number {
  const normalAvg = expectedDamageNormalHit(enemyStrMod, reduc);
  const critAvg = expectedDamageCritHit(enemyStrMod, reduc);
  let total = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      const atk = d1 + d2 + enemyStrMod;
      const special = attackRollSpecial2d6(d1, d2);
      if (special === 'fumble') {
        total += 0;
      } else if (special === 'crit') {
        total +=
          critConfirm * critAvg +
          (1 - critConfirm) * (atk >= defScore ? normalAvg : 0);
      } else {
        total += atk >= defScore ? normalAvg : 0;
      }
    }
  }
  return total / 36;
}

/** Linha de tabela com `|` entre colunas. */
function tableRow(cells: string[]): string {
  return '| ' + cells.join(' | ') + ' |';
}

/** Linha de separação (traços alinhados à largura de cada coluna). */
function tableSep(widths: number[]): string {
  return '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';
}

function parseArgs(argv: string[]): {
  refLevel: number;
  refClass: ClassId;
  levels: number[];
  json: boolean;
  filter: string | null;
} {
  let refLevel = 10;
  let refClass: ClassId = 'knight';
  const levelsDefault = [1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
  let levels = [...levelsDefault];
  let json = false;
  let filter: string | null = null;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      console.log(`Uso: npx tsx scripts/balance-estimate.ts [opções]

Opções:
  --ref-level N     Nível do líder de referência para a tabela de inimigos (default: 10)
  --class ID        knight | mage | cleric — classe de referência (default: knight)
  --levels A,B,...  Níveis na grelha de projeção (default: 1,5,10,…,50)
  --filter SUB      Só inimigos cujo id contém SUB
  --json            Saída JSON (projeção + inimigos + ref)
`);
      process.exit(0);
    }
    if (a === '--json') json = true;
    else if (a === '--ref-level' && argv[i + 1]) {
      refLevel = Number(argv[++i]);
    } else if (a === '--class' && argv[i + 1]) {
      const c = argv[++i] as ClassId;
      if (c === 'knight' || c === 'mage' || c === 'cleric') refClass = c;
    } else if (a === '--levels' && argv[i + 1]) {
      levels = argv[++i]!.split(',').map((x) => Number(x.trim())).filter((n) => !Number.isNaN(n));
    } else if (a === '--filter' && argv[i + 1]) {
      filter = argv[++i]!;
    }
  }

  return { refLevel, refClass, levels, json, filter };
}

function main(): void {
  const { refLevel, refClass, levels, json, filter } = parseArgs(process.argv);

  const refLead = projectCharacterToLevel(createPlayerCharacter('Ref', refClass), refLevel);
  const ca = getCharacterArmorClass(data, refLead);
  const atkN = playerAtkModNeutral(refLead);
  const atkA = playerAtkModAggressive(refLead);
  const wd = getWeaponDamage(data, refLead);
  const armorReduc = getArmorValue(data, refLead);

  const rows = Object.values(enemies)
    .filter((e) => !filter || e.id.includes(filter))
    .map((def) => {
      const edef = enemyDefenseCa(def);
      const pHitN = prob2d6PlusModGteTN(atkN, edef);
      const pHitA = prob2d6PlusModGteTN(atkA, edef);
      const enemyStrMod = statMod(def.str);
      const critConfirm = def.critConfirm ?? DEFAULT_ENEMY_CRIT_CONFIRM;
      const defN = playerDefenseCa(refLead, false);
      const defD = playerDefenseCa(refLead, true);
      const pTakeDmgN = probEnemyHitExact(enemyStrMod, defN, critConfirm);
      const pTakeDmgD = probEnemyHitExact(enemyStrMod, defD, critConfirm);
      const expDmgPerAtkN = expectedPlayerDamagePerEnemyAttack(
        enemyStrMod,
        defN,
        armorReduc,
        critConfirm
      );
      const expDmgPerAtkD = expectedPlayerDamagePerEnemyAttack(
        enemyStrMod,
        defD,
        armorReduc,
        critConfirm
      );
      const expDmgGivenHitN = pTakeDmgN > 0 ? expDmgPerAtkN / pTakeDmgN : 0;
      const expDmgGivenHitD = pTakeDmgD > 0 ? expDmgPerAtkD / pTakeDmgD : 0;
      return {
        id: def.id,
        name: def.name,
        hp: def.maxHp,
        str: def.str,
        agi: def.agi,
        armor: def.armor,
        enemyCa: edef,
        critConfirm,
        pPlayerHitNeutral: pHitN,
        pPlayerHitAggressive: pHitA,
        pTakeDamageNeutral: pTakeDmgN,
        pTakeDamageDefensive: pTakeDmgD,
        expectedDmgPerEnemyAttackNeutral: expDmgPerAtkN,
        expectedDmgPerEnemyAttackDefensive: expDmgPerAtkD,
        expectedDmgGivenHitNeutral: expDmgGivenHitN,
        expectedDmgGivenHitDefensive: expDmgGivenHitD,
      };
    })
    .sort((a, b) => a.enemyCa - b.enemyCa);

  const projection = (['knight', 'mage', 'cleric'] as const).map((cls) => {
    const byLevel = levels.map((lv) => {
      const lead = projectCharacterToLevel(createPlayerCharacter('Hero', cls), lv);
      return {
        level: lv,
        str: lead.str,
        agi: lead.agi,
        mind: lead.mind,
        maxHp: lead.maxHp,
        maxMana: lead.maxMana,
        ca: getCharacterArmorClass(data, lead),
        atkModNeutral: playerAtkModNeutral(lead),
        atkModAggressive: playerAtkModAggressive(lead),
        weaponDmg: getWeaponDamage(data, lead),
      };
    });
    return { classId: cls, byLevel };
  });

  if (json) {
    console.log(
      JSON.stringify(
        {
          ref: {
            class: refClass,
            level: refLevel,
            ca,
            armorReductionFromItems: armorReduc,
            atkModNeutral: atkN,
            atkModAggressive: atkA,
            weaponDamage: wd,
          },
          projection,
          enemies: rows,
        },
        null,
        2
      )
    );
    return;
  }

  console.log('=== Referência de combate (líder projetado) ===\n');
  console.log(
    `Classe: ${refClass}  |  Nível: ${refLevel}  |  CA: ${ca}  |  redução de dano (armadura+relíquia): ${armorReduc}  |  mod ataque (neutro/agressivo): ${atkN} / ${atkA}  |  dano arma: ${wd}`
  );
  console.log(
    '(Jogador acerta: 2d6 + mod vs CA inimigo, sem crítico/falha. Inimigo vs ref: regras do motor — 1+1 falha, 6+6 + critConfirm, dano max(1, d6+mod(STR)−redução).)\n'
  );

  const projWidths = [3, 3, 3, 3, 5, 7, 2, 4, 4, 4];

  console.log('=== Projeção por nível (equipamento inicial, só PROGRESSION) ===\n');
  for (const block of projection) {
    console.log(`— ${block.classId} —`);
    console.log(
      tableRow([
        'lvl'.padStart(3),
        'STR'.padStart(3),
        'AGI'.padStart(3),
        'MEN'.padStart(3),
        'maxHP'.padStart(5),
        'maxMana'.padStart(7),
        'CA'.padStart(2),
        'atkN'.padStart(4),
        'atkA'.padStart(4),
        'wdmg'.padStart(4),
      ])
    );
    console.log(tableSep(projWidths));
    for (const r of block.byLevel) {
      console.log(
        tableRow([
          String(r.level).padStart(3),
          String(r.str).padStart(3),
          String(r.agi).padStart(3),
          String(r.mind).padStart(3),
          String(r.maxHp).padStart(5),
          String(r.maxMana).padStart(7),
          String(r.ca).padStart(2),
          String(r.atkModNeutral).padStart(4),
          String(r.atkModAggressive).padStart(4),
          String(r.weaponDmg).padStart(4),
        ])
      );
    }
    console.log('');
  }

  const enemyWidths = [28, 4, 5, 6, 6, 6, 6, 7, 7, 6, 6, 36];

  console.log('=== Inimigos vs referência ===\n');
  const fmtPctCell = (x: number) => ((x * 100).toFixed(0) + '%').padStart(6);
  const fmtD = (x: number) => x.toFixed(2).padStart(7);
  const fmtDh = (x: number) => x.toFixed(1).padStart(6);

  console.log(
    tableRow([
      'id'.padEnd(28),
      'hp'.padStart(4),
      'eCA'.padStart(5),
      'pPlN'.padStart(6),
      'pPlA'.padStart(6),
      'pLvN'.padStart(6),
      'pLvD'.padStart(6),
      'E[D]n'.padStart(7),
      'E[D]d'.padStart(7),
      'hitN'.padStart(6),
      'hitD'.padStart(6),
      'nome'.padEnd(36),
    ])
  );
  console.log(tableSep(enemyWidths));
  for (const r of rows) {
    console.log(
      tableRow([
        r.id.padEnd(28),
        String(r.hp).padStart(4),
        String(r.enemyCa).padStart(5),
        fmtPctCell(r.pPlayerHitNeutral),
        fmtPctCell(r.pPlayerHitAggressive),
        fmtPctCell(r.pTakeDamageNeutral),
        fmtPctCell(r.pTakeDamageDefensive),
        fmtD(r.expectedDmgPerEnemyAttackNeutral),
        fmtD(r.expectedDmgPerEnemyAttackDefensive),
        fmtDh(r.expectedDmgGivenHitNeutral),
        fmtDh(r.expectedDmgGivenHitDefensive),
        r.name.padEnd(36),
      ])
    );
  }

  console.log(`
Legenda: pPlN/A = ref acerta inimigo (postura neutra/agressiva), est. simples 2d6.
pLvN/D = ref leva dano (inimigo acerta), postura normal / defensiva (+2 CA).
E[D]n/d = dano médio por ataque do inimigo (inclui 0 quando erra).
hitN/D = dano médio por ataque **se** o inimigo acertar.
`);
}

main();
