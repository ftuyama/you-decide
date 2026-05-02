import type { GameState } from '../../engine/schema/index.ts';
import companions from './data/companions.json';

type CompanionLoreBeat = {
  when: (state: GameState) => boolean;
  text: () => string | null;
};

const MIR_SHADOWS_LORE_PT = `O que ela chama de "roubar ao escuro" não é pilhagem: é tirar à noite o direito de mentir sobre o medo. Quem ouviu isso à luz do teu fogo fica com o nome dela um pouco mais pesado — e com a certeza de que ela já sabia o teu segredo antes de tu o dizeres.`;

const MIR_CRUZEIRO_LORE_PT = `No cruzeiro de pedra, trocou contigo verdades fracas como quem troca facas embrulhadas em pano: ninguém vê o fio até ser tarde. Desde aí, o mapa que ela desenha na cabeça inclui um canto teu que não aparece em nenhum corredor — só em silêncio acordado.`;

const MIR_FROST_LORE_PT = `No gelo, a palavra entre vocês congelou antes de partir: não é juramento de templo, é acordo de sobrevivência. Ela guarda isso como quem guarda um gancho — não para te puxar, mas para saber que ainda há onde agarrar quando a masmorra finge que não há chão.`;

const MIR_VOID_END_LORE_PT = `No fim do vazio, falou como quem já tinha despedido o corpo da história. A frase que te deixou não cabe no inventário: fica a vibrar quando fechas os olhos, lembrete de que ela escolheu testemunhar o teu nome até ao último sussurro.`;

const TOMAS_OATH_LORE_PT = `O juramento ao lume não foi teatro de ordem: foi ferro e pão partido, e a vergonha de carregar um escudo sem dono a afiar um pouco menos. Desde essa noite, o "dever" dele inclui a tua coluna vertebral — não como cadeia, como alinhamento.`;

const TOMAS_VOID_DUTY_LORE_PT = `No vazio, o dever deixou de ser só herança de ordem morta: tornou-se pergunta feita em voz baixa — a quem se serve quando não há muralha nem patente. A resposta que ele escolheu ficou-lhe no ombro como peso novo, reconhecível a quem caminha ao lado.`;

function beatBase(companionId: keyof typeof companions): CompanionLoreBeat {
  return {
    when: () => companionId in companions,
    text: () => companions[companionId]?.lorePt?.trim() ?? null,
  };
}

function beatMark(markId: string, paragraph: string): CompanionLoreBeat {
  return {
    when: (state) => state.marks.includes(markId),
    text: () => paragraph,
  };
}

const BEATS: Record<string, CompanionLoreBeat[]> = {
  rogue_mira: [
    beatBase('rogue_mira'),
    beatMark('mira_camp_shadows', MIR_SHADOWS_LORE_PT),
    beatMark('mira_cruzeiro_confidencia', MIR_CRUZEIRO_LORE_PT),
    beatMark('mira_frost_pact', MIR_FROST_LORE_PT),
    beatMark('mira_void_endtalk', MIR_VOID_END_LORE_PT),
  ],
  squire_tomas: [
    beatBase('squire_tomas'),
    beatMark('tomas_camp_oath', TOMAS_OATH_LORE_PT),
    beatMark('tomas_void_duty', TOMAS_VOID_DUTY_LORE_PT),
  ],
};

export function getCompanionLore(state: GameState, companionId: string): string {
  const beats = BEATS[companionId];
  if (!beats) return '';

  const parts: string[] = [];
  for (const beat of beats) {
    if (beat.when(state)) {
      const t = beat.text();
      if (t) parts.push(t);
    }
  }
  return parts.join('\n\n');
}

export function getCompanionStoryProgress(
  state: GameState,
  companionId: string
): { unlocked: number; total: number } {
  const beats = BEATS[companionId];
  if (!beats) return { unlocked: 0, total: 0 };

  let unlocked = 0;
  for (const beat of beats) {
    if (beat.when(state)) unlocked += 1;
  }
  return { unlocked, total: beats.length };
}
