import { GameApp } from './ui/GameApp.ts';
import { mountScenesGraphView } from './ui/scenesGraphView.ts';
import { mountDevToolsView } from './ui/devToolsView.ts';
import { resolveAppViewFromLocation, resolveCampaignIdFromLocation } from './ui/campaignUrl.ts';

const el = document.querySelector<HTMLElement>('#app');
if (el) {
  const campaignId = resolveCampaignIdFromLocation();
  const view = resolveAppViewFromLocation();
  if (view === 'scenes-graph') {
    mountScenesGraphView(el, campaignId);
  } else if (view === 'dev') {
    mountDevToolsView(el, campaignId);
  } else {
    new GameApp(el, campaignId);
  }
}
