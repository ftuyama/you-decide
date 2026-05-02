import type { Effect, FactionId, GameState } from '../schema/index.ts';
import { GameStateSchema } from '../schema/index.ts';
import type { EventBus } from './eventBus.ts';
import { beginEncounter } from '../combat/encounter.ts';
import type { GameData } from '../data/gameData.ts';
import { pickWildOutcome, wildEncounterVictoryOverride } from '../world/exploration.ts';
import { addXp } from '../progression/progression.ts';
import { initialKnownSpellIds } from '../progression/spellsKnown.ts';
import {
  createInitialState,
  createPlayerCharacter,
  extraLifeReadyFromFaith,
  syncLeadPassiveStats,
} from './state.ts';
import { clampLeadStat, tickActiveBuffs, type LeadStatAttr } from '../progression/leadStats.ts';
import {
  adjustCompanionFriendshipScore,
  FRIENDSHIP_INITIAL_RECRUIT,
  getCompanionFriendshipScore,
  notifyCompanionFriendshipChange,
  syncCompanionPartyWithFriendship,
} from '../progression/companionFriendship.ts';
import { applyConsumableToCharacter, isConsumable, removeOneInventoryItem } from '../progression/consumables.ts';
import { injectText } from './template.ts';
import {
  clampReputation,
  computeAddRepResult,
  defaultFactionGainPending,
} from '../progression/reputation.ts';

export { tickActiveBuffs };

const ATTR_LABEL: Record<LeadStatAttr, string> = {
  str: 'STR',
  agi: 'AGI',
  mind: 'MEN',
  luck: 'SOR',
};

