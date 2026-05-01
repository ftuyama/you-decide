import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const sharedScenesDir = join(repoRoot, 'src/campaigns/calvario/scenes/shared');

const explorationNavFiles = [
  'explore_nav_act2.md',
  'explore_nav_act3.md',
  'explore_nav_act5.md',
  'explore_nav_act6.md',
];

const act2WildEncounterFiles = [
  'wild_encounter_rats.md',
  'wild_encounter_mixed.md',
  'wild_encounter_cultist.md',
  'wild_encounter_bones_rare.md',
  'wild_encounter_lone_swarm_rare.md',
];

const act5WildEncounterFiles = [
  'frost_encounter_whelps.md',
  'frost_encounter_solo_whelp.md',
  'frost_encounter_cultist.md',
  'frost_encounter_hunt_party.md',
  'frost_encounter_howl_horde.md',
];

const act6WildEncounterFiles = [
  'void_encounter_fragment_solo.md',
  'void_encounter_pair_fragments.md',
  'void_encounter_veil.md',
  'void_encounter_echo.md',
  'void_encounter_penitent.md',
  'void_encounter_veil_fragment.md',
  'void_encounter_echo_fragment.md',
  'void_encounter_triple_fragments.md',
  'void_encounter_shadow_rare.md',
  'void_encounter_corruption_horde.md',
];

describe('exploration nav consistency (calvario)', () => {
  it('game over limpa o mapa ASCII ativo', () => {
    const content = readFileSync(join(sharedScenesDir, 'game_over.md'), 'utf8');
    expect(content).toContain('- { op: clearAsciiMap }');
  });

  it('todas as cenas de exploração incluem uma ação de patrulha aleatória', () => {
    for (const file of explorationNavFiles) {
      const content = readFileSync(join(sharedScenesDir, file), 'utf8');
      const hasPatrolRandom = content.includes('id: explore_patrol_random');
      expect(hasPatrolRandom, `falta escolha de patrulha aleatória em ${file}`).toBe(true);
    }
  });

  it('encontros aleatórios da patrulha do act2 retornam para a navegação de exploração', () => {
    for (const file of act2WildEncounterFiles) {
      const content = readFileSync(
        join(repoRoot, 'src/campaigns/calvario/scenes/act2/encounters', file),
        'utf8'
      );
      expect(content).toContain('onVictory: shared/explore_nav_act2');
      expect(content).toContain('onFlee: shared/explore_nav_act2');
    }
  });

  it('encontros aleatórios da patrulha do act5 retornam para a navegação de exploração', () => {
    for (const file of act5WildEncounterFiles) {
      const content = readFileSync(
        join(repoRoot, 'src/campaigns/calvario/scenes/act5/encounters', file),
        'utf8'
      );
      expect(content).toContain('onVictory: shared/explore_nav_act5');
      expect(content).toContain('onFlee: shared/explore_nav_act5');
    }
  });

  it('encontros aleatórios da patrulha do act6 retornam para a navegação de exploração', () => {
    for (const file of act6WildEncounterFiles) {
      const content = readFileSync(
        join(repoRoot, 'src/campaigns/calvario/scenes/act6/encounters', file),
        'utf8'
      );
      expect(content).toContain('onVictory: shared/explore_nav_act6');
      expect(content).toContain('onFlee: shared/explore_nav_act6');
    }
  });
});
