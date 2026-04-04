import { GameApp } from './ui/GameApp.ts';
import { mountScenesGraphView } from './ui/scenesGraphView.ts';
import { resolveAppViewFromLocation, resolveCampaignIdFromLocation } from './ui/campaignUrl.ts';

const el = document.querySelector<HTMLElement>('#app');
if (el) {
  const campaignId = resolveCampaignIdFromLocation();
  if (resolveAppViewFromLocation() === 'scenes-graph') {
    mountScenesGraphView(el, campaignId);
  } else {
    new GameApp(el, campaignId);
  }
}