function humanizeMarkId(mark: string): string {
  return mark
    .split('_')
    .map((w) => (w.length ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Título de marca para UI: registo da campanha, depois humanização do id. */
export function displayTitleForMark(mark: string, data: GameData): string {
  return data.journeyMarks[mark]?.name ?? humanizeMarkId(mark);
}

const RESOURCE_LABEL: Record<'gold' | 'supply' | 'faith' | 'corruption', string> = {
  gold: 'Gold',
  supply: 'Suprimento',
  faith: 'Fé',
  corruption: 'Corrupção',
};

/** Caps para `addResource` — alinhar com `schema.ts` `resources`. */
const RESOURCE_MAX = {
  gold: 999,
  supply: 10,
  faith: 5,
  corruption: 10,
} as const;

function resourceDebuffSubtitle(resource: keyof typeof RESOURCE_LABEL): string {
  switch (resource) {
    case 'corruption':
      return 'Marca sombria — o pacto cobra o preço';
    case 'faith':
      return 'A convicção abala-se';
    case 'supply':
      return 'Recursos a escassear';
    case 'gold':
      return 'Perda material';
    default:
      return '';
  }
}

function resourceGainSubtitle(resource: keyof typeof RESOURCE_LABEL): string {
  switch (resource) {
    case 'corruption':
      return 'A sombra recua';
    case 'faith':
      return 'A conviccao fortalece';
    case 'supply':
      return 'Recursos repostos';
    case 'gold':
      return 'Ganho material';
    default:
      return '';
  }
}

const FACTION_NAME_PT: Record<FactionId, string> = {
  vigilia: 'Vigília',
  circulo: 'Círculo',
  culto: 'Culto',
};

const REPUTATION_TONE_UP_PT: Record<FactionId, readonly string[]> = {
  vigilia: [
    'Ecoa nos corredores da ordem: o teu nome ganha um selo menos sombrio nos arquivos da Vigília.',
    'Oficiais murmuram com outra cadência — patrulha e juramento passam a contar contigo, ainda que com ferro na voz.',
    'Um escrivão inclina a pena: onde antes só havia desconfiança medida, agora há lugar para um voto de cautela favorável.',
    'A lanterna da Vigília inclina-se um palmo na tua direção; não é abraço, é reconhecimento de quem serve sem ruído.',
  ],
  circulo: [
    'O cinzento inclina-se: nos arquivos do Círculo, o teu símbolo ganha um traço que não apaga com o primeiro sopro.',
    'Troca-se sorte por assinatura — o Círculo anota o feito como quem fecha metade de um pacto ainda aberto.',
    'Rituais frágeis aprendem o teu nome; quem empresta destino cobra, mas hoje o saldo pende a teu favor.',
    'Uma linha nova no livro cinzento: não é bênção, é contrato — e o mundo leu a cláusula com mais brandura.',
  ],
  culto: [
    'O Terceiro Sino parece mais perto sem haver torre: o Culto carimba o teu passo com interesse que não é benigno, mas é teu.',
    'Devotos sussurram versículos onde antes calavam; a corrupção, quando te nomeia, faz-o quase como elegia.',
    'Marca-se o pergaminho com cinza e vela: o Culto guarda o teu feito como quem guarda ferramenta para noite melhor.',
    'Eco que não devia existir reconhece-te; quem ouve o sino sem badalação sabe que o Culto te contou entre os seus.',
  ],
};

const REPUTATION_TONE_DOWN_PT: Record<FactionId, readonly string[]> = {
  vigilia: [
    'Raspa-se o registo: a Vigília anota desconfiança onde antes só havia silêncio disciplinado.',
    'Patrulhas trocam olhar quando passes — juramento virou suspeita, e o mundo nota o peso novo na couraça.',
    'Um oficial fecha o dossiê com gesto seco: honra tem gosto de cinza, e hoje o teu nome soube a ferro.',
    'Ordem não perdoa rumor: nos corredores, o teu nome desce de tom; quem serve nota quando deixa de ser ferramenta confiável.',
  ],
  circulo: [
    'O ritual recua: o Círculo descreve o teu nome com traço mais frio, como quem adia uma dívida que não esquece.',
    'Símbolos que brilhavam hesitam; o cinzento fecha sem ti, e o empréstimo de sorte cobra juros em silêncio.',
    'Raspa-se margem no livro de contas — o Círculo não grita, apenas deixa de inclinar a balança a teu favor.',
    'Quem troca destino por sinal aprende o preço: hoje o Círculo leu o teu feito com olhos de credor impaciente.',
  ],
  culto: [
    'Alguém no Culto apaga uma linha que te favorecia; ouve-se o sino sem torre, e o som não te chama.',
    'Devotos desviam o olhar onde antes bendiziam sombras; a corrupção ainda te conhece, mas já não te acolhe com o mesmo riso.',
    'Marca-se o pergaminho com salitre e cinza: o Terceiro Sino lembra o teu nome para advertência, não para culto.',
    'Onde havia interesse sombrio, agora há recuo ritual: o Culto guarda o teu feito como quem guarda faca embrulhada.',
  ],
};

const REPUTATION_UI_SLOW_LEDGER_PT: readonly string[] = [
  'Um gesto ficou assinado nas margens do teu registo; falta outro feito para que o numero mude nos arquivos da faccao.',
  'Os escribas anotam o rumor e fecham o livro sem mexer no marcador: ainda nao ha peso suficiente para virar a pagina.',
  'A faccao ouviu, mas guardou o eco em nota de rodape; o saldo so muda quando o proximo sinal confirmar a tendencia.',
  'Nos corredores, teu nome circula em voz baixa: a reputacao ainda nao desloca o ponteiro oficial.',
];

const REPUTATION_UI_CAPPED_DIRECT_PT: readonly string[] = [
  'Os escribas ja nao tem onde subir ou descer este nome: o tom mantem-se, por ora, inamovivel.',
  'A margem do registro terminou; qualquer novo abalo bate no limite e retorna sem alterar o numero.',
  'Selo no topo e lacre no fundo: nesta faccao, tua reputacao encostou no extremo permitido.',
  'O arquivo range, mas nao cede: os limites da faccao travam qualquer ajuste adicional neste momento.',
];

function pickRandomUiLine(lines: readonly string[]): string {
  if (lines.length === 0) return '';
  const idx = Math.floor(Math.random() * lines.length);
  return lines[idx] ?? '';
}

function pickReputationToneLine(lines: readonly string[], prev: number, next: number, faction: FactionId): string {
  if (lines.length === 0) return '';
  let h = 0;
  for (let i = 0; i < faction.length; i++) {
    h = (h * 31 + faction.charCodeAt(i)!) >>> 0;
  }
  const idx = (h + prev * 17 + next * 13) % lines.length;
  return lines[idx]!;
}

function reputationTonePt(faction: FactionId, prev: number, next: number): string {
  if (next > prev) {
    return pickReputationToneLine(REPUTATION_TONE_UP_PT[faction], prev, next, faction);
  }
  if (next < prev) {
    return pickReputationToneLine(REPUTATION_TONE_DOWN_PT[faction], prev, next, faction);
  }
  return '';
}

function emitReputationUi(
  bus: EventBus,
  faction: FactionId,
  prev: number,
  next: number,
  kind: 'standing' | 'slowLedger' | 'cappedDirect'
): void {
  const name = FACTION_NAME_PT[faction];
  if (kind === 'slowLedger') {
    bus.emit({
      type: 'statusHighlight',
      variant: 'neutral',
      title: `${name} — rumor em aberto`,
      subtitle: pickRandomUiLine(REPUTATION_UI_SLOW_LEDGER_PT),
    });
    return;
  }
  if (kind === 'cappedDirect') {
    bus.emit({
      type: 'statusHighlight',
      variant: 'neutral',
      title: `${name} — margens esgotadas`,
      subtitle: pickRandomUiLine(REPUTATION_UI_CAPPED_DIRECT_PT),
    });
    return;
  }
  const improved = next > prev;
  const variant: 'good' | 'bad' | 'neutral' = improved ? 'good' : next < prev ? 'bad' : 'neutral';
  const delta = next - prev;
  const deltaStr = delta === 0 ? '' : ` (${delta > 0 ? '+' : ''}${delta})`;
  bus.emit({
    type: 'statusHighlight',
    variant,
    title: `${name} — reputação ${deltaStr ? (improved ? 'sobe' : 'cai') : 'ajusta-se'}${deltaStr}`,
    subtitle: `${reputationTonePt(faction, prev, next)} Valor: ${prev} → ${next}.`,
  });
}

function uniqueTitles(input: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of input) {
    const title = raw.trim();
    if (!title || seen.has(title)) continue;
    seen.add(title);
    out.push(title);
  }
  return out.slice(-12);
}

function topFaction(state: GameState): FactionId {
  const list: FactionId[] = ['vigilia', 'circulo', 'culto'];
  let best: FactionId = 'vigilia';
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const id of list) {
    const score = state.reputation[id] ?? 0;
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

function resolveLegacyTitle(state: GameState): string {
  const lead = state.party[0];
  const faction = topFaction(state);
  const hasMira = state.party.some((p) => p.id === 'mira');
  const hasTomas = state.party.some((p) => p.id === 'tomas');
  const corruption = state.resources.corruption ?? 0;
  const faith = state.resources.faith ?? 0;
  if (faction === 'culto' && corruption >= 6) return 'Arauto do Terceiro Sino';
  if (faction === 'vigilia' && faith >= 3) return 'Sentinela das Cinzas';
  if (faction === 'circulo' && (lead?.mind ?? 0) >= 12) return 'Cartógrafo do Círculo Cinzento';
  if (hasMira && hasTomas) return 'Portador dos Dois Ecos';
  return 'Sobrevivente da Pedra Muda';
}

function buildLegacySummary(state: GameState): string {
  const faction = topFaction(state);
  const companions = state.party
    .slice(1)
    .map((p) => p.name)
    .slice(0, 2);
  const factionLabel = FACTION_NAME_PT[faction];
  const lead = state.party[0];
  const path = lead?.path?.trim();
  const pathLabel = path && path.length > 0 ? path : 'Sem arquétipo fixo';
  const compLabel = companions.length > 0 ? companions.join(' e ') : 'sem companhia fixa';
  return `Run anterior: ${factionLabel} em destaque, ${compLabel}, trilha ${pathLabel}.`;
}

function computeLegacyEchoGain(state: GameState): number {
  const base = Math.floor(Math.max(0, state.chapter - 1) / 2);
  const levelBonus = Math.floor(Math.max(0, state.level - 1) / 3);
  const markBonus = Math.min(3, Math.floor(state.marks.length / 6));
  return Math.max(1, base + levelBonus + markBonus);
}

function buildCompoundLegacyFlags(state: GameState): Record<string, boolean> {
  const faction = topFaction(state);
  const lead = state.party[0];
  return {
    legacy_combo_faction_companion:
      (faction === 'vigilia' && state.party.some((p) => p.id === 'mira')) ||
      (faction === 'culto' && state.party.some((p) => p.id === 'tomas')),
    legacy_combo_path_faction:
      !!lead?.path &&
      ((faction === 'circulo' && lead.path.includes('arc')) ||
        (faction === 'vigilia' && lead.path.includes('cavaleiro')) ||
        (faction === 'culto' && lead.path.includes('trevas'))),
    legacy_combo_faith_corruption:
      (state.resources.faith ?? 0) >= 3 && (state.resources.corruption ?? 0) >= 4,
  };
}

/** Validação Zod completa só em dev; em build de produção confia nos ramos de `applyOne` (save/load valida à parte). */
function finalizeAppliedState(s: GameState): GameState {
  if (import.meta.env.DEV) {
    return GameStateSchema.parse(s);
  }
  return s;
}

export function applyEffects(
  state: GameState,
  effects: Effect[],
  ctx: { sceneId: string; data: GameData; bus: EventBus }
): GameState {
  let s: GameState = { ...state, party: state.party.map((p) => ({ ...p })) };
  for (const e of effects) {
    s = applyOne(s, e, ctx);
    s = syncLeadPassiveStats(s);
  }
  return finalizeAppliedState(s);
}

function applyOne(
  state: GameState,
  e: Effect,
  ctx: { sceneId: string; data: GameData; bus: EventBus }
): GameState {
  const bus = ctx.bus;
  switch (e.op) {
    case 'setFlag':
      bus.emit({ type: 'effect.applied', op: e.op });
      return { ...state, flags: { ...state.flags, [e.key]: e.value } };
    case 'toggleFlag': {
      const cur = !!state.flags[e.key];
      return { ...state, flags: { ...state.flags, [e.key]: !cur } };
    }
    case 'addMark': {
      if (state.marks.includes(e.mark)) return state;
      const isBad =
        /wound|curse|maled|bleed|fract|broken|rot|po[cç]o|mire|hex|scarred|spoiled|snare|burned|taint|torn|jarred/i.test(
          e.mark
        );
      bus.emit({
        type: 'statusHighlight',
        variant: isBad ? 'bad' : 'neutral',
        title: displayTitleForMark(e.mark, ctx.data),
        subtitle: 'Nova marca no personagem',
      });
      return { ...state, marks: [...state.marks, e.mark] };
    }
    case 'removeMark':
      return { ...state, marks: state.marks.filter((m) => m !== e.mark) };
    case 'grantLeadStoryPassive': {
      if (state.leadStoryPassives.includes(e.id)) return state;
      const def = ctx.data.leadStoryPassives[e.id];
      bus.emit({
        type: 'statusHighlight',
        variant: 'neutral',
        title: def?.name ?? humanizeMarkId(e.id),
        subtitle: 'Novo passivo de história',
      });
      return { ...state, leadStoryPassives: [...state.leadStoryPassives, e.id] };
    }
    case 'addRep': {
      const faction = e.faction;
      const prev = state.reputation[faction] ?? 0;
      const fgp = state.factionGainPending ?? defaultFactionGainPending();
      const pendingIn: 0 | 1 = fgp[faction] === 1 ? 1 : 0;

      if (e.delta === 0) {
        return state;
      }

      const { rep, pending } = computeAddRepResult({
        prevRep: prev,
        pending: pendingIn,
        delta: e.delta,
        directGain: e.directGain,
      });

      bus.emit({ type: 'reputation.changed', faction, value: rep });

      if (rep !== prev) {
        emitReputationUi(bus, faction, prev, rep, 'standing');
      } else if (e.delta > 0 && e.directGain) {
        emitReputationUi(bus, faction, prev, rep, 'cappedDirect');
      } else if (e.delta > 0 && !e.directGain) {
        emitReputationUi(bus, faction, prev, rep, 'slowLedger');
      }

      const isDirectPositiveGain = e.delta > 0 && e.directGain === true;
      if (isDirectPositiveGain) {
        return {
          ...state,
          reputation: { ...state.reputation, [faction]: rep },
        };
      }

      return {
        ...state,
        reputation: { ...state.reputation, [faction]: rep },
        factionGainPending: { ...fgp, [faction]: pending },
      };
    }
    case 'setRep': {
      const prev = state.reputation[e.faction] ?? 0;
      const next = clampReputation(e.value);
      bus.emit({ type: 'reputation.changed', faction: e.faction, value: next });
      if (next !== prev) {
        emitReputationUi(bus, e.faction, prev, next, 'standing');
      }
      return {
        ...state,
        reputation: { ...state.reputation, [e.faction]: next },
      };
    }
    case 'addResource': {
      const r = { ...state.resources };
      let actual = 0;
      const res = e.resource;
      if (res === 'gold') {
        const before = r.gold ?? 0;
        r.gold = Math.max(0, Math.min(RESOURCE_MAX.gold, before + e.delta));
        actual = r.gold - before;
      } else if (res === 'supply') {
        const before = r.supply;
        r.supply = Math.max(0, Math.min(RESOURCE_MAX.supply, r.supply + e.delta));
        actual = r.supply - before;
      } else if (res === 'faith') {
        const before = r.faith;
        r.faith = Math.max(0, Math.min(RESOURCE_MAX.faith, r.faith + e.delta));
        actual = r.faith - before;
      } else {
        const before = r.corruption;
        r.corruption = Math.max(0, Math.min(RESOURCE_MAX.corruption, r.corruption + e.delta));
        actual = r.corruption - before;
      }
      if (actual !== 0) {
        const isDebuff =
          (res === 'corruption' && actual > 0) ||
          (res === 'faith' && actual < 0) ||
          (res === 'supply' && actual < 0) ||
          (res === 'gold' && actual < 0);
        bus.emit({
          type: 'statusHighlight',
          variant: isDebuff ? 'debuff' : 'good',
          title: `${RESOURCE_LABEL[res]} ${actual > 0 ? '+' : ''}${actual}`,
          subtitle: isDebuff ? resourceDebuffSubtitle(res) : resourceGainSubtitle(res),
        });
      }
      return {
        ...state,
        resources: r,
        extraLifeReady: extraLifeReadyFromFaith(r.faith),
      };
    }
    case 'advanceDay': {
      const nextDay = (state.day ?? 1) + 1;
      bus.emit({ type: 'time.dayAdvanced', day: nextDay });
      return GameStateSchema.parse({ ...state, day: nextDay });
    }
    case 'campRest': {
      if (state.resources.supply < 1) return state;
      bus.emit({ type: 'camp.rest' });
      const res = { ...state.resources, supply: state.resources.supply - 1 };
      const party = state.party.map((p) => ({
        ...p,
        hp: p.maxHp,
        mana: p.maxMana,
        stress: 0,
      }));
      return { ...state, resources: res, party };
    }
    case 'setChapter':
      return { ...state, chapter: e.chapter };
    case 'grantItem': {
      const def = ctx.data.items[e.itemId];
      if (!def) return state;
      const stackable = isConsumable(def);
      if (!stackable && state.inventory.includes(e.itemId)) return state;
      bus.emit({ type: 'item.acquired', itemId: e.itemId });
      return { ...state, inventory: [...state.inventory, e.itemId] };
    }
    case 'removeItem': {
      const next = removeOneInventoryItem(state.inventory, e.itemId);
      if (!next) return state;
      return { ...state, inventory: next };
    }
    case 'equipItem': {
      const idx = e.partyIndex ?? 0;
      const target = state.party[idx];
      if (!target) return state;
      const def = ctx.data.items[e.itemId];
      if (!def) return state;
      if (def.slot === 'consumable') return state;
      const inInv = state.inventory.includes(e.itemId);
      const alreadyEquipped =
        target.weaponId === e.itemId ||
        target.armorId === e.itemId ||
        target.relicId === e.itemId;
      if (!inInv && !alreadyEquipped) return state;
      const key =
        def.slot === 'weapon' ? 'weaponId' : def.slot === 'armor' ? 'armorId' : 'relicId';
      if (target[key] === e.itemId) return state;
      let inv = [...state.inventory];
      if (inInv) {
        const ix = inv.indexOf(e.itemId);
        if (ix >= 0) inv = [...inv.slice(0, ix), ...inv.slice(ix + 1)];
      }
      const prev = target[key];
      if (prev && prev !== e.itemId) inv = [...inv, prev];
      return {
        ...state,
        inventory: inv,
        party: state.party.map((p, i) => (i === idx ? { ...p, [key]: e.itemId } : p)),
      };
    }
    case 'unequipSlot': {
      const idx = e.partyIndex ?? 0;
      const target = state.party[idx];
      if (!target) return state;
      const key =
        e.slot === 'weapon' ? 'weaponId' : e.slot === 'armor' ? 'armorId' : 'relicId';
      const prev = target[key];
      if (!prev) return state;
      let inv = [...state.inventory];
      if (!inv.includes(prev)) inv = [...inv, prev];
      return {
        ...state,
        inventory: inv,
        party: state.party.map((p, i) => (i === idx ? { ...p, [key]: null } : p)),
      };
    }
    case 'goto':
      return { ...state, sceneId: e.sceneId, mode: 'story' };
    case 'addDiary': {
      const line = injectText(e.text, state);
      bus.emit({ type: 'diary.entryAdded', text: line });
      return { ...state, diary: [...state.diary, line] };
    }
    case 'startCombat': {
      const enc = ctx.data.encounters[e.encounterId];
      if (!enc) {
        console.error(`Encounter not found: ${e.encounterId} @ ${ctx.sceneId}`);
        return state;
      }
      bus.emit({ type: 'combat.start', encounterId: e.encounterId });
      return beginEncounter(state, enc, ctx.data, {
        returnScene: ctx.sceneId,
        onVictory: e.onVictory,
        onFlee: e.onFlee,
        onDefeat: e.onDefeat,
      });
    }
    case 'startWildEncounterFromGraph': {
      const pick = pickWildOutcome(state, e.graphId);
      let s: GameState = { ...state, rngSeed: pick.nextSeed };
      const returnTo = e.returnSceneId ?? ctx.sceneId;
      if (pick.kind === 'scene') {
        return tickActiveBuffs({ ...s, sceneId: pick.sceneId, mode: 'story' });
      }
      const enc = ctx.data.encounters[pick.encounterId];
      if (!enc) {
        console.error(`Encounter not found: ${pick.encounterId} @ ${ctx.sceneId}`);
        return s;
      }
      const onVictory = wildEncounterVictoryOverride(e.graphId, pick.encounterId) ?? returnTo;
      bus.emit({ type: 'combat.start', encounterId: pick.encounterId });
      return beginEncounter(s, enc, ctx.data, {
        returnScene: returnTo,
        onVictory,
        onFlee: returnTo,
        onDefeat: 'shared/game_over',
      });
    }
    case 'recruit': {
      const def = ctx.data.companions[e.companionId];
      if (!def) return state;
      if (state.party.length >= 3) return state;
      if (state.party.some((p) => p.id === e.companionId)) return state;
      const companion = {
        id: def.id,
        name: def.name,
        class: 'knight' as const,
        str: def.str,
        agi: def.agi,
        mind: def.mind,
        luck: def.luck ?? 8,
        mana: 0,
        maxMana: 0,
        hp: def.hp,
        maxHp: def.maxHp,
        stress: 0,
        weaponId: null,
        armorId: null,
        relicId: null,
        critRatio: 0,
        specialUsedThisCombat: false,
        path: null,
      };
      const priorFriend = state.companionFriendship[e.companionId];
      const friendScore =
        priorFriend !== undefined ? priorFriend : FRIENDSHIP_INITIAL_RECRUIT;
      const withFriend: GameState = {
        ...state,
        party: [...state.party, companion],
        companionsAvailable: state.companionsAvailable.filter((c) => c !== e.companionId),
        companionFriendship: {
          ...state.companionFriendship,
          [e.companionId]: friendScore,
        },
      };
      return syncCompanionPartyWithFriendship(withFriend, ctx.data);
    }
    case 'dismissCompanion':
      return {
        ...state,
        party: state.party.filter((p) => p.id !== e.companionId),
      };
    case 'setAsciiMap':
      return {
        ...state,
        asciiMap: { mapId: e.mapId },
      };
    case 'clearAsciiMap':
      return { ...state, asciiMap: null };
    case 'setExploration': {
      const cur = state.exploration;
      if (cur && cur.graphId === e.graphId && cur.nodeId === e.nodeId) {
        return state;
      }
      return {
        ...state,
        exploration: { graphId: e.graphId, nodeId: e.nodeId },
      };
    }
    case 'clearExploration':
      return { ...state, exploration: null };
    case 'adjustLeadStress': {
      const lead = state.party[0];
      if (!lead) return state;
      const next = Math.max(0, Math.min(4, lead.stress + e.delta));
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, stress: next } : p)),
      };
    }
    case 'initClass': {
      const heroName = ctx.data.heroNarrative.defaultHeroName(e.class);
      const pc = createPlayerCharacter(heroName, e.class);
      const knownSpells = initialKnownSpellIds(pc, ctx.data);
      return {
        ...state,
        party: [pc],
        playerName: heroName,
        level: 1,
        xp: 0,
        knownSpells,
        inventory: state.inventory,
      };
    }
    case 'learnSpell': {
      const sp = ctx.data.spells[e.spellId];
      if (!sp) return state;
      if (state.knownSpells.includes(e.spellId)) return state;
      bus.emit({
        type: 'statusHighlight',
        variant: 'good',
        title: `Magia: ${sp.name}`,
        subtitle: 'Nova magia aprendida',
      });
      return { ...state, knownSpells: [...state.knownSpells, e.spellId] };
    }
    case 'addXp': {
      return addXp(state, e.amount, { bus, data: ctx.data }).state;
    }
    case 'addMana': {
      const lead = state.party[0];
      if (!lead) return state;
      const nm = Math.max(0, Math.min(lead.maxMana, lead.mana + e.amount));
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, mana: nm } : p)),
      };
    }
    case 'setPath': {
      const lead = state.party[0];
      if (!lead) return state;
      let s: GameState = {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, path: e.path } : p)),
      };
      if (e.path) {
        bus.emit({
          type: 'statusHighlight',
          variant: 'neutral',
          title: ctx.data.heroNarrative.getHeroClassLabel(lead.class, e.path),
          subtitle: 'Novo arquétipo narrativo',
        });
        const bonus = ctx.data.heroNarrative.getPathUnlockBonus(lead.class, e.path);
        if (bonus) {
          if (bonus.stats) {
            for (const key of ['str', 'agi', 'mind', 'luck'] as const) {
              const delta = bonus.stats[key];
              if (delta !== undefined && delta !== 0) {
                s = applyOne(s, { op: 'adjustLeadStat', attr: key, delta }, ctx);
              }
            }
          }
          if (bonus.addXp !== undefined && bonus.addXp > 0) {
            s = applyOne(s, { op: 'addXp', amount: bonus.addXp }, ctx);
          }
          if (bonus.addResource) {
            s = applyOne(s, {
              op: 'addResource',
              resource: bonus.addResource.resource,
              delta: bonus.addResource.delta,
            }, ctx);
          }
        }
      }
      return s;
    }
    case 'adjustLeadStat': {
      const lead = state.party[0];
      if (!lead) return state;
      const attr = e.attr as LeadStatAttr;
      const cur = lead[attr];
      const nextVal = clampLeadStat(attr, cur + e.delta);
      const actual = nextVal - cur;
      if (actual !== 0) {
        const label = ATTR_LABEL[attr];
        bus.emit({
          type: 'statusHighlight',
          variant: actual < 0 ? 'bad' : 'good',
          title: `${label} ${actual > 0 ? '+' : ''}${actual}`,
          subtitle:
            actual < 0
              ? 'Efeito permanente no personagem'
              : 'Melhoria permanente no personagem',
        });
      }
      return {
        ...state,
        party: state.party.map((p, i) => (i === 0 ? { ...p, [attr]: nextVal } : p)),
      };
    }
    case 'multiplyLeadHp': {
      const lead = state.party[0];
      if (!lead) return state;
      const f = e.factor;
      const newMaxHp = Math.max(1, Math.floor(lead.maxHp * f));
      const newHp = Math.min(newMaxHp, Math.max(1, Math.floor(lead.hp * f)));
      const lostMax = lead.maxHp - newMaxHp;
      bus.emit({
        type: 'statusHighlight',
        variant: 'bad',
        title: lostMax > 0 ? `−${lostMax} PV máx.` : `PV máx. ${newMaxHp}`,
        subtitle: 'O altar cobra quem recua — carne e teto de vida',
      });
      return {
        ...state,
        party: state.party.map((p, i) =>
          i === 0 ? { ...p, maxHp: newMaxHp, hp: newHp } : p,
        ),
      };
    }
    case 'grantTemporaryBuff': {
      const id = `buff_${ctx.sceneId}_${state.rngSeed}_${e.attr}_${state.activeBuffs.length}`;
      const label = ATTR_LABEL[e.attr as LeadStatAttr];
      bus.emit({
        type: 'statusHighlight',
        variant: e.delta >= 0 ? 'good' : 'bad',
        title: `${label} ${e.delta >= 0 ? '+' : ''}${e.delta} · ${e.remainingScenes} cena(s)`,
        subtitle: 'Buff temporário (decresce ao mudar de cena)',
      });
      return {
        ...state,
        activeBuffs: [
          ...state.activeBuffs,
          {
            id,
            attr: e.attr,
            delta: e.delta,
            remainingScenes: e.remainingScenes,
          },
        ],
        rngSeed: (state.rngSeed + 0x9e37) >>> 0,
      };
    }
    case 'useConsumable': {
      const def = ctx.data.items[e.itemId];
      if (!def || !isConsumable(def)) return state;
      const ti = e.targetIndex ?? 0;
      if (ti < 0 || ti >= state.party.length) return state;
      const target = state.party[ti];
      if (!target || target.hp <= 0) return state;
      const inv = removeOneInventoryItem(state.inventory, e.itemId);
      if (!inv) return state;
      const updated = applyConsumableToCharacter(def, target);
      const party = state.party.map((p, i) => (i === ti ? updated : p));
      bus.emit({
        type: 'statusHighlight',
        variant: 'good',
        title: def.name,
        subtitle: ti === 0 ? 'Usada' : `Usada em ${target.name}`,
      });
      return { ...state, inventory: inv, party };
    }
    case 'adjustCompanionFriendship': {
      const key = e.onceFlag;
      if (key && state.flags[key]) return state;
      const before = getCompanionFriendshipScore(state, e.companionId);
      let s = adjustCompanionFriendshipScore(state, e.companionId, e.delta);
      const after = getCompanionFriendshipScore(s, e.companionId);
      s = syncCompanionPartyWithFriendship(s, ctx.data);
      if (key) {
        s = { ...s, flags: { ...s.flags, [key]: true } };
      }
      notifyCompanionFriendshipChange(ctx.bus, ctx.data, e.companionId, before, after);
      return s;
    }
    case 'resetRun': {
      const gain = computeLegacyEchoGain(state);
      const title = resolveLegacyTitle(state);
      const nextLegacy: GameState['legacy'] = {
        echoes: Math.max(0, (state.legacy?.echoes ?? 0) + gain),
        titles: uniqueTitles([...(state.legacy?.titles ?? []), title]),
        lastRunSummary: buildLegacySummary(state),
        lastRunEchoGain: gain,
      };
      const next = createInitialState(ctx.data.campaign, state.rngSeed);
      const legacyFlags = buildCompoundLegacyFlags(state);
      return {
        ...next,
        legacy: nextLegacy,
        flags: { ...next.flags, ...legacyFlags },
        diary: [
          ...next.diary,
          `${nextLegacy.lastRunSummary} +${gain} ecos herdados; título registrado: ${title}.`,
        ],
      };
    }
    default:
      return state;
  }
}
