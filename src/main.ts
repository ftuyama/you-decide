import { GameApp } from './ui/GameApp';
import { mountScenesGraphView } from './ui/scenesGraphView';
import { resolveAppViewFromLocation, resolveCampaignIdFromLocation } from './ui/campaignUrl';

const el = document.querySelector<HTMLElement>('#app');
if (el) {
  const campaignId = resolveCampaignIdFromLocation();
  if (resolveAppViewFromLocation() === 'scenes-graph') {
    mountScenesGraphView(el, campaignId);
  } else {
    new GameApp(el, campaignId);
  }
}
