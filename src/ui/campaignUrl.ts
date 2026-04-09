import { isCampaignRegistered } from '../campaigns/registry.ts';

export type AppView = 'game' | 'scenes-graph' | 'dev';

/** Tabs for `?view=dev`. */
export const DEV_TOOLS_TABS = [
  'scenes',
  'items',
  'music',
  'visual',
  'enemies',
  'ascii',
  'ascii-bejamas',
  'ascii-browser',
] as const;
export type DevToolsTab = (typeof DEV_TOOLS_TABS)[number];

export type DevToolsAsciiSort = 'name-asc' | 'name-desc' | 'mtime-desc' | 'mtime-asc';

export type DevToolsLinkOptions = {
  sceneId?: string | null;
  asciiPath?: string | null;
  asciiSort?: DevToolsAsciiSort | null;
};

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
  u.searchParams.delete('asciiPath');
  u.searchParams.delete('asciiSort');
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

/** Optional `?asciiPath=` quando `tab=ascii-browser` (caminho relativo a `ascii/scenes/`). */
export function resolveDevToolsAsciiPathFromLocation(): string | null {
  const q = new URLSearchParams(window.location.search).get('asciiPath');
  return q && q.trim() ? q.trim() : null;
}

/** `?asciiSort=` quando `tab=ascii-browser`. */
export function resolveDevToolsAsciiSortFromLocation(): DevToolsAsciiSort {
  const q = new URLSearchParams(window.location.search).get('asciiSort');
  if (q === 'name-desc' || q === 'mtime-desc' || q === 'mtime-asc' || q === 'name-asc') return q;
  return 'name-asc';
}

/** Opens dev tools (`?view=dev`). */
export function buildDevToolsHref(
  campaignId: string,
  tab?: DevToolsTab,
  options?: DevToolsLinkOptions
): string {
  const u = new URL(window.location.href);
  u.searchParams.set('view', 'dev');
  u.searchParams.set('campaign', campaignId);
  u.searchParams.delete('act');
  const t = tab ?? 'scenes';
  u.searchParams.set('tab', t);
  if (t === 'scenes' && options?.sceneId) {
    u.searchParams.set('scene', options.sceneId);
  } else {
    u.searchParams.delete('scene');
  }
  if (t === 'ascii-browser') {
    if (options?.asciiPath) u.searchParams.set('asciiPath', options.asciiPath);
    else u.searchParams.delete('asciiPath');
    const sort = options?.asciiSort ?? 'name-asc';
    if (sort !== 'name-asc') u.searchParams.set('asciiSort', sort);
    else u.searchParams.delete('asciiSort');
  } else {
    u.searchParams.delete('asciiPath');
    u.searchParams.delete('asciiSort');
  }
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
  u.searchParams.delete('asciiPath');
  u.searchParams.delete('asciiSort');
  const qs = u.searchParams.toString();
  return qs ? `${u.pathname}?${qs}` : u.pathname;
}

/** `?act=act3` filtra um act; omitido ou `all` = todos (layout por região). */
export function resolveScenesGraphActFromLocation(availableActs: string[]): string | 'all' {
  const q = new URLSearchParams(window.location.search).get('act');
  if (!q || q === 'all') return 'all';
  return availableActs.includes(q) ? q : 'all';
}
