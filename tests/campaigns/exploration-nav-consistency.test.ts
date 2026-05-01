import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = fileURLToPath(new URL('../../', import.meta.url));
const sharedScenesDir = join(repoRoot, 'src/campaigns/calvario/scenes/shared');

const explorationNavFiles = [
  'explore_nav.md',
  'explore_nav_act3.md',
  'explore_nav_act5.md',
  'explore_nav_act6.md',
];

describe('exploration nav consistency (calvario)', () => {
  it('todas as cenas de exploração incluem uma ação de patrulha aleatória', () => {
    for (const file of explorationNavFiles) {
      const content = readFileSync(join(sharedScenesDir, file), 'utf8');
      const hasForce = content.includes('id: explore_force');
      const hasPatrolRandom = content.includes('id: explore_patrol_random');
      expect(hasForce || hasPatrolRandom, `falta escolha de patrulha aleatória em ${file}`).toBe(true);
    }
  });
});
