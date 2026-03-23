import { GameApp } from './ui/GameApp';
import { resolveCampaignIdFromLocation } from './ui/campaignUrl';

const el = document.querySelector<HTMLElement>('#app');
if (el) {
  new GameApp(el, resolveCampaignIdFromLocation());
}
