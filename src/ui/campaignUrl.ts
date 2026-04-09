import { isCampaignRegistered } from '../campaigns/registry.ts';

export type AppView = 'game' | 'scenes-graph' | 'dev';

/** Tabs for `?view=dev`. */
export const DEV_TOOLS_TABS = ['scenes', 'items', 'music', 'visual', 'enemies', 'ascii'] as const;
export type DevToolsTab = (typeof DEV_TOOLS_TABS)[number];

/** Reads `?campaign=<id>`; falls back to calvario if missing or unknown. */
export function resolveCampaignIdFromLocation(): string {
  const q = new URLSearchParams(window.location.search).get('campaign');
  if (q && isCampaignRegistered(q)) return q;
  return 'calvario';
}

/** `?view=scenes-graph` or `?view=graph` shows the full scene graph for the current campaign. */
export function resolveAppViewFromLocation(): AppView {
  const q = new URLSearchParams(window.location.search).get('view');
  if (q === 'dev' || q === 'devtools') return 'dev';
  if (q === 'scenes-graph' || q === 'graph') return 'scenes-graph';
  return 'game';
}

/** Href back to the main game, preserving `?campaign=`. */
export function buildGameHref(campaignId: string): string {
  const u = new URL(window.location.href);
  u.searchParams.delete('view');
  u.searchParams.delete('act');
  u.searchParams.delete('tab');
  u.searchParams.delete('scene');
  u.searchParams.set('campaign', campaignId);
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** `?tab=` for dev tools; default `scenes`. */
export function resolveDevToolsTabFromLocation(): DevToolsTab {
  const q = new URLSearchParams(window.location.search).get('tab');
  if (q && (DEV_TOOLS_TABS as readonly string[]).includes(q)) return q as DevToolsTab;
  return 'scenes';
}

/** Optional `?scene=<id>` when `tab=scenes` (navegador de cenas). */
export function resolveDevToolsSceneIdFromLocation(): string | null {
  const q = new URLSearchParams(window.location.search).get('scene');
  return q && q.trim() ? q.trim() : null;
}

/** Opens dev tools (`?view=dev`). */
export function buildDevToolsHref(campaignId: string, tab?: DevToolsTab, sceneId?: string | null): string {
  const u = new URL(window.location.href);
  u.searchParams.set('view', 'dev');
  u.searchParams.set('campaign', campaignId);
  u.searchParams.delete('act');
  const t = tab ?? 'scenes';
  u.searchParams.set('tab', t);
  if (t === 'scenes' && sceneId) u.searchParams.set('scene', sceneId);
  else u.searchParams.delete('scene');
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** Opens the scenes graph (`?view=scenes-graph`), default todos os acts. */
export function buildScenesGraphHref(campaignId: string): string {
  const u = new URL(window.location.href);
  u.searchParams.set('view', 'scenes-graph');
  u.searchParams.set('campaign', campaignId);
  u.searchParams.delete('act');
  u.searchParams.delete('tab');
  u.searchParams.delete('scene');
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** `?act=act3` filtra um act; omitido ou `all` = todos (layout por região). */
export function resolveScenesGraphActFromLocation(availableActs: string[]): string | 'all' {
  const q = new URLSearchParams(window.location.search).get('act');
  if (!q || q === 'all') return 'all';
  return availableActs.includes(q) ? q : 'all';
}
