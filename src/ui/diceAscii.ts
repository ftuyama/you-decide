/** Faces d6 em ASCII (5 linhas cada). Valores fora 1–6 tratados como 1. */
const FACES: Record<number, string[]> = {
  1: ['╔═══╗', '║   ║', '║ ● ║', '║   ║', '╚═══╝'],
  2: ['╔═══╗', '║●  ║', '║   ║', '║  ●║', '╚═══╝'],
  3: ['╔═══╗', '║●  ║', '║ ● ║', '║  ●║', '╚═══╝'],
  4: ['╔═══╗', '║● ●║', '║   ║', '║● ●║', '╚═══╝'],
  5: ['╔═══╗', '║● ●║', '║ ● ║', '║● ●║', '╚═══╝'],
  6: ['╔═══╗', '║● ●║', '║● ●║', '║● ●║', '╚═══╝'],
};

function norm(v: number): number {
  if (v < 1 || v > 6 || !Number.isFinite(v)) return 1;
  return Math.floor(v);
}

/** Vários d6 lado a lado (mesma linha concatenada). */
export function formatDiceAscii(dice: number[]): string {
  if (dice.length === 0) return '';
  const rows = [0, 1, 2, 3, 4].map((row) =>
    dice
      .map((d) => FACES[norm(d)]![row])
      .join('  ')
  );
  return rows.join('\n');
}
