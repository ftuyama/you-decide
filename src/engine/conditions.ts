import type { ClassId, Condition, FactionId, GameState } from './schema';

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
  if ('hasItem' in cond) return state.inventory.includes(cond.hasItem);
  if ('noItem' in cond) return !state.inventory.includes(cond.noItem);
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
  if ('corruption' in cond) {
    const c = state.resources.corruption;
    if (cond.corruption.gte !== undefined && c < cond.corruption.gte) return false;
    if (cond.corruption.lte !== undefined && c > cond.corruption.lte) return false;
    return true;
  }
  return true;
}
