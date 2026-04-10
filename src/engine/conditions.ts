import type { ClassId, Condition, FactionId, GameState } from './schema.ts';

/** Inventário ou equipado no líder (para hasItem / noItem). */
export function leadOwnsItem(state: GameState, itemId: string): boolean {
  if (state.inventory.includes(itemId)) return true;
  const lead = state.party[0];
  if (!lead) return false;
  return lead.weaponId === itemId || lead.armorId === itemId || lead.relicId === itemId;
}

export function evaluateCondition(cond: Condition | undefined, state: GameState): boolean {
  if (cond === undefined) return true;
  if ('all' in cond) return cond.all.every((c) => evaluateCondition(c, state));
  if ('any' in cond) return cond.any.some((c) => evaluateCondition(c, state));
  if ('not' in cond) return !evaluateCondition(cond.not, state);
  if ('rep' in cond) {
    const v = state.reputation[cond.rep.faction as FactionId] ?? 0;
    if (cond.rep.gte !== undefined && v < cond.rep.gte) return false;
    if (cond.rep.lte !== undefined && v > cond.rep.lte) return false;
    return true;
  }
  if ('flag' in cond) return !!state.flags[cond.flag];
  if ('noFlag' in cond) return !state.flags[cond.noFlag];
  if ('mark' in cond) return state.marks.includes(cond.mark);
  if ('noMark' in cond) return !state.marks.includes(cond.noMark);
  if ('leadStoryPassive' in cond) return state.leadStoryPassives.includes(cond.leadStoryPassive);
  if ('noLeadStoryPassive' in cond) return !state.leadStoryPassives.includes(cond.noLeadStoryPassive);
  if ('hasItem' in cond) return leadOwnsItem(state, cond.hasItem);
  if ('noItem' in cond) return !leadOwnsItem(state, cond.noItem);
  if ('resource' in cond) {
    const r = cond.resource;
    if (r.supply) {
      if (r.supply.gte !== undefined && state.resources.supply < r.supply.gte) return false;
      if (r.supply.lte !== undefined && state.resources.supply > r.supply.lte) return false;
    }
    if (r.faith) {
      if (r.faith.gte !== undefined && state.resources.faith < r.faith.gte) return false;
      if (r.faith.lte !== undefined && state.resources.faith > r.faith.lte) return false;
    }
    if (r.corruption) {
      if (r.corruption.gte !== undefined && state.resources.corruption < r.corruption.gte)
        return false;
      if (r.corruption.lte !== undefined && state.resources.corruption > r.corruption.lte)
        return false;
    }
    if (r.mana) {
      const lead = state.party[0];
      const m = lead?.mana ?? 0;
      if (r.mana.gte !== undefined && m < r.mana.gte) return false;
      if (r.mana.lte !== undefined && m > r.mana.lte) return false;
    }
    if (r.gold) {
      const g = state.resources.gold ?? 0;
      if (r.gold.gte !== undefined && g < r.gold.gte) return false;
      if (r.gold.lte !== undefined && g > r.gold.lte) return false;
    }
    return true;
  }
  if ('class' in cond) {
    const lead = state.party[0];
    return lead?.class === (cond.class as ClassId);
  }
  if ('path' in cond) {
    const lead = state.party[0];
    return lead?.path === cond.path;
  }
  if ('chapter' in cond) {
    if (cond.chapter.gte !== undefined && state.chapter < cond.chapter.gte) return false;
    if (cond.chapter.lte !== undefined && state.chapter > cond.chapter.lte) return false;
    return true;
  }
  if ('level' in cond) {
    if (cond.level.gte !== undefined && state.level < cond.level.gte) return false;
    if (cond.level.lte !== undefined && state.level > cond.level.lte) return false;
    return true;
  }
  if ('corruption' in cond) {
    const c = state.resources.corruption;
    if (cond.corruption.gte !== undefined && c < cond.corruption.gte) return false;
    if (cond.corruption.lte !== undefined && c > cond.corruption.lte) return false;
    return true;
  }
  if ('companionCount' in cond) {
    const n = Math.max(0, state.party.length - 1);
    const cc = cond.companionCount;
    if (cc.gte !== undefined && n < cc.gte) return false;
    if (cc.lte !== undefined && n > cc.lte) return false;
    return true;
  }
  if ('companionInParty' in cond) {
    return state.party.some((p) => p.id === cond.companionInParty);
  }
  if ('dayMod' in cond) {
    const d = state.day ?? 1;
    const { mod, eq } = cond.dayMod;
    return mod > 0 && d % mod === eq;
  }
  if ('day' in cond) {
    const d = state.day ?? 1;
    if (cond.day.gte !== undefined && d < cond.day.gte) return false;
    if (cond.day.lte !== undefined && d > cond.day.lte) return false;
    return true;
  }
  return true;
}
