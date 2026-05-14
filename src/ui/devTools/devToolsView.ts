import '../css/styles.css';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getRegisteredCampaignIds, loadCampaignContent } from '../../campaigns/registry.ts';
import { parseSceneMarkdown, type LoadedScene } from '../../engine/core/index.ts';
import type { Choice } from '../../engine/schema/index.ts';
import { sceneActId, sortedSceneActsFromNodes, type SceneGraphNode } from '../../engine/world/index.ts';
import type { ItemDef, EnemyDef } from '../../engine/schema/index.ts';
import {
  collectArtKeysFromAnimatedHighlightScenes,
  collectHighlightHoldMsByAnimatedHighlightBase,
  resolveSceneArtFromFrontmatter,
  SCENE_ART_HIGHLIGHT_HOLD_MS_DEFAULT,
} from '../gameAppStory.ts';
import { GameAudio, AMBIENT_THEMES, type AmbientTheme } from '../sound/index.ts';
import {
  buildGameHref,
  buildScenesGraphHref,
  buildDevToolsHref,
  resolveDevToolsTabFromLocation,
  resolveDevToolsSceneIdFromLocation,
  resolveDevToolsAsciiPathFromLocation,
  resolveDevToolsAsciiSortFromLocation,
  DEV_TOOLS_TABS,
  type DevToolsTab,
} from '../campaignUrl.ts';
import { mountBejamasAsciiPanel } from './devToolsBejamasAscii.ts';
import { mountBrailleAsciiPanel } from './devToolsBrailleAscii.ts';
import { mountBrailleWebSearchPanel } from './devToolsBrailleWebSearch.ts';
import { mountAsciiBrowserPanel } from './devToolsAsciiBrowser.ts';
import { attachDevToolsEnemySpriteThumbnail } from './devToolsEnemySpriteModal.ts';

