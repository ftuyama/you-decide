import { GameApp } from './ui/GameApp';

const el = document.querySelector<HTMLElement>('#app');
if (el) {
  new GameApp(el);
}
