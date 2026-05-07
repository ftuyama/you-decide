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
  knight: `Galen cresceu onde o vento corta os muros e os homens aprendem cedo que promessa quebrada mata mais do que lâmina cega. Jurou proteger a fronteira; falhou uma noite, e bastou uma noite para enterrar nomes que ainda o acordam.

Desceu à Masmorra do Silêncio não para glória, mas para cobrar de si a dívida que ninguém exigiu em voz alta. Cada placa da armadura pesa como testemunha: ele avança porque recuar seria admitir que os mortos ficaram para trás em vão.`,

  mage: `Ysara foi moldada pela Torre para recitar verdades limpas, em salas secas, entre mestres que só aceitavam o risco quando ele cabia no pergaminho. Ela acreditou nisso até ouvir, sob a pedra da cidade, uma pergunta que os livros não respondiam.

Na masmorra, estudo e culpa andam juntos: cada sigilo que traça aproxima-a de respostas e de uma versão de si que talvez a Torre chamasse de heresia. Ainda assim, segue — porque ignorância, para ela, sempre foi um pecado mais útil aos monstros.`,

  cleric: `Oris vestiu a Vigília quando ainda acreditava que fé era muralha: oração certa, gesto certo, noite vencida. Depois viu gente boa afundar em silêncio sem milagre nenhum, e aprendeu que doutrina não aquece mão gelada.

Desceu para medir o mal, sim — mas também para não abandonar quem já não consegue pedir socorro. Carrega incenso, salmos e vergonha antiga; quando Deus cala, ele responde do jeito que pode, ficando.`,
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
    'O ferro não te largou; foi a inocência que ficou para trás. A armadura agora veste um nome novo: aquele que sobreviveu quando devia ter caído, e aprendeu a lutar sem esperar absolvição.',
  'mage:dark':
    'Os símbolos seguros já não bastam para abrir as portas que escolheste atravessar. Daqui em diante, o véu responde ao teu pulso e à tua fome de verdade, e cada traço cobra um pedaço de quem o desenha.',
  'cleric:penitent':
    'A fé não te deixou; foi a paz que desertou primeiro. O corpo virou liturgia de cicatrizes, e cada oração agora soa menos como conforto e mais como juramento de continuar de pé apesar do silêncio.',
};

/** Bónus de jogo ao desbloquear arquétipo (`classId:path`). Mago/clérigo já recebem magia nas cenas de path. */
const PATH_UNLOCK_BONUS: Partial<Record<string, PathUnlockBonus>> = {
  'knight:fallen': {
    stats: { str: 1, luck: 1 },
    backstoryPt: `Desde as galerias, dorme com a sensação de ter chegado tarde ao golpe que importava. Não chama isso de medo; chama de disciplina amarga — a de nunca mais permitir que alguém morra por causa de um segundo de hesitação.`,
  },
  'mage:dark': {
    stats: { mind: 1 },
    backstoryPt: `Há noites em que começa um símbolo e para no último traço, como quem encara um precipício familiar. A Torre chamaria de corrupção; ela chama de necessidade — e odeia perceber que ambas as palavras podem ser verdade ao mesmo tempo.`,
  },
  'cleric:penitent': {
    stats: { mind: 1 },
    addResource: { resource: 'faith', delta: 1 },
    backstoryPt: `As marcas do ritual não sangram, mas ardem nos dias em que a culpa encontra silêncio. A penitência já não é cerimônia: virou idioma íntimo, lembrando-o de que fé também é permanecer humano quando o céu parece fechado.`,
  },
};

const PATH_LORE_PT: Partial<Record<string, string>> = {
  'knight:fallen': `O juramento não partiu num grito; partiu em pequenas omissões, numa noite em que Galen escolheu errado e ouviu o preço dessa escolha ecoar nos corredores. Desde então, luta como quem presta depoimento ao próprio passado.

Chamam-no de caído porque não entendem: cair foi fácil; difícil é continuar carregando os vivos sem fingir que os mortos deixaram de pesar.`,

  'mage:dark': `A Torre ensinou limites; a masmorra ensinou necessidade. Ysara atravessou essa fronteira sabendo que conhecimento sem custo era conforto de superfície, e que o fundo exigia mãos sujas de sombra.

No caderno, há páginas que ela esconde não por vergonha do poder, mas por medo de reconhecer, em letra limpa, o quanto já mudou para consegui-lo.`,

  'cleric:penitent': `Oris transformou culpa em rito para não deixá-la apodrecer em silêncio. A Vigília ainda o chama de irmão; ele responde, mas já sabe que algumas respostas vêm da carne ferida, não do altar.

Cada prece é renegociação: entre misericórdia e disciplina, entre o homem que era e o que precisa ser para atravessar a escuridão sem negar o próprio coração.`,
};

/** Revelação na História quando o passivo de classe desbloqueia (fragmento de Morvayn). */
const CLASS_PASSIVE_LORE_PT: Record<ClassId, string> = {
  knight: `O instinto que desperta em Galen não é sorte de batalha; é memória muscular de perdas que ele se recusou a repetir. Quando o momento fecha, o corpo decide antes da dúvida — e cobra depois, em silêncio.`,
  mage: `O fio na mana deixou de ser técnica e virou pacto íntimo. Ysara aprendeu a tocar o abismo sem se entregar inteiro a ele: sorve o bastante para avançar, recua o bastante para ainda se reconhecer.`,
  cleric: `O pulso de Oris não elimina o medo; ensina convivência. A fé dele, aqui embaixo, não é clarão repentino: é repetição teimosa de cuidado, mesmo quando a alma fraqueja e nenhuma voz do alto responde.`,
};

const CHAPTER_LORE_PT: Record<ClassId, { mid: string; late: string }> = {
  knight: {
    mid: `Nas profundezas, honra já não é lema de estandarte: é decisão repetida quando ninguém está olhando. Galen aprende que proteger alguém quase sempre significa sacrificar a versão de si que ainda queria ser inocente.`,
    late: `Chegando ao fim, fronteira e masmorra se confundem no mesmo tribunal interior. O aço pesa igual, mas agora ele sabe: o inimigo mais persistente é a voz que pergunta se desta vez ele chegou a tempo.`,
  },
  mage: {
    mid: `Cada nível desmente uma certeza ensinada pela Torre. O caderno de Ysara pesa mais não pelo papel, mas pelo número de promessas que ela precisa fazer a si mesma para continuar buscando verdade sem se perder por completo.`,
    late: `No limiar, os símbolos sombrios já soam naturais em suas mãos. A pergunta deixa de ser "funciona?" e vira "quanto de mim ainda escolhe, e quanto já apenas responde ao que foi despertado?"`,
  },
  cleric: {
    mid: `Oris aprende a medir o mal em respirações curtas, febres, olhos que evitam a luz. O incenso já não mascara nada; serve apenas para dar alguns segundos de coragem antes de nomear a ferida como ela é.`,
    late: `Perto do fim, ele entende que a Vigília o enviou para medir abismos, mas foi ele quem acabou sendo medido. Entre oração e silêncio, encontra um terceiro ofício: carregar gente quebrada sem esperar autorização do céu.`,
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
