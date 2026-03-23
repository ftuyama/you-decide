import { isCampaignRegistered } from '../campaigns/registry';

/** Reads `?campaign=<id>`; falls back to calvario if missing or unknown. */
export function resolveCampaignIdFromLocation(): string {
  const q = new URLSearchParams(window.location.search).get('campaign');
  if (q && isCampaignRegistered(q)) return q;
  return 'calvario';
}
