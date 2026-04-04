import type { CampaignIndex } from '../engine/schema.ts';

/** Cabeçalho do jogo: `{nome da campanha} / {nome do ato}`. */
export function formatCampaignHeaderTitle(campaign: CampaignIndex, chapter: number): string {
  const actKey = String(chapter);
  const actTitle = campaign.chapterTitles?.[actKey] ?? `Ato ${chapter}`;
  return `${campaign.name} / ${actTitle}`;
}
