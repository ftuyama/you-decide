import type { ClassId } from '../../engine/schema';

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