function pathToSceneId(path: string): string {
  return path.replace(/^.*\/scenes\//, '').replace(/\.md$/, '');
}

function itemStatsLines(def: ItemDef): string[] {
  const lines: string[] = [];
  if (def.damage) lines.push(`Dano +${def.damage}`);
  if (def.armor) lines.push(`Armadura +${def.armor}`);
  const attrs = ['bonusStr', 'bonusAgi', 'bonusMind', 'bonusLuck'] as const;
  for (const k of attrs) {
    const v = def[k];
    if (v) lines.push(`${k.replace('bonus', '')} +${v}`);
  }
  if (def.restoreHp) lines.push(`Cura HP +${def.restoreHp}`);
  if (def.restoreMana) lines.push(`Mana +${def.restoreMana}`);
  if (def.stressRelief) lines.push(`Stress −${def.stressRelief}`);
  if (def.cursed) lines.push('Amaldiçoado');
  if (def.rumor) lines.push('Rumor');
  if (def.corruptionDrainOnHit) lines.push(`Dreno corrupção / acerto: ${def.corruptionDrainOnHit}`);
  return lines;
}

function mountItemsPanel(parent: HTMLElement, items: Record<string, ItemDef>): void {
  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-grid';
  const sorted = Object.keys(items).sort((a, b) => a.localeCompare(b));
  for (const id of sorted) {
    const def = items[id]!;
    const card = document.createElement('article');
    card.className = 'dev-tools-card';
    const h = document.createElement('h3');
    h.className = 'dev-tools-card-title';
    h.textContent = def.name;
    card.appendChild(h);
    const meta = document.createElement('div');
    meta.className = 'dev-tools-card-meta';
    meta.textContent = `${id} · ${def.slot}`;
    card.appendChild(meta);
    const stats = document.createElement('ul');
    stats.className = 'dev-tools-stat-list';
    for (const line of itemStatsLines(def)) {
      const li = document.createElement('li');
      li.textContent = line;
      stats.appendChild(li);
    }
    card.appendChild(stats);
    if (def.sprite) {
      const pre = document.createElement('pre');
      pre.className = 'item-sprite';
      pre.textContent = def.sprite;
      card.appendChild(pre);
    } else {
      const em = document.createElement('p');
      em.className = 'dev-tools-missing';
      em.textContent = '— sem sprite —';
      card.appendChild(em);
    }
    wrap.appendChild(card);
  }
  parent.appendChild(wrap);
}

function mountEnemiesPanel(parent: HTMLElement, enemies: Record<string, EnemyDef>): void {
  const wrap = document.createElement('div');
  wrap.className = 'dev-tools-grid';
  const sorted = Object.keys(enemies).sort((a, b) => a.localeCompare(b));
  for (const id of sorted) {
    const def = enemies[id]!;
    const card = document.createElement('article');
    card.className = 'dev-tools-card';
    const h = document.createElement('h3');
    h.className = 'dev-tools-card-title';
    h.textContent = def.name;
    card.appendChild(h);
    const meta = document.createElement('div');
    meta.className = 'dev-tools-card-meta';
    meta.textContent = `${id} · ${def.type} · HP ${def.hp}/${def.maxHp} · XP ${def.xp ?? '—'}`;
    card.appendChild(meta);
    const stats = document.createElement('ul');
    stats.className = 'dev-tools-stat-list';
    const li1 = document.createElement('li');
    li1.textContent = `STR ${def.str} · AGI ${def.agi} · Mente ${def.mind} · Armadura ${def.armor}`;
    const li2 = document.createElement('li');
    li2.textContent = `Estratégia: ${def.attackStrategy}`;
    stats.appendChild(li1);
    stats.appendChild(li2);
    card.appendChild(stats);
    if (def.lootDrops?.length) {
      const lootHdr = document.createElement('div');
      lootHdr.className = 'dev-tools-subhdr';
      lootHdr.textContent = 'Loot';
      card.appendChild(lootHdr);
      const lootUl = document.createElement('ul');
      lootUl.className = 'dev-tools-stat-list';
      for (const d of def.lootDrops) {
        const li = document.createElement('li');
        if ('itemId' in d) li.textContent = `${d.itemId} (${Math.round(d.chance * 100)}%)`;
        else li.textContent = `${d.resource} +${d.amount} (${Math.round(d.chance * 100)}%)`;
        lootUl.appendChild(li);
      }
      card.appendChild(lootUl);
    }
    if (def.combatLines?.length) {
      const det = document.createElement('details');
      det.className = 'dev-tools-details';
      const sum = document.createElement('summary');
      sum.textContent = `Falas de combate (${def.combatLines.length})`;
      det.appendChild(sum);
      const ul = document.createElement('ul');
      ul.className = 'dev-tools-lines';
      for (const line of def.combatLines) {
        const li = document.createElement('li');
        li.textContent = line;
        ul.appendChild(li);
      }
      det.appendChild(ul);
      card.appendChild(det);
    }
    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'dev-tools-enemy-sprite-thumb-wrap';
    thumbWrap.tabIndex = 0;
    thumbWrap.setAttribute('role', 'button');
    thumbWrap.setAttribute(
      'aria-label',
      'Ampliar sprite: clique, Enter, ou pausa o rato sobre a imagem'
    );
    const pre = document.createElement('pre');
    pre.className = 'enemy-sprite';
    pre.textContent = def.sprite;
    const hint = document.createElement('span');
    hint.className = 'dev-tools-sprite-hover-hint';
    hint.textContent = 'Ampliar';
    thumbWrap.appendChild(pre);
    thumbWrap.appendChild(hint);
    attachDevToolsEnemySpriteThumbnail(thumbWrap, def.sprite);
    card.appendChild(thumbWrap);
    wrap.appendChild(card);
  }
  parent.appendChild(wrap);
}

function aggregateAmbientCounts(scenes: Map<string, LoadedScene>): Map<AmbientTheme, number> {
  const m = new Map<AmbientTheme, number>();
  for (const t of AMBIENT_THEMES) m.set(t, 0);
  for (const sc of scenes.values()) {
    const th = sc.frontmatter.ambientTheme;
    if (th) m.set(th, (m.get(th) ?? 0) + 1);
  }
  return m;
}

type DevToolsSfxPreviewRow = { label: string; play: (audio: GameAudio) => void };

type DevToolsSfxCategory = {
  category: string;
  rows: readonly DevToolsSfxPreviewRow[];
  /** Aba Música: secção Highlight (overlay); omitido = "Demais efeitos". */
  musicTabSection?: 'highlight';
};

/** Pré-escuta na aba Música (`?view=dev&tab=music`) — espelha `GameAudio` + `GameSfxPlayer`. */
const DEV_TOOLS_SFX_BY_CATEGORY: readonly DevToolsSfxCategory[] = [
  {
    category: 'Highlight',
    musicTabSection: 'highlight',
    rows: [
      { label: 'Porta (door_open)', play: (a) => a.playDoorOpen() },
      { label: 'Misterioso (mysterious)', play: (a) => a.playMysteriousHighlight() },
      { label: 'Classe — Cavaleiro (class_knight)', play: (a) => a.playClassCommitKnight() },
      { label: 'Classe — Clériga (class_cleric)', play: (a) => a.playClassCommitCleric() },
      { label: 'Classe — Mago (class_mage)', play: (a) => a.playClassCommitMage() },
    ],
  },
  {
    category: 'Interface e testes',
    rows: [
      { label: 'Clique (UI)', play: (a) => a.playUiClick() },
      { label: 'Bloqueado', play: (a) => a.playBlocked() },
      { label: 'Dados', play: (a) => a.playDice() },
      { label: 'Teste falhou', play: (a) => a.playCheckFail() },
      { label: 'Teste passou', play: (a) => a.playCheckSuccess() },
    ],
  },
  {
    category: 'Combate — golpes',
    rows: [
      { label: 'Acerto (genérico)', play: (a) => a.playHit() },
      { label: 'Corte (lâmina)', play: (a) => a.playSwordSlash() },
      { label: 'Impacto (contundente)', play: (a) => a.playBluntImpact() },
      { label: 'Cajado', play: (a) => a.playStaffWhoosh() },
      { label: 'Crítico', play: (a) => a.playCritImpact() },
      { label: 'Errou', play: (a) => a.playMiss() },
      { label: 'Golpe letal', play: (a) => a.playLethalStrike() },
      { label: 'Armadura estilhaçada', play: (a) => a.playArmorShatter() },
    ],
  },
  {
    category: 'Combate — magia e itens',
    rows: [
      { label: 'Magia (fogo)', play: (a) => a.playSpellFire() },
      { label: 'Magia (arcano)', play: (a) => a.playSpellArcaneBurst() },
      { label: 'Magia (gelo)', play: (a) => a.playSpellIceSpark() },
      { label: 'Cura (magia)', play: (a) => a.playSpellHeal() },
      { label: 'Poção', play: (a) => a.playPotionDrink() },
      { label: 'Buff', play: (a) => a.playBuffCast() },
      { label: 'Foco do guerreiro', play: (a) => a.playWarriorsFocus() },
    ],
  },
  {
    category: 'Combate — herói',
    rows: [
      { label: 'Dano recebido', play: (a) => a.playDamageTaken() },
      { label: 'Stress', play: (a) => a.playStressSting() },
    ],
  },
  {
    category: 'Progressão',
    rows: [
      { label: 'Descanso (acamp.)', play: (a) => a.playCampRest() },
      { label: 'Novo dia', play: (a) => a.playDayAdvance() },
      { label: 'Item obtido', play: (a) => a.playItemAcquire() },
      { label: 'Milagre (fé)', play: (a) => a.playFaithMiracle() },
      { label: 'Level up', play: (a) => a.playLevelUpCelebration() },
      { label: 'Promoção de caminho', play: (a) => a.playPathPromotion() },
    ],
  },
  {
    category: 'Desfechos',
    rows: [
      { label: 'Vitória', play: (a) => a.playVictory() },
      { label: 'Derrota', play: (a) => a.playDefeat() },
      { label: 'Fuga', play: (a) => a.playFlee() },
      { label: 'Revelação (boss twist)', play: (a) => a.playBossTwistRevelation() },
      {
        label: 'Sacrifício ritual (`commitSfx: horrific_sacrifice`)',
        play: (a) => a.playHorrificSacrificeCommit(),
      },
    ],
  },
];

function appendDevToolsSfxPreviewTable(
  parent: HTMLElement,
  audio: GameAudio,
  categories: readonly DevToolsSfxCategory[]
): void {
  const sfxTable = document.createElement('table');
  sfxTable.className = 'dev-tools-table dev-tools-table--sfx';
  const sfxThead = document.createElement('thead');
  sfxThead.innerHTML = '<tr><th>Categoria</th><th>Efeito</th><th>Pré-escuta</th></tr>';
  sfxTable.appendChild(sfxThead);
  const sfxTbody = document.createElement('tbody');
  for (const cat of categories) {
    const n = cat.rows.length;
    for (let i = 0; i < n; i++) {
      const row = cat.rows[i]!;
      const tr = document.createElement('tr');
      if (i === 0) {
        const tdCat = document.createElement('td');
        tdCat.className = 'dev-tools-sfx-category';
        tdCat.rowSpan = n;
        tdCat.textContent = cat.category;
        tr.appendChild(tdCat);
      }
      const tdLabel = document.createElement('td');
      tdLabel.textContent = row.label;
      const tdPlay = document.createElement('td');
      tdPlay.className = 'dev-tools-music-actions';
      const playSfx = document.createElement('button');
      playSfx.type = 'button';
      playSfx.className = 'dev-tools-btn';
      playSfx.textContent = 'Ouvir';
      playSfx.addEventListener('click', () => {
        audio.ensureContext();
        row.play(audio);
      });
      tdPlay.appendChild(playSfx);
      tr.appendChild(tdLabel);
      tr.appendChild(tdPlay);
      sfxTbody.appendChild(tr);
    }
  }
  sfxTable.appendChild(sfxTbody);
  parent.appendChild(sfxTable);
}

/** Alinhado a `GameApp.resolveVisualTheme` — paleta CSS (`html[data-theme]`). */
type DevToolsVisualThemeId = 'default' | 'snow' | 'void' | 'ash';

const DEV_TOOLS_VISUAL_THEMES: readonly DevToolsVisualThemeId[] = ['default', 'snow', 'void', 'ash'];
const DEV_TOOLS_VISUAL_THEME_STORAGE_KEY = 'silent-dungeon.devTools.visualTheme';

function inferVisualThemeForScene(id: string, chapter: number | undefined): DevToolsVisualThemeId {
  if (chapter === 6 || id.startsWith('act6/')) return 'void';
  if (chapter === 7 || id.startsWith('act7/')) return 'ash';
  if (chapter === 5 || id.startsWith('act5/')) return 'snow';
  return 'default';
}

function aggregateVisualThemeCounts(scenes: Map<string, LoadedScene>): Map<DevToolsVisualThemeId, number> {
  const m = new Map<DevToolsVisualThemeId, number>();
  for (const t of DEV_TOOLS_VISUAL_THEMES) m.set(t, 0);
  for (const [id, sc] of scenes) {
    const th = inferVisualThemeForScene(id, sc.frontmatter.chapter);
    m.set(th, (m.get(th) ?? 0) + 1);
  }
  return m;
}

function applyDevToolsVisualTheme(theme: DevToolsVisualThemeId): void {
  if (theme === 'default') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

function readStoredDevToolsVisualTheme(): DevToolsVisualThemeId {
  try {
    const raw = window.localStorage.getItem(DEV_TOOLS_VISUAL_THEME_STORAGE_KEY);
    if (
      raw === 'default' ||
      raw === 'snow' ||
      raw === 'void' ||
      raw === 'ash'
    ) {
      return raw;
    }
  } catch {
    /* ignore storage errors */
  }
  return 'default';
}

function persistDevToolsVisualTheme(theme: DevToolsVisualThemeId): void {
  try {
    window.localStorage.setItem(DEV_TOOLS_VISUAL_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore storage errors */
  }
}

function mountVisualPanel(
  parent: HTMLElement,
  counts: Map<DevToolsVisualThemeId, number>
): void {
  const note = document.createElement('p');
  note.className = 'dev-tools-note';
  note.textContent =
    'Paleta da interface (`html[data-theme]` em tokens/theme-tokens.css): padrão, neve (ato 5), vazio (ato 6), cinzas (ato 7). A pré-visualização altera esta página até clicar em Restaurar.';

  const table = document.createElement('table');
  table.className = 'dev-tools-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Tema</th><th>Cenas (inferido)</th><th>Pré-visualizar</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  const labels: Record<DevToolsVisualThemeId, string> = {
    default: 'default (sem data-theme)',
    snow: 'snow',
    void: 'void',
    ash: 'ash',
  };
  for (const theme of DEV_TOOLS_VISUAL_THEMES) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = labels[theme];
    const td2 = document.createElement('td');
    td2.textContent = String(counts.get(theme) ?? 0);
    const td3 = document.createElement('td');
    td3.className = 'dev-tools-music-actions';
    const previewBtn = document.createElement('button');
    previewBtn.type = 'button';
    previewBtn.className = 'dev-tools-btn';
    previewBtn.textContent = 'Aplicar';
    previewBtn.addEventListener('click', () => {
      applyDevToolsVisualTheme(theme);
      persistDevToolsVisualTheme(theme);
    });
    td3.appendChild(previewBtn);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const restore = document.createElement('p');
  restore.className = 'dev-tools-note';
  const restoreBtn = document.createElement('button');
  restoreBtn.type = 'button';
  restoreBtn.className = 'dev-tools-btn';
  restoreBtn.textContent = 'Restaurar tema padrão';
  restoreBtn.addEventListener('click', () => {
    applyDevToolsVisualTheme('default');
    persistDevToolsVisualTheme('default');
  });
  restore.appendChild(restoreBtn);

  parent.appendChild(note);
  parent.appendChild(table);
  parent.appendChild(restore);
}

function mountMusicPanel(
  parent: HTMLElement,
  campaignId: string,
  counts: Map<AmbientTheme, number>
): void {
  const audio = new GameAudio(campaignId);

  const note = document.createElement('p');
  note.className = 'dev-tools-note';
  note.textContent =
    'Os temas "combat", "combat_rival" (encontros kael_rival_*) e "boss" são escolhidos em combate pelo jogo (não vêm do YAML das cenas). As contagens abaixo são só de cenas com ambientTheme explícito.';

  const table = document.createElement('table');
  table.className = 'dev-tools-table';
  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Tema</th><th>Cenas (YAML)</th><th>Pré-escuta</th></tr>';
  table.appendChild(thead);
  const tbody = document.createElement('tbody');
  for (const theme of AMBIENT_THEMES) {
    const tr = document.createElement('tr');
    const td1 = document.createElement('td');
    td1.textContent = theme;
    const td2 = document.createElement('td');
    td2.textContent = String(counts.get(theme) ?? 0);
    const td3 = document.createElement('td');
    td3.className = 'dev-tools-music-actions';
    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'dev-tools-btn';
    playBtn.textContent = 'Ouvir';
    playBtn.addEventListener('click', () => {
      audio.ensureContext();
      audio.setAmbientTheme(theme);
    });
    const stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.className = 'dev-tools-btn';
    stopBtn.textContent = 'Parar';
    stopBtn.addEventListener('click', () => {
      audio.stopAmbient();
    });
    td3.appendChild(playBtn);
    td3.appendChild(stopBtn);
    tr.appendChild(td1);
    tr.appendChild(td2);
    tr.appendChild(td3);
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  parent.appendChild(note);
  parent.appendChild(table);

  const sfxHdr = document.createElement('div');
  sfxHdr.className = 'dev-tools-subhdr dev-tools-subhdr--music-sfx';
  sfxHdr.textContent = 'Efeitos sonoros';
  parent.appendChild(sfxHdr);

  const sfxNote = document.createElement('p');
  sfxNote.className = 'dev-tools-note';
  sfxNote.textContent =
    'Tons curtos por síntese (Web Audio), mesmos métodos do jogo. Cada botão toca uma vez; o volume segue a preferência guardada da campanha. O highlight do overlay de arte está na secção abaixo.';
  parent.appendChild(sfxNote);

  const hlHdr = document.createElement('div');
  hlHdr.className = 'dev-tools-subhdr dev-tools-subhdr--music-sfx-highlight';
  hlHdr.textContent = 'Highlight';
  parent.appendChild(hlHdr);

  const hlNote = document.createElement('p');
  hlNote.className = 'dev-tools-note';
  hlNote.textContent =
    'Sons ao montar o overlay de arte na primeira visita (`highlight: true`), conforme `artHighlightSfx` no YAML da cena.';
  parent.appendChild(hlNote);

  const sfxHighlight = DEV_TOOLS_SFX_BY_CATEGORY.filter((c) => c.musicTabSection === 'highlight');
  appendDevToolsSfxPreviewTable(parent, audio, sfxHighlight);

  const sfxRestHdr = document.createElement('div');
  sfxRestHdr.className = 'dev-tools-subhdr dev-tools-subhdr--music-sfx-rest';
  sfxRestHdr.textContent = 'Demais efeitos';
  parent.appendChild(sfxRestHdr);

  const sfxRest = DEV_TOOLS_SFX_BY_CATEGORY.filter((c) => c.musicTabSection !== 'highlight');
  appendDevToolsSfxPreviewTable(parent, audio, sfxRest);
}

function appendSceneChoicesSection(
  parent: HTMLElement,
  choices: Choice[],
  onNavigate: (sceneId: string) => void
): void {
  const h = document.createElement('h3');
  h.className = 'dev-tools-scene-section-title';
  h.textContent = 'Decisões';
  parent.appendChild(h);
  if (choices.length === 0) {
    const p = document.createElement('p');
    p.className = 'dev-tools-missing';
    p.textContent = '— nenhuma escolha —';
    parent.appendChild(p);
    return;
  }
  const list = document.createElement('ol');
  list.className = 'dev-tools-choices-list';
  for (let i = 0; i < choices.length; i++) {
    const ch = choices[i]!;
    const li = document.createElement('li');
    li.className = 'dev-tools-choice-item';

    const card: HTMLAnchorElement | HTMLDivElement = ch.next
      ? document.createElement('a')
      : document.createElement('div');
    card.className = 'dev-tools-choice-card';
    if (card instanceof HTMLAnchorElement) {
      card.href = '#';
      card.addEventListener('click', (event) => {
        event.preventDefault();
        onNavigate(ch.next!);
      });
    } else {
      card.classList.add('dev-tools-choice-card--static');
    }

    const main = document.createElement('div');
    main.className = 'dev-tools-choice-text';
    main.textContent = ch.text;
    card.appendChild(main);

    const meta = document.createElement('div');
    meta.className = 'dev-tools-choice-meta';
    const bits: string[] = [];
    if (ch.id) bits.push(`id: ${ch.id}`);
    if (ch.preview) bits.push(`prévia: ${ch.preview}`);
    if (ch.timedMs != null) bits.push(`tempo: ${ch.timedMs}ms`);
    if (ch.fallbackNext) bits.push(`fallback: ${ch.fallbackNext}`);
    if (ch.fallbackEffects?.length)
      bits.push(`fallbackFx: ${ch.fallbackEffects.map((e) => e.op).join(', ')}`);
    meta.textContent = bits.join(' · ') || '—';
    card.appendChild(meta);

    if (ch.condition != null) {
      const condLabel = document.createElement('div');
      condLabel.className = 'dev-tools-choice-effects';
      condLabel.textContent = 'Condição';
      card.appendChild(condLabel);
      const cond = document.createElement('pre');
      cond.className = 'dev-tools-choice-json';
      cond.textContent = JSON.stringify(ch.condition, null, 2);
      card.appendChild(cond);
    }
    if (ch.effects.length > 0) {
      const fx = document.createElement('div');
      fx.className = 'dev-tools-choice-effects';
      fx.textContent = `Efeitos (${ch.effects.length}): ${ch.effects.map((e) => e.op).join(', ')}`;
      card.appendChild(fx);
    }
    if (ch.next) {
      const target = document.createElement('div');
      target.className = 'dev-tools-choice-target';
      target.textContent = `Ir para: ${ch.next}`;
      card.appendChild(target);
    }
    li.appendChild(card);
    list.appendChild(li);
  }
  parent.appendChild(list);
}

function appendSceneMarkdownSections(parent: HTMLElement, bodyRaw: string): void {
  const trimmed = bodyRaw.trim() || '—';

  const hPrev = document.createElement('h3');
  hPrev.className = 'dev-tools-scene-section-title';
  hPrev.textContent = 'Pré-visualização (markdown)';
  parent.appendChild(hPrev);
  const preview = document.createElement('div');
  preview.className = 'dev-tools-md-preview story-body';
  preview.innerHTML = DOMPurify.sanitize(marked.parse(trimmed) as string);
  parent.appendChild(preview);
}

function mountScenesPanel(
  parent: HTMLElement,
  campaignId: string,
  scenes: Map<string, LoadedScene>,
  sceneArt: Record<string, string>,
  initialSceneId: string | null
): void {
  const acts = sortedSceneActsFromNodes(
    [...scenes.keys()].map(
      (id): SceneGraphNode => ({
        id,
        chapter: scenes.get(id)?.frontmatter.chapter ?? 1,
        title: scenes.get(id)?.frontmatter.title?.trim() || id,
        isEntry: false,
      })
    )
  );

  const layout = document.createElement('div');
  layout.className = 'dev-tools-scene-layout';

  const sidebar = document.createElement('div');
  sidebar.className = 'dev-tools-scene-sidebar';

  const actRow = document.createElement('div');
  actRow.className = 'dev-tools-filter-row';
  const actLab = document.createElement('label');
  actLab.className = 'dev-tools-filter';
  actLab.textContent = 'Act ';
  const actSel = document.createElement('select');
  actSel.className = 'dev-tools-select';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'Todos';
  actSel.appendChild(optAll);
  for (const a of acts) {
    const o = document.createElement('option');
    o.value = a;
    o.textContent = a;
    actSel.appendChild(o);
  }
  actLab.appendChild(actSel);
  actRow.appendChild(actLab);

  const searchRow = document.createElement('div');
  searchRow.className = 'dev-tools-filter-row';
  const searchLab = document.createElement('label');
  searchLab.className = 'dev-tools-filter';
  searchLab.textContent = 'Filtrar ';
  const searchInp = document.createElement('input');
  searchInp.type = 'search';
  searchInp.className = 'dev-tools-search';
  searchInp.placeholder = 'id da cena…';
  searchLab.appendChild(searchInp);
  searchRow.appendChild(searchLab);

  const listEl = document.createElement('ul');
  listEl.className = 'dev-tools-scene-list';

  sidebar.appendChild(actRow);
  sidebar.appendChild(searchRow);
  sidebar.appendChild(listEl);

  const detail = document.createElement('div');
  detail.className = 'dev-tools-scene-detail';

  const sceneIds = [...scenes.keys()].sort((a, b) => a.localeCompare(b));
  let selectedId =
    initialSceneId && scenes.has(initialSceneId) ? initialSceneId : sceneIds[0] ?? '';

  function filteredIds(): string[] {
    const act = actSel.value;
    const q = searchInp.value.trim().toLowerCase();
    return sceneIds.filter((id) => {
      if (act !== 'all' && sceneActId(id) !== act) return false;
      if (q && !id.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderList(): void {
    listEl.innerHTML = '';
    for (const id of filteredIds()) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'dev-tools-scene-link';
      a.href = buildDevToolsHref(campaignId, 'scenes', { sceneId: id });
      const sc = scenes.get(id);
      const shortTitle = sc?.frontmatter.title?.trim() || id.split('/').pop() || id;
      a.textContent = `${id} — ${shortTitle}`;
      a.dataset.sceneId = id;
      if (id === selectedId) {
        a.classList.add('dev-tools-scene-link--active');
      }
      li.appendChild(a);
      listEl.appendChild(li);
    }
  }

  function showDetail(id: string): void {
    detail.innerHTML = '';
    const sc = scenes.get(id);
    if (!sc) {
      detail.textContent = 'Cena não encontrada.';
      return;
    }
    const fm = sc.frontmatter;
    const h2 = document.createElement('h2');
    h2.className = 'dev-tools-detail-title';
    h2.textContent = fm.title?.trim() || id;
    detail.appendChild(h2);
    const meta = document.createElement('div');
    meta.className = 'dev-tools-detail-meta';
    const codeId = document.createElement('code');
    codeId.textContent = id;
    meta.appendChild(codeId);
    meta.appendChild(document.createTextNode(` · Capítulo ${fm.chapter} · ambient `));
    const codeTheme = document.createElement('code');
    codeTheme.textContent = fm.ambientTheme ?? '—';
    meta.appendChild(codeTheme);
    meta.appendChild(document.createTextNode(' · visual '));
    const codeVisual = document.createElement('code');
    codeVisual.textContent = inferVisualThemeForScene(id, fm.chapter);
    meta.appendChild(codeVisual);
    detail.appendChild(meta);
    const artInfo = document.createElement('div');
    artInfo.className = 'dev-tools-detail-meta';
    if (fm.artKey) artInfo.textContent = `artKey: ${fm.artKey}`;
    else if (fm.art?.trim()) artInfo.textContent = 'art: inline (YAML)';
    else artInfo.textContent = 'Sem artKey / art inline';
    detail.appendChild(artInfo);

    const resolved = resolveSceneArtFromFrontmatter(fm, sceneArt);
    if (resolved) {
      const artWrap = document.createElement('div');
      artWrap.className = 'scene-art';
      artWrap.textContent = resolved;
      detail.appendChild(artWrap);
    } else {
      const p = document.createElement('p');
      p.className = 'dev-tools-missing';
      p.textContent = 'Nenhuma arte resolvida.';
      detail.appendChild(p);
    }

    appendSceneChoicesSection(detail, fm.choices, (targetSceneId) => {
      if (!scenes.has(targetSceneId)) return;
      selectedId = targetSceneId;
      window.history.pushState(
        {},
        '',
        buildDevToolsHref(campaignId, 'scenes', { sceneId: targetSceneId })
      );
      renderList();
      showDetail(targetSceneId);
    });
    appendSceneMarkdownSections(detail, sc.bodyRaw);
  }

  actSel.addEventListener('change', () => renderList());
  searchInp.addEventListener('input', () => renderList());

  listEl.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const a = t.closest('a');
    if (!a?.dataset.sceneId) return;
    e.preventDefault();
    const id = a.dataset.sceneId;
    selectedId = id;
    window.history.pushState({}, '', buildDevToolsHref(campaignId, 'scenes', { sceneId: id }));
    renderList();
    showDetail(id);
  });

  renderList();
  if (selectedId) showDetail(selectedId);

  layout.appendChild(sidebar);
  layout.appendChild(detail);
  parent.appendChild(layout);
}

export function mountDevToolsView(root: HTMLElement, campaignId: string): void {
  root.innerHTML = '';
  root.className = 'dev-tools-root app--dev-tools';
  applyDevToolsVisualTheme(readStoredDevToolsVisualTheme());

  const tab = resolveDevToolsTabFromLocation();
  const sceneParam = resolveDevToolsSceneIdFromLocation();
  const asciiPathParam = resolveDevToolsAsciiPathFromLocation();
  const asciiSortParam = resolveDevToolsAsciiSortFromLocation();

  const bundle = loadCampaignContent(campaignId);
  const scenes = new Map<string, LoadedScene>();
  for (const [path, raw] of Object.entries(bundle.sceneFiles)) {
    const id = pathToSceneId(path);
    try {
      const sc = parseSceneMarkdown(raw, id);
      scenes.set(sc.id, sc);
    } catch {
      /* skip invalid */
    }
  }

  const ambientCounts = aggregateAmbientCounts(scenes);
  const visualCounts = aggregateVisualThemeCounts(scenes);

  const shell = document.createElement('div');
  shell.className = 'dev-tools-shell';

  const toolbar = document.createElement('div');
  toolbar.className = 'dev-tools-toolbar';

  const title = document.createElement('h1');
  title.className = 'dev-tools-title';
  title.textContent = 'Ferramentas de desenvolvimento';

  const campaignWrap = document.createElement('label');
  campaignWrap.className = 'dev-tools-campaign';
  campaignWrap.textContent = 'Campanha ';
  const select = document.createElement('select');
  select.className = 'dev-tools-select';
  for (const id of getRegisteredCampaignIds()) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = id;
    if (id === campaignId) opt.selected = true;
    select.appendChild(opt);
  }
  select.addEventListener('change', () => {
    window.location.href = buildDevToolsHref(select.value, tab, {
      sceneId: tab === 'scenes' ? sceneParam : null,
      asciiPath: tab === 'ascii-browser' ? asciiPathParam : null,
      asciiSort: tab === 'ascii-browser' ? asciiSortParam : null,
    });
  });
  campaignWrap.appendChild(select);

  const back = document.createElement('a');
  back.className = 'dev-tools-back';
  back.href = buildGameHref(campaignId);
  back.textContent = '← Voltar ao jogo';

  const graphLink = document.createElement('a');
  graphLink.className = 'dev-tools-back dev-tools-back--secondary';
  graphLink.href = buildScenesGraphHref(campaignId);
  graphLink.textContent = 'Grafo de cenas';

  const stats = document.createElement('div');
  stats.className = 'dev-tools-stats';
  stats.textContent = `${scenes.size} cenas · ${Object.keys(bundle.data.items).length} itens · ${Object.keys(bundle.data.enemies).length} inimigos`;

  toolbar.appendChild(title);
  toolbar.appendChild(campaignWrap);
  toolbar.appendChild(back);
  toolbar.appendChild(graphLink);
  toolbar.appendChild(stats);

  const tabRow = document.createElement('div');
  tabRow.className = 'dev-tools-tabs';
  for (const t of DEV_TOOLS_TABS) {
    const a = document.createElement('a');
    a.className = 'dev-tools-tab' + (t === tab ? ' dev-tools-tab--active' : '');
    a.href = buildDevToolsHref(campaignId, t, {
      sceneId: t === 'scenes' ? sceneParam : null,
      asciiPath: t === 'ascii-browser' ? asciiPathParam : null,
      asciiSort: t === 'ascii-browser' ? asciiSortParam : null,
    });
    const labels: Record<DevToolsTab, string> = {
      scenes: 'Cenas',
      items: 'Itens',
      music: 'Música',
      visual: 'Paleta visual',
      enemies: 'Inimigos',
      'ascii-web': 'Busca Web → Braille',
      ascii: 'Arte ASCII (Braille)',
      'ascii-bejamas': 'Arte ASCII (Bejamas IA)',
      'ascii-browser': 'Navegador ASCII',
    };
    a.textContent = labels[t];
    tabRow.appendChild(a);
  }

  const main = document.createElement('div');
  main.className = 'dev-tools-main';

  switch (tab) {
    case 'items':
      mountItemsPanel(main, bundle.data.items);
      break;
    case 'enemies':
      mountEnemiesPanel(main, bundle.data.enemies);
      break;
    case 'music':
      mountMusicPanel(main, campaignId, ambientCounts);
      break;
    case 'visual':
      mountVisualPanel(main, visualCounts);
      break;
    case 'ascii-web':
      mountBrailleWebSearchPanel(main);
      break;
    case 'ascii':
      mountBrailleAsciiPanel(main);
      break;
    case 'ascii-bejamas':
      mountBejamasAsciiPanel(main);
      break;
    case 'ascii-browser': {
      const sceneList = scenes.values();
      const animatedHighlightKeys = collectArtKeysFromAnimatedHighlightScenes(
        sceneList,
        bundle.ui.sceneArt
      );
      const highlightHoldMsByBase = collectHighlightHoldMsByAnimatedHighlightBase(
        sceneList,
        bundle.ui.sceneArt,
        SCENE_ART_HIGHLIGHT_HOLD_MS_DEFAULT
      );
      mountAsciiBrowserPanel(
        main,
        campaignId,
        bundle.ui.sceneArt,
        animatedHighlightKeys,
        highlightHoldMsByBase
      );
      break;
    }
    case 'scenes':
    default:
      mountScenesPanel(main, campaignId, scenes, bundle.ui.sceneArt, sceneParam);
      break;
  }

  shell.appendChild(toolbar);
  shell.appendChild(tabRow);
  shell.appendChild(main);
  root.appendChild(shell);
}
