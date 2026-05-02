import type { Character, ClassId, GameState } from '../../engine/schema/index.ts';
import type { PathUnlockBonus } from '../../engine/data/index.ts';
import { isLeadPassiveUnlocked } from '../../engine/core/index.ts';
import { leadStoryPassives as leadStoryPassivesCatalog } from './data/passives.ts';

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
  knight: `Galen jurou a espada às muralhas do sul. Desceu à Masmorra do Silêncio por dívida de honra — e porque, nas galerias, ainda há linhas a segurar e portas a fechar.

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

/** Texto do banner de promoção (`setPath`) — tom narrativo curto por arquétipo. */
const PATH_PROMOTION_NARRATIVE_PT: Partial<Record<string, string>> = {
  'knight:fallen':
    'O ferro não te largou: mudou o que escreves por cima da armadura — promessa partida que ainda corta, sem ilusão de honra que lave o que viste nas galerias.',
  'mage:dark':
    'Os símbolos seguros ficaram pequenos no véu. A partir daqui carregas outros no sangue e no silêncio — e cada traço sabe a que preço abriu a porta.',
  'cleric:penitent':
    'A fé não te soltou; o corpo é que aprendeu outro idioma de contrato — marcas que a Vigília não precisa abençoar para doer, e orações renegociadas com o silêncio.',
};

/** Bónus de jogo ao desbloquear arquétipo (`classId:path`). Mago/clérigo já recebem magia nas cenas de path. */
const PATH_UNLOCK_BONUS: Partial<Record<string, PathUnlockBonus>> = {
  'knight:fallen': {
    stats: { str: 1, luck: 1 },
    backstoryPt: `O que viu nas galerias deixou-no com noites em claro: a mão a fechar no punho sem ferro, o corpo a lembrar o golpe que não deu. Não é medo — é o hábito de estar sempre um passo atrasado em relação à própria culpa.`,
  },
  'mage:dark': {
    stats: { mind: 1 },
    backstoryPt: `Há noites em que desenha um símbolo no ar e hesita entre apagar ou completar — como se o vício fosse curiosidade com dentes. A Torre chamaria-lhe corrupção; ela chama necessidade, e odeia ter razão.`,
  },
  'cleric:penitent': {
    stats: { mind: 1 },
    addResource: { resource: 'faith', delta: 1 },
    backstoryPt: `As marcas do ritual não sangram, mas doem quando ninguém vê. O hábito de se castigar tornou-se mais voz interior do que liturgia — e a Vigília, por vezes, parece tão distante como o céu tapado.`,
  },
};

const PATH_LORE_PT: Partial<Record<string, string>> = {
  'knight:fallen': `O juramento quebrou-se antes da espada. Não foi cobardia — foi o peso de ver o que não devia ser visto nas galerias. Ainda carrega o ferro; já não carrega a ilusão de que a honra lava o que a escuridão mancha.

Quem o chama de caído não sabe o que é levantar outra vez só para não deixar ninguém atrás.`,

  'mage:dark': `A Torre ensinou símbolos seguros; a masmorra ensinou os outros. Ysara escolheu a segunda lição de propósito — não por sede de poder, mas porque certas portas só abrem com sombras honestas.

O caderno tem páginas que ela não mostra ao scriptorium.`,

  'cleric:penitent': `Oris marca o corpo para lembrar o que a alma esqueceu. A Vigília ainda o reconhece; ele já não tem a certeza se isso é misericórdia ou sentença.

