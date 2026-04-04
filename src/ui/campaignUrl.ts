import { isCampaignRegistered } from '../campaigns/registry';

export type AppView = 'game' | 'scenes-graph';

/** Reads `?campaign=<id>`; falls back to calvario if missing or unknown. */
export function resolveCampaignIdFromLocation(): string {
  const q = new URLSearchParams(window.location.search).get('campaign');
  if (q && isCampaignRegistered(q)) return q;
  return 'calvario';
}

/** `?view=scenes-graph` or `?view=graph` shows the full scene graph for the current campaign. */
export function resolveAppViewFromLocation(): AppView {
  const q = new URLSearchParams(window.location.search).get('view');
  if (q === 'scenes-graph' || q === 'graph') return 'scenes-graph';
  return 'game';
}

/** Href back to the main game, preserving `?campaign=`. */
export function buildGameHref(campaignId: string): string {
  const u = new URL(window.location.href);
  u.searchParams.delete('view');
  u.searchParams.delete('act');
  u.searchParams.set('campaign', campaignId);
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** Opens the scenes graph (`?view=scenes-graph`), default todos os acts. */
export function buildScenesGraphHref(campaignId: string): string {
  const u = new URL(window.location.href);
  u.searchParams.set('view', 'scenes-graph');
  u.searchParams.set('campaign', campaignId);
  u.searchParams.delete('act');
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** `?act=act3` filtra um act; omitido ou `all` = todos (layout por região). */
export function resolveScenesGraphActFromLocation(availableActs: string[]): string | 'all' {
  const q = new URLSearchParams(window.location.search).get('act');
  if (!q || q === 'all') return 'all';
  return availableActs.includes(q) ? q : 'all';
}
