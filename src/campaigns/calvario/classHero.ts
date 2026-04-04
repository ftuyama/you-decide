import type { ClassId } from '../../engine/schema.ts';
import type { PathUnlockBonus } from '../../engine/gameData.ts';

/** Rótulo curto da classe (PT-BR). */
export const CLASS_LABEL_PT: Record<ClassId, string> = {
  knight: 'Cavaleiro de fronteira',
  mage: 'Arcanista da Torre',
  cleric: 'Clérigo da Vigília',
};

/** Nome de herói por defeito quando se escolhe a classe. */
export const DEFAULT_HERO_NAME: Record<ClassId, string> = {
  knight: 'Ser Galen',
  mage: 'Ysara Vel',
  cleric: 'Frei Oris',
};

/** Pequena lore por classe (expandível na UI). */
export const CLASS_LORE_PT: Record<ClassId, string> = {
  knight: `Galen jurou a espada às muralhas do sul. Desceu ao Calvário por dívida de honra — e porque, nas galerias, ainda há linhas a segurar e portas a fechar.

Quem o vê de armadura gasta pensa em bravura barata; ele sabe que cada camada de ferro é uma promessa que não se desdiz.`,

  mage: `Ysara deixou o scriptorium e o silêncio regulado da Torre pelo eco húmido das caves. Cada símbolo que desenha no ar é uma aposta: o conhecimento mora onde a luz não chega.

Os colegas chamam-lhe imprudente. Ela chama-lhes cobardes — e carrega o caderno como quem carrega uma última vela.`,

  cleric: `Oris leva o incenso e o silêncio com o mesmo peso. A Vigília mandou-o medir a profundidade do mal — não para o julgar de imediato, mas para dar nome ao que geme sob a cidade e não pode subir sozinho.

Há quem o confunda com confessor; no fundo, é enfermeiro de almas em sítios onde nem Deus responde à primeira chamada.`,
};

/** Rótulos por arquétipo narrativo (`path`). Chave: `classId:path`. */
const PATH_LABEL_PT: Partial<Record<string, string>> = {
  'knight:fallen': 'Cavaleiro caído',
  'mage:dark': 'Mago das trevas',
  'cleric:penitent': 'Clérigo penitente',
};

/** Bónus de jogo ao desbloquear arquétipo (`classId:path`). Mago/clérigo já recebem magia nas cenas de path. */
const PATH_UNLOCK_BONUS: Partial<Record<string, PathUnlockBonus>> = {
  'knight:fallen': { stats: { str: 1, luck: 1 } },
  'mage:dark': { stats: { mind: 1 } },
  'cleric:penitent': { stats: { mind: 1 }, addResource: { resource: 'faith', delta: 1 } },
};

const PATH_LORE_PT: Partial<Record<string, string>> = {
  'knight:fallen': `O juramento quebrou-se antes da espada. Não foi cobardia — foi o peso de ver o que não devia ser visto nas galerias. Ainda carrega o ferro; já não carrega a ilusão de que a honra lava o que a escuridão mancha.

Quem o chama de caído não sabe o que é levantar outra vez só para não deixar ninguém atrás.`,

  'mage:dark': `A Torre ensinou símbolos seguros; o Calvário ensinou os outros. Ysara escolheu a segunda lição de propósito — não por sede de poder, mas porque certas portas só abrem com sombras honestas.

O caderno tem páginas que ela não mostra ao scriptorium.`,

  'cleric:penitent': `Oris marca o corpo para lembrar o que a alma esqueceu. A Vigília ainda o reconhece; ele já não tem a certeza se isso é misericórdia ou sentença.

Cada oração é um contrato renegociado com o silêncio.`,
};

export function getHeroClassLabel(classId: ClassId, path: string | null | undefined): string {
  if (path) {
    const label = PATH_LABEL_PT[`${classId}:${path}`];
    if (label) return label;
  }
  return CLASS_LABEL_PT[classId];
}

export function getHeroLore(classId: ClassId, path: string | null | undefined): string {
  if (path) {
    const lore = PATH_LORE_PT[`${classId}:${path}`];
    if (lore) return lore;
  }
  return CLASS_LORE_PT[classId];
}

export function getPathUnlockBonus(
  classId: ClassId,
  path: string | null | undefined
): PathUnlockBonus | null {
  if (!path) return null;
  return PATH_UNLOCK_BONUS[`${classId}:${path}`] ?? null;
}