Cada oração é um contrato renegociado com o silêncio.`,
};

/** Revelação na História quando o passivo de classe desbloqueia (fragmento de Morvayn). */
const CLASS_PASSIVE_LORE_PT: Record<ClassId, string> = {
  knight: `O que lhe deram nos subníveis não é só sorte: é memória no corpo de que o golpe decisivo nasce quando já não há margem para meias-medidas — e de que isso tem custo.`,
  mage: `O fio que sente na mana não é conforto; é lembrete de que aprendeu a beber o poço devagar o bastante para não se afogar de uma vez — e devagar o bastante para não parar.`,
  cleric: `O pulso devoto não apaga o medo; ensina-o a respirar por baixo da pele. Oris descobriu que fé, aqui em baixo, é menos claridade e mais hábito de não desistir da carne quando o espírito vacila.`,
};

const CHAPTER_LORE_PT: Record<ClassId, { mid: string; late: string }> = {
  knight: {
    mid: `Nas profundezas, a honra deixou de ser discurso de muralha. Tornou-se pergunta feita a cada passo: a quem estás a salvar — e quanto de ti ficas a dever ao silêncio?`,
    late: `Galen já não distingue bem fronteira de masmorra: ambas cobram testemunhas. O ferro pesa o mesmo; muda o nome do inimigo que imagina quando fecha os olhos.`,
  },
  mage: {
    mid: `Cada camada da dungeon arranha a certeza da Torre. Ysara sente o caderno mais pesado — não de páginas, de promessas que fez a si mesma para continuar a subir (ou a descer) sem mentir por completo.`,
    late: `Os símbolos que usa já não parecem empréstimos: parecem hábito. A pergunta deixa de ser “é seguro?” e passa a ser “ainda és tu a escolher o risco?”`,
  },
  cleric: {
    mid: `Oris aprendeu a medir o mal em respirações, não só em dogma. O incenso não esconde o cheiro da verdade; ajuda a aguentar o tempo suficiente para a nomear sem desfalecer.`,
    late: `A Vigília mandou-o medir profundidade; a masmorra ensinou-lhe profundidade humana. Entre oração e silêncio, ficou um terceiro lugar: o de quem carrega o peso sem pedir permissão ao céu.`,
  },
};

function normPath(path: string | null | undefined): string | null {
  if (path == null) return null;
  const t = path.trim();
  return t.length > 0 ? t : null;
}

function pathKey(classId: ClassId, path: string | null | undefined): string | null {
  const p = normPath(path);
  if (!p) return null;
  return `${classId}:${p}`;
}

type LoreBeat = {
  when: (state: GameState, lead: Character, path: string | null | undefined) => boolean;
  text: (state: GameState, lead: Character, path: string | null | undefined) => string | null;
};

function beatBase(classId: ClassId): LoreBeat {
  return {
    when: () => true,
    text: () => CLASS_LORE_PT[classId],
  };
}

function beatPathLore(classId: ClassId): LoreBeat {
  return {
    when: (_s, lead, path) => {
      const p = normPath(path ?? lead.path);
      if (!p) return false;
      return !!PATH_LORE_PT[`${classId}:${p}`];
    },
    text: (_s, lead, path) => {
      const p = normPath(path ?? lead.path);
      if (!p) return null;
      return PATH_LORE_PT[`${classId}:${p}`] ?? null;
    },
  };
}

function beatPathBackstory(classId: ClassId): LoreBeat {
  return {
    when: (_s, lead, path) => {
      const p = normPath(path ?? lead.path);
      if (!p) return false;
      return !!PATH_UNLOCK_BONUS[`${classId}:${p}`]?.backstoryPt;
    },
    text: (_s, lead, path) => {
      const p = normPath(path ?? lead.path);
      if (!p) return null;
      return PATH_UNLOCK_BONUS[`${classId}:${p}`]?.backstoryPt ?? null;
    },
  };
}

function beatClassPassiveLore(classId: ClassId): LoreBeat {
  return {
    when: (state, lead) => lead.class === classId && isLeadPassiveUnlocked(state),
    text: (_s, lead) => (lead.class === classId ? CLASS_PASSIVE_LORE_PT[classId] : null),
  };
}

function beatChapterMid(classId: ClassId): LoreBeat {
  return {
    when: (state, lead) => lead.class === classId && state.chapter >= 3,
    text: (_s, lead) => (lead.class === classId ? CHAPTER_LORE_PT[classId].mid : null),
  };
}

function beatChapterLate(classId: ClassId): LoreBeat {
  return {
    when: (state, lead) => lead.class === classId && state.chapter >= 5,
    text: (_s, lead) => (lead.class === classId ? CHAPTER_LORE_PT[classId].late : null),
  };
}

const BEATS: Record<ClassId, LoreBeat[]> = {
  knight: [
    beatBase('knight'),
    beatPathLore('knight'),
    beatPathBackstory('knight'),
    beatClassPassiveLore('knight'),
    beatChapterMid('knight'),
    beatChapterLate('knight'),
  ],
  mage: [
    beatBase('mage'),
    beatPathLore('mage'),
    beatPathBackstory('mage'),
    beatClassPassiveLore('mage'),
    beatChapterMid('mage'),
    beatChapterLate('mage'),
  ],
  cleric: [
    beatBase('cleric'),
    beatPathLore('cleric'),
    beatPathBackstory('cleric'),
    beatClassPassiveLore('cleric'),
    beatChapterMid('cleric'),
    beatChapterLate('cleric'),
  ],
};

function leadStoryPassiveLoreSlotsTotal(): number {
  let n = 0;
  for (const def of Object.values(leadStoryPassivesCatalog)) {
    if (def.heroLorePt) n += 1;
  }
  return n;
}

function appendLeadStoryLoreParagraphs(state: GameState, out: string[]): void {
  for (const id of state.leadStoryPassives) {
    const pt = leadStoryPassivesCatalog[id]?.heroLorePt;
    if (pt) out.push(pt);
  }
}

export function getHeroClassLabel(classId: ClassId, path: string | null | undefined): string {
  if (path) {
    const label = PATH_LABEL_PT[`${classId}:${path}`];
    if (label) return label;
  }
  return CLASS_LABEL_PT[classId];
}

export function getHeroLore(
  state: GameState,
  classId: ClassId,
  path: string | null | undefined
): string {
  const lead = state.party[0];
  if (!lead || lead.class !== classId) {
    return CLASS_LORE_PT[classId];
  }
  const pathEff = path ?? lead.path;
  const parts: string[] = [];
  for (const beat of BEATS[classId]) {
    if (beat.when(state, lead, pathEff)) {
      const t = beat.text(state, lead, pathEff);
      if (t) parts.push(t);
    }
  }
  appendLeadStoryLoreParagraphs(state, parts);
  return parts.join('\n\n');
}

export function getHeroStoryProgress(
  state: GameState,
  classId: ClassId,
  path: string | null | undefined
): { unlocked: number; total: number } {
  const lead = state.party[0];
  const total = BEATS[classId].length + leadStoryPassiveLoreSlotsTotal();
  let unlocked = 0;

  if (!lead || lead.class !== classId) {
    return { unlocked: 0, total };
  }

  const pathEff = path ?? lead.path;
  for (const beat of BEATS[classId]) {
    if (beat.when(state, lead, pathEff)) unlocked += 1;
  }

  for (const [id, def] of Object.entries(leadStoryPassivesCatalog)) {
    if (!def.heroLorePt) continue;
    if (state.leadStoryPassives.includes(id)) unlocked += 1;
  }

  return { unlocked, total };
}

export function getPathUnlockBonus(
  classId: ClassId,
  path: string | null | undefined
): PathUnlockBonus | null {
  const k = pathKey(classId, path);
  if (!k) return null;
  return PATH_UNLOCK_BONUS[k] ?? null;
}

export function getPathPromotionNarrativePt(
  classId: ClassId,
  path: string | null | undefined
): string | null {
  const k = pathKey(classId, path);
  if (!k) return null;
  const t = PATH_PROMOTION_NARRATIVE_PT[k];
  return t != null && t.trim().length > 0 ? t.trim() : null;
}
