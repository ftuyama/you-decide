import type { FactionId, GameState } from '../schema/index.ts';
import { MAX_LEVEL, xpToNextLevel } from '../progression/progression.ts';

/** Resumo humano do desfecho do trono (Act 4) para epílogo e abertura do gelo. */
function throneOutcomeLine(state: GameState): string {
  if (state.marks.includes('calvario_sealed')) {
    return 'Pagamento feito em **fé** e cicatriz: o subsolo cala porque **tu** decidiste carregar o peso em vez de o emprestar ao rumor.';
  }
  if (state.marks.includes('pact_bound')) {
    return 'O **Terceiro Sino** inscreveu-se na tua pele: a **corrupção** que sobe é o juro do silêncio que pediste em nome da cidade.';
  }
  if (state.marks.includes('morvayn_slain')) {
    return '**Ferro** no trono: Morvayn findou — o **eixo** segue; a ferida **afunda** onde o mapa desiste.';
  }
  return '';
}

/** Eco de facção sobre o que ficou em baixo (Vigília / Círculo / culto), condicionado a reputação. */
function factionThroneEcho(state: GameState): string {
  const v = state.reputation.vigilia ?? 0;
  const c = state.reputation.circulo ?? 0;
  const k = state.reputation.culto ?? 0;
  const sealed = state.marks.includes('calvario_sealed');
  const pact = state.marks.includes('pact_bound');
  const slain = state.marks.includes('morvayn_slain');

  if (sealed && v >= 1 && v >= c) {
    return 'Um **capeador** inclina a lanterna para a neve: *"Selar é língua da Vigília. Se o buraco obedece, talvez o prefeito volte a dormir."* Não pede saudação — pede testemunho.';
  }
  if (sealed && c >= 1 && c > v) {
    return 'Alguém no acampamento **desenha** um círculo na cinza e apaga antes de fechar: *"Selo bonito. A rede agradece quando ninguém grita o preço."*';
  }
  if (pact && k >= 0) {
    return 'Um **devoto** cheira o teu passo e sorri sem mostrar dentes: *"O Sino lembra-te a quem não lembra a si. Geada ou cidade — o silêncio é o mesmo metal."*';
  }
  if (slain && v >= 1 && v >= c) {
    return 'Um sal da Vigília roçou-te o ombro: *"Morvayn era laço. Cortaste. O tribunal de cima vai inventar versão — nós guardamos a lâmina."*';
  }
  if (slain && c >= 1 && c > v) {
    return 'Voz baixa do **Círculo** no frio: *"Mataram o nome no trono. Ótimo. Nomes mentem; corpos não."*';
  }
  if (pact && c >= 1 && c > v) {
    return 'Sussurro da **rede**: *"Assinaste o silêncio que a cidade já coreografava. Não julgamos — arquivamos."*';
  }
  return '';
}

function repTier(f: FactionId, state: GameState): string {
  const v = state.reputation[f] ?? 0;
  if (v <= -2) return 'hostil';
  if (v === -1) return 'frio';
  if (v === 0) return 'neutro';
  if (v === 1) return 'cordial';
  if (v === 2) return 'aliado';
  return 'devoto';
}

export function injectText(text: string, state: GameState): string {
  const lead = state.party[0];
  const companions = state.party.slice(1);
  const companionLine =
    companions.length === 0
      ? ''
      : `${companions.map((c) => c.name).join(' e ')} ${companions.length > 1 ? 'trocam' : 'troca'} um olhar que não pede permissão à pedra.`;
  const lv = state.level;
  const xpNext = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
  return text
    .replace(/\{\{playerName\}\}/g, state.playerName)
    .replace(/\{\{leadName\}\}/g, lead?.name ?? '???')
    .replace(/\{\{day\}\}/g, String(state.day ?? 1))
    .replace(/\{\{chapter\}\}/g, String(state.chapter))
    .replace(/\{\{corruption\}\}/g, String(state.resources.corruption))
    .replace(/\{\{supply\}\}/g, String(state.resources.supply))
    .replace(/\{\{gold\}\}/g, String(state.resources.gold ?? 0))
    .replace(/\{\{faith\}\}/g, String(state.resources.faith))
    .replace(/\{\{level\}\}/g, String(state.level))
    .replace(/\{\{xp\}\}/g, String(state.xp))
    .replace(/\{\{xpToNext\}\}/g, String(xpNext))
    .replace(/\{\{faction\.vigiliaTier\}\}/g, repTier('vigilia', state))
    .replace(/\{\{faction\.circuloTier\}\}/g, repTier('circulo', state))
    .replace(/\{\{faction\.cultoTier\}\}/g, repTier('culto', state))
    .replace(/\{\{companionLine\}\}/g, companionLine)
    .replace(/\{\{companionCount\}\}/g, String(companions.length))
    .replace(/\{\{throneOutcomeLine\}\}/g, throneOutcomeLine(state))
    .replace(/\{\{factionThroneEcho\}\}/g, factionThroneEcho(state));
}
