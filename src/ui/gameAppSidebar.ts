import type { Character, ClassId, GameState, ItemDef, SpellDef } from '../engine/schema.ts';
import { effectiveLeadAttr } from '../engine/leadStats.ts';
import { PASSIVE_UNLOCK_ITEM_ID } from '../engine/state.ts';
import {
  getCharacterArmorClass,
  getEquippedArmorPoints,
  sumEquippedItemBonuses,
} from '../engine/combat.ts';
import { getEffectiveLuck } from '../engine/luck.ts';
import { MAX_LEVEL, xpToNextLevel } from '../engine/progression.ts';
import type { ContentRegistry } from '../content/registry.ts';
import { displayTitleForMark } from '../engine/effects.ts';
import {
  escHtml,
  hpBarMarkup,
  manaBarMarkup,
  markBadgeIconSvg,
  passiveSidebarIconSvg,
  spellEmoji,
  spellSidebarMechanicsLinePt,
  statBonusParen,
  stressBarMarkup,
} from './gameAppUtils.ts';
import { collapseTriggerStart, iconWrap, icons } from './icons/index.ts';

type SidebarBuilderParams = {
  state: GameState;
  registry: ContentRegistry;
  sidebarSections: Record<string, boolean>;
  onSectionToggle: (key: string, open: boolean) => void;
  playUiClick?: () => void;
};

let overlayModalLayer: HTMLDivElement | null = null;
let overlayModalOnKey: ((e: KeyboardEvent) => void) | null = null;

/** Fecha qualquer modal de overlay (diário ou ficha) para não empilhar diálogos. */
function closeOverlayModal(): void {
  if (overlayModalOnKey) {
    window.removeEventListener('keydown', overlayModalOnKey);
    overlayModalOnKey = null;
  }
  if (overlayModalLayer) {
    overlayModalLayer.remove();
    overlayModalLayer = null;
  }
}

type SheetModalShellOpts = {
  layerClass: string;
  titleId: string;
  kicker: string;
  title: string;
  sub: string;
  backdropAriaLabel: string;
};

function createSheetModalShell(opts: SheetModalShellOpts): {
  layer: HTMLDivElement;
  scroll: HTMLDivElement;
  dismiss: HTMLButtonElement;
  wireClose: (shut: () => void) => void;
} {
  const layer = document.createElement('div');
  layer.className = opts.layerClass;
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', opts.titleId);

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'sheet-modal-backdrop';
  backdrop.setAttribute('aria-label', opts.backdropAriaLabel);

  const panel = document.createElement('div');
  panel.className = 'sheet-modal-panel';

  const header = document.createElement('div');
  header.className = 'sheet-modal-header';

  const kicker = document.createElement('div');
  kicker.className = 'diary-entry-kicker';
  kicker.textContent = opts.kicker;

  const title = document.createElement('h2');
  title.id = opts.titleId;
  title.className = 'sheet-modal-title';
  title.textContent = opts.title;

  const sub = document.createElement('div');
  sub.className = 'diary-entry-subkicker';
  sub.textContent = opts.sub;

  header.appendChild(kicker);
  header.appendChild(title);
  header.appendChild(sub);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'sheet-modal-close';
  closeBtn.setAttribute('aria-label', 'Fechar');
  closeBtn.innerHTML = '&times;';
  header.appendChild(closeBtn);

  const scroll = document.createElement('div');
  scroll.className = 'sheet-modal-scroll';

  const footer = document.createElement('div');
  footer.className = 'sheet-modal-footer';
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'diary-entry-dismiss';
  dismiss.textContent = 'Fechar';
  footer.appendChild(dismiss);

  panel.appendChild(header);
  panel.appendChild(scroll);
  panel.appendChild(footer);

  layer.appendChild(backdrop);
  layer.appendChild(panel);

  const wireClose = (shut: () => void): void => {
    backdrop.addEventListener('click', shut);
    closeBtn.addEventListener('click', shut);
    dismiss.addEventListener('click', shut);
    panel.addEventListener('click', (e) => e.stopPropagation());
  };

  return { layer, scroll, dismiss, wireClose };
}

type DiaryModalOpenParams = {
  diary: string[];
  marks: string[];
  registry: ContentRegistry;
};

function openDiaryModal({ diary: entries, marks, registry }: DiaryModalOpenParams, playUiClick?: () => void): void {
  closeOverlayModal();
  playUiClick?.();

  const subParts: string[] = [];
  if (entries.length === 1) subParts.push('1 entrada registrada');
  else if (entries.length > 1) subParts.push(`${entries.length} entradas registradas`);
  if (marks.length === 1) subParts.push('1 marca');
  else if (marks.length > 1) subParts.push(`${marks.length} marcas`);

  const { layer, scroll, dismiss, wireClose } = createSheetModalShell({
    layerClass: 'sheet-modal-layer',
    titleId: 'diary-modal-title',
    kicker: 'Cronista',
    title: 'Diário de campanha',
    sub: subParts.join(' · '),
    backdropAriaLabel: 'Fechar diário',
  });

  const secMarks = document.createElement('section');
  secMarks.className = 'diary-modal-section diary-modal-section--badges';
  const hMarks = document.createElement('h3');
  hMarks.className = 'diary-modal-section-title';
  hMarks.textContent = 'Conquistas';
  const marksBody = document.createElement('div');
  if (marks.length === 0) {
    marksBody.className = 'diary-modal-section-body';
    const empty = document.createElement('p');
    empty.className = 'diary-modal-empty';
    empty.textContent = 'Nenhuma marca ainda.';
    marksBody.appendChild(empty);
  } else {
    marksBody.className = 'diary-modal-section-body diary-modal-badges-grid';
    for (const mark of marks) {
      const def = registry.data.journeyMarks[mark];
      const displayTitle = def?.name ?? displayTitleForMark(mark, registry.data);
      const displayDesc = def?.description ?? '';

      const badge = document.createElement('article');
      badge.className = 'diary-mark-badge';
      badge.setAttribute('aria-label', displayTitle);

      const rim = document.createElement('div');
      rim.className = 'diary-mark-badge-rim';

      const iconCell = document.createElement('div');
      iconCell.className = 'diary-mark-badge-icon';
      iconCell.innerHTML = iconWrap(markBadgeIconSvg(mark), 'ui-icon-wrap diary-mark-badge-icon-wrap');
      iconCell.setAttribute('aria-hidden', 'true');

      const textBlock = document.createElement('div');
      textBlock.className = 'diary-mark-badge-text';

      const titleEl = document.createElement('p');
      titleEl.className = 'diary-mark-badge-title';
      titleEl.textContent = displayTitle;

      textBlock.appendChild(titleEl);
      if (displayDesc) {
        const descEl = document.createElement('p');
        descEl.className = 'diary-mark-badge-desc';
        descEl.textContent = displayDesc;
        textBlock.appendChild(descEl);
      }

      rim.appendChild(iconCell);
      rim.appendChild(textBlock);
      badge.appendChild(rim);
      marksBody.appendChild(badge);
    }
  }
  secMarks.appendChild(hMarks);
  secMarks.appendChild(marksBody);

  const secDiary = document.createElement('section');
  secDiary.className = 'diary-modal-section';
  const hDiary = document.createElement('h3');
  hDiary.className = 'diary-modal-section-title';
  hDiary.textContent = 'Linhas do diário';
  const diaryBody = document.createElement('div');
  diaryBody.className = 'diary-modal-section-body';
  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diary-modal-empty';
    empty.textContent = 'Nenhuma entrada ainda.';
    diaryBody.appendChild(empty);
  } else {
    const padW = entries.length >= 10 ? 2 : 1;
    for (let i = 0; i < entries.length; i++) {
      const block = document.createElement('div');
      block.className = 'diary-modal-entry';
      const num = document.createElement('span');
      num.className = 'diary-modal-entry-num';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = String(i + 1).padStart(padW, '0');
      const bodyWrap = document.createElement('div');
      bodyWrap.className = 'diary-modal-entry-body-wrap';
      const p = document.createElement('p');
      p.className = 'diary-entry-body';
      p.textContent = entries[i]!;
      bodyWrap.appendChild(p);
      block.appendChild(num);
      block.appendChild(bodyWrap);
      diaryBody.appendChild(block);
    }
  }
  secDiary.appendChild(hDiary);
  secDiary.appendChild(diaryBody);

  scroll.appendChild(secMarks);
  scroll.appendChild(secDiary);

  document.body.appendChild(layer);
  overlayModalLayer = layer;

  const shut = () => {
    playUiClick?.();
    closeOverlayModal();
  };
  wireClose(shut);

  overlayModalOnKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') shut();
  };
  window.addEventListener('keydown', overlayModalOnKey);

  requestAnimationFrame(() => dismiss.focus());
}

function formatItemEquipmentStatParts(it: ItemDef): string[] {
  const parts: string[] = [];
  if (it.damage !== 0) {
    parts.push(it.damage > 0 ? `Dano +${it.damage}` : `Dano ${it.damage}`);
  }
  if (it.armor !== 0) {
    parts.push(it.armor > 0 ? `Armadura +${it.armor}` : `Armadura ${it.armor}`);
  }
  const attrs: [keyof ItemDef, string][] = [
    ['bonusStr', 'STR'],
    ['bonusAgi', 'AGI'],
    ['bonusMind', 'MEN'],
    ['bonusLuck', 'SOR'],
  ];
  for (const [key, label] of attrs) {
    const v = it[key];
    if (typeof v !== 'number' || v === 0) continue;
    parts.push(`${label} ${v > 0 ? '+' : ''}${v}`);
  }
  if (it.cursed) parts.push('Amaldiçoado');
  return parts;
}

function isPassiveUnlocked(state: GameState, leader: Character): boolean {
  return (
    state.inventory.includes(PASSIVE_UNLOCK_ITEM_ID) ||
    leader.weaponId === PASSIVE_UNLOCK_ITEM_ID ||
    leader.armorId === PASSIVE_UNLOCK_ITEM_ID ||
    leader.relicId === PASSIVE_UNLOCK_ITEM_ID
  );
}

function countEquippedSlots(c: Character): number {
  return [c.weaponId, c.armorId, c.relicId].filter(Boolean).length;
}

function appendCharacterSheetEquipSection(
  scroll: HTMLElement,
  c: Character,
  registry: ContentRegistry
): void {
  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'Equipamento';
  const grid = document.createElement('div');
  grid.className = 'character-sheet-equip-grid';

  const slotIcon: Record<string, string> = {
    Arma: icons.weapon,
    Armadura: icons.armor,
    Relíquia: icons.relic,
  };
  const slots: Array<{ label: string; id: string | null }> = [
    { label: 'Arma', id: c.weaponId },
    { label: 'Armadura', id: c.armorId },
    { label: 'Relíquia', id: c.relicId },
  ];

  for (const { label, id } of slots) {
    const card = document.createElement('article');
    card.className = id ? 'character-sheet-slot-card' : 'character-sheet-slot-card character-sheet-slot-card--empty';
    const ic = slotIcon[label] ?? icons.equipment;
    const head = document.createElement('div');
    head.className = 'character-sheet-slot-head';
    head.innerHTML = `${iconWrap(ic, 'character-sheet-slot-icon-wrap')}<span class="character-sheet-slot-label">${escHtml(label)}</span>`;
    card.appendChild(head);
    if (!id) {
      const p = document.createElement('p');
      p.className = 'character-sheet-slot-empty';
      p.textContent = 'Vazio';
      card.appendChild(p);
    } else {
      const it = registry.data.items[id];
      const nameEl = document.createElement('p');
      nameEl.className = 'character-sheet-slot-name';
      nameEl.textContent = it?.name ?? id;
      card.appendChild(nameEl);
      if (it) {
        const statParts = formatItemEquipmentStatParts(it);
        if (statParts.length > 0) {
          const stats = document.createElement('p');
          stats.className = 'character-sheet-slot-stats';
          stats.textContent = statParts.join(' · ');
          card.appendChild(stats);
        }
      }
    }
    grid.appendChild(card);
  }

  sec.appendChild(h);
  sec.appendChild(grid);
  scroll.appendChild(sec);
}

function appendCharacterSheetPassivesSection(
  scroll: HTMLElement,
  opts: {
    passiveUnlocked: boolean;
    classPassiveHtml: { name: string; description: string; iconSvg: string } | null;
    storyPassives: Array<{ name: string; description: string; iconSvg: string }>;
  }
): void {
  const hasClass = opts.passiveUnlocked && opts.classPassiveHtml;
  const hasStory = opts.storyPassives.length > 0;
  if (!hasClass && !hasStory) return;

  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'Passivos';
  const body = document.createElement('div');
  body.className = 'character-sheet-passives-body';

  if (hasClass && opts.classPassiveHtml) {
    const block = document.createElement('div');
    block.className = 'character-sheet-passive-block';
    const row = document.createElement('div');
    row.className = 'character-sheet-passive-title-row';
    row.innerHTML = `${iconWrap(opts.classPassiveHtml.iconSvg, 'ui-icon-wrap ui-icon-wrap--sm')}<strong class="character-sheet-passive-name">${escHtml(opts.classPassiveHtml.name)}</strong>`;
    const desc = document.createElement('p');
    desc.className = 'character-sheet-passive-desc';
    desc.textContent = opts.classPassiveHtml.description;
    block.appendChild(row);
    block.appendChild(desc);
    body.appendChild(block);
  }

  for (const sp of opts.storyPassives) {
    const block = document.createElement('div');
    block.className = 'character-sheet-passive-block character-sheet-passive-block--story';
    const row = document.createElement('div');
    row.className = 'character-sheet-passive-title-row';
    row.innerHTML = `${iconWrap(sp.iconSvg, 'ui-icon-wrap ui-icon-wrap--sm')}<strong class="character-sheet-passive-name">${escHtml(sp.name)}</strong>`;
    const desc = document.createElement('p');
    desc.className = 'character-sheet-passive-desc';
    desc.textContent = sp.description;
    block.appendChild(row);
    block.appendChild(desc);
    body.appendChild(block);
  }

  sec.appendChild(h);
  sec.appendChild(body);
  scroll.appendChild(sec);
}

function appendCharacterSheetSpellsSection(scroll: HTMLElement, state: GameState, registry: ContentRegistry): void {
  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'Magias aprendidas';
  const body = document.createElement('div');
  body.className = 'character-sheet-spells-body';

  const spellLines = state.knownSpells
    .map((id) => registry.data.spells[id])
    .filter((sp): sp is SpellDef => !!sp);

  if (spellLines.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diary-modal-empty';
    empty.textContent = 'Nenhuma magia aprendida.';
    body.appendChild(empty);
  } else {
    for (const sp of spellLines) {
      const row = document.createElement('div');
      row.className = 'character-sheet-spell-row';
      const emoji = document.createElement('span');
      emoji.className = 'character-sheet-spell-emoji';
      emoji.setAttribute('aria-hidden', 'true');
      emoji.textContent = spellEmoji(sp.id, sp);
      const text = document.createElement('div');
      text.className = 'character-sheet-spell-text';
      const nameEl = document.createElement('p');
      nameEl.className = 'character-sheet-spell-name';
      nameEl.textContent = sp.name;
      const mech = document.createElement('p');
      mech.className = 'character-sheet-spell-mech';
      mech.textContent = `${sp.manaCost} mana · ${spellSidebarMechanicsLinePt(sp)}`;
      text.appendChild(nameEl);
      text.appendChild(mech);
      row.appendChild(emoji);
      row.appendChild(text);
      body.appendChild(row);
    }
  }

  sec.appendChild(h);
  sec.appendChild(body);
  scroll.appendChild(sec);
}

function appendCharacterSheetSpellsSectionCompanion(scroll: HTMLElement): void {
  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'Magias';
  const body = document.createElement('div');
  body.className = 'character-sheet-spells-body';
  const p = document.createElement('p');
  p.className = 'diary-modal-empty';
  p.textContent = 'Magias pertencem ao líder do grupo.';
  body.appendChild(p);
  sec.appendChild(h);
  sec.appendChild(body);
  scroll.appendChild(sec);
}

function appendCharacterSheetLoreSection(scroll: HTMLElement, paragraphs: string[]): void {
  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'História';
  const body = document.createElement('div');
  body.className = 'character-sheet-lore-body';
  if (paragraphs.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'diary-modal-empty';
    empty.textContent = 'Sem texto gravado.';
    body.appendChild(empty);
  } else {
    for (const para of paragraphs) {
      const p = document.createElement('p');
      p.className = 'character-sheet-lore-p';
      p.textContent = para;
      body.appendChild(p);
    }
  }
  sec.appendChild(h);
  sec.appendChild(body);
  scroll.appendChild(sec);
}

type CharacterSheetOpenParams =
  | { kind: 'hero'; state: GameState; registry: ContentRegistry; character: Character }
  | { kind: 'companion'; state: GameState; registry: ContentRegistry; character: Character };

function openCharacterSheetModal(params: CharacterSheetOpenParams, playUiClick?: () => void): void {
  closeOverlayModal();
  playUiClick?.();

  const { state, registry, character: c } = params;
  const cid = c.class as ClassId;
  const clsLabel = registry.ui.getHeroClassLabel(cid, c.path);

  const titleId =
    params.kind === 'hero' ? 'character-sheet-title-hero' : `character-sheet-title-${c.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  const subParts: string[] = [clsLabel];
  if (params.kind === 'hero') {
    const nSpells = state.knownSpells.length;
    subParts.push(nSpells === 1 ? '1 magia' : `${nSpells} magias`);
    subParts.push(`${countEquippedSlots(c)}/3 itens`);
  } else {
    subParts.push(`${countEquippedSlots(c)}/3 itens`);
  }

  const { layer, scroll, dismiss, wireClose } = createSheetModalShell({
    layerClass: 'sheet-modal-layer character-sheet-modal-layer',
    titleId,
    kicker: params.kind === 'hero' ? 'Herói' : 'Companheiro',
    title: c.name,
    sub: subParts.join(' · '),
    backdropAriaLabel: 'Fechar ficha',
  });

  appendCharacterSheetStatsSection(scroll, c, state, registry, {
    showLevelXp: params.kind === 'hero',
  });
  appendCharacterSheetEquipSection(scroll, c, registry);

  if (params.kind === 'hero') {
    const leader = state.party[0]!;
    const pu = isPassiveUnlocked(state, leader);
    const passiveDef = registry.data.passives[cid];
    const classPassive = pu
      ? {
          name: passiveDef?.name ?? 'Passivo de classe',
          description: passiveDef?.description ?? 'Sem descrição.',
          iconSvg: passiveSidebarIconSvg(passiveDef?.id ?? ''),
        }
      : null;
    const storyPassives: Array<{ name: string; description: string; iconSvg: string }> = [];
    for (const pid of state.leadStoryPassives) {
      const def = registry.data.leadStoryPassives[pid];
      if (def) {
        storyPassives.push({
          name: def.name,
          description: def.description,
          iconSvg: passiveSidebarIconSvg(pid),
        });
      }
    }
    appendCharacterSheetPassivesSection(scroll, {
      passiveUnlocked: pu,
      classPassiveHtml: classPassive,
      storyPassives,
    });
    appendCharacterSheetSpellsSection(scroll, state, registry);
    const loreParas = registry.ui.getHeroLore(cid, c.path).split('\n\n').filter(Boolean);
    appendCharacterSheetLoreSection(scroll, loreParas);
  } else {
    const leader = state.party[0]!;
    const pu = isPassiveUnlocked(state, leader);
    const passiveDef = registry.data.passives[cid];
    const classPassive = pu
      ? {
          name: passiveDef?.name ?? 'Passivo de classe',
          description: passiveDef?.description ?? 'Sem descrição.',
          iconSvg: passiveSidebarIconSvg(passiveDef?.id ?? ''),
        }
      : null;
    appendCharacterSheetPassivesSection(scroll, {
      passiveUnlocked: pu,
      classPassiveHtml: classPassive,
      storyPassives: [],
    });
    appendCharacterSheetSpellsSectionCompanion(scroll);
    const def = registry.data.companions[c.id];
    const loreRaw = def?.lorePt ?? '';
    const loreParas = loreRaw ? loreRaw.split('\n\n').filter(Boolean) : [];
    appendCharacterSheetLoreSection(scroll, loreParas);
  }

  document.body.appendChild(layer);
  overlayModalLayer = layer;

  const shut = () => {
    playUiClick?.();
    closeOverlayModal();
  };
  wireClose(shut);

  overlayModalOnKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') shut();
  };
  window.addEventListener('keydown', overlayModalOnKey);

  requestAnimationFrame(() => dismiss.focus());
}

function statHint(label: string): string {
  const hints: Record<string, string> = {
    Nível: 'Nível atual do herói. Define progressão e desbloqueios.',
    HP: 'Pontos de vida. Se chegar a 0, o personagem cai.',
    Mana: 'Recurso usado para lançar magias.',
    Stress: 'Tensão mental em combate. Em 4, entra em pânico.',
    CA: 'Classe de Armadura: valor de defesa contra ataques.',
    STR: 'Força: melhora ataques físicos e dano corpo a corpo.',
    AGI: 'Agilidade: afeta defesa e iniciativa.',
    MEN: 'Mente: melhora eficácia de magia e ações de foco.',
    SOR: 'Sorte: afeta bônus de sorte e alguns testes.',
    CRIT: 'Chance de crítico em ataques físicos.',
    XP: 'Experiência acumulada para subir de nível.',
    Dia: 'Dia narrativo: avança quando sais de um acampamento principal (fogueira).',
  };
  return hints[label] ?? label;
}

function hintedLabel(label: string): string {
  return `<span class="sidebar-hint-label" title="${escHtml(statHint(label))}">${escHtml(label)}</span>`;
}

function formatStatAttrsLineHtml(
  c: Character,
  state: GameState,
  registry: ContentRegistry,
  opts?: { compact?: boolean }
): string {
  const data = registry.data;
  const eq = sumEquippedItemBonuses(data, c);
  const str = effectiveLeadAttr(state, c, 'str') + eq.str;
  const agi = effectiveLeadAttr(state, c, 'agi') + eq.agi;
  const men = effectiveLeadAttr(state, c, 'mind') + eq.mind;
  const sor = getEffectiveLuck(c, data, state);
  const ca = getCharacterArmorClass(data, c, state);
  const caEq = getEquippedArmorPoints(data, c);
  const critRatioPct = Math.round((c.critRatio ?? 0) * 100);
  const cls = opts?.compact ? 'sidebar-line attrs party-member-card-stats' : 'sidebar-line attrs';
  const attrs: Array<{ label: string; value: string; bonus?: string }> = [
    { label: 'CA', value: String(ca), bonus: statBonusParen(caEq) },
    { label: 'STR', value: String(str), bonus: statBonusParen(eq.str) },
    { label: 'AGI', value: String(agi), bonus: statBonusParen(eq.agi) },
    { label: 'MEN', value: String(men), bonus: statBonusParen(eq.mind) },
    { label: 'SOR', value: String(sor), bonus: statBonusParen(eq.luck) },
    { label: 'CRIT', value: `${critRatioPct}%` },
  ];
  return `<div class="${cls}">${attrs
    .map(
      (attr) =>
        `<span class="sidebar-attr-item"><span class="sidebar-attr-label">${hintedLabel(attr.label)}</span> <strong>${attr.value}</strong>${attr.bonus ?? ''}</span>`
    )
    .join('')}</div>`;
}

function appendHtmlFragment(parent: HTMLElement, html: string): void {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  parent.appendChild(t.content);
}

function appendCharacterSheetStatsSection(
  scroll: HTMLElement,
  c: Character,
  state: GameState,
  registry: ContentRegistry,
  opts: { showLevelXp: boolean }
): void {
  const sec = document.createElement('section');
  sec.className = 'diary-modal-section';
  const h = document.createElement('h3');
  h.className = 'diary-modal-section-title';
  h.textContent = 'Resumo';
  const body = document.createElement('div');
  body.className = 'character-sheet-stats-body';

  if (opts.showLevelXp) {
    const lv = state.level;
    const need = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
    const xpLine =
      lv >= MAX_LEVEL
        ? `<div class="sidebar-line character-sheet-stat-line">${hintedLabel('Nível')} <strong>${lv}</strong> · <em>Máx.</em></div>`
        : `<div class="sidebar-line character-sheet-stat-line">${hintedLabel('Nível')} <strong>${lv}</strong> · ${hintedLabel('XP')} <strong>${state.xp}</strong> / <strong>${need}</strong></div>${hpBarMarkup(state.xp, need)}`;
    appendHtmlFragment(body, xpLine);
  }

  appendHtmlFragment(
    body,
    `<div class="sidebar-line character-sheet-stat-line">${hintedLabel('HP')} <strong>${c.hp}</strong> / <strong>${c.maxHp}</strong></div>${hpBarMarkup(c.hp, c.maxHp, 'hp-bar-resource', 'hp')}`
  );

  if (c.maxMana > 0) {
    appendHtmlFragment(
      body,
      `<div class="sidebar-line character-sheet-stat-line">${hintedLabel('Mana')} <strong>${c.mana}</strong> / <strong>${c.maxMana}</strong></div>${manaBarMarkup(c.mana, c.maxMana)}`
    );
  }

  appendHtmlFragment(
    body,
    `<div class="sidebar-line sidebar-stress-label character-sheet-stat-line">${hintedLabel('Stress')} <strong>${c.stress}</strong> / 4</div>${stressBarMarkup(c.stress)}`
  );

  if (state.activeBuffs.length > 0) {
    appendHtmlFragment(
      body,
      `<div class="sidebar-line sidebar-buffs character-sheet-stat-line">${state.activeBuffs
        .map((b) => `${b.attr.toUpperCase()} ${b.delta >= 0 ? '+' : ''}${b.delta} (${b.remainingScenes} cena(s))`)
        .join(' · ')}</div>`
    );
  }

  appendHtmlFragment(body, formatStatAttrsLineHtml(c, state, registry));

  sec.appendChild(h);
  sec.appendChild(body);
  scroll.appendChild(sec);
}

function inventoryMarkup(state: GameState, registry: ContentRegistry): string {
  const inv = state.inventory;
  if (!inv.length) {
    return `<div class="sidebar-line inventory-empty sidebar-line--with-icon">${iconWrap(icons.inventory)}<span>Nenhum item ainda.</span></div>`;
  }
  const counts = new Map<string, number>();
  for (const id of inv) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const lines: string[] = [];
  for (const [id, n] of counts) {
    const def = registry.data.items[id];
    const label = def?.name ?? id;
    const suffix = n > 1 ? ` ×${n}` : '';
    lines.push(
      `<div class="sidebar-line sidebar-inventory-item sidebar-line--with-icon">${iconWrap(icons.item, 'ui-icon-wrap ui-icon-wrap--sm')}<span>${escHtml(label)}${escHtml(suffix)}</span></div>`
    );
  }
  return lines.join('');
}

function companionCardMarkup(c: Character, state: GameState, registry: ContentRegistry): string {
  const cid = c.class as ClassId;
  const clsLabel = registry.ui.getHeroClassLabel(cid, c.path);
  const def = registry.data.companions[c.id];
  const hasLore = Boolean(def?.lorePt?.trim());
  const filled = countEquippedSlots(c);
  const metaParts: string[] = [
    `${filled}/3 itens`,
    hasLore ? 'história' : 'sem lore',
  ];
  const countLabel = metaParts.join(' · ');
  return `<div class="companion-sidebar-card">
      <div class="companion-sidebar-name">${escHtml(c.name)}</div>
      <div class="companion-sidebar-class">${escHtml(clsLabel)}</div>
      <div class="sidebar-line">${hintedLabel('HP')} <strong>${c.hp}</strong> / <strong>${c.maxHp}</strong></div>
      ${hpBarMarkup(c.hp, c.maxHp, 'hp-bar-resource', 'hp')}
      <div class="sidebar-line sidebar-stress-label">${hintedLabel('Stress')} <strong>${c.stress}</strong> / 4</div>
      ${stressBarMarkup(c.stress)}
      ${formatStatAttrsLineHtml(c, state, registry, { compact: true })}
      <div class="sidebar-collapse character-sheet-sidebar-card">
        <button type="button" class="sidebar-collapse-trigger diary-sidebar-open-btn" data-companion-sheet="${escHtml(c.id)}" aria-haspopup="dialog">
          ${collapseTriggerStart(icons.person, 'Ver ficha')}<span class="diary-sidebar-open-meta">${escHtml(countLabel)}<span class="diary-sidebar-open-hint" aria-hidden="true">›</span></span>
        </button>
      </div>
    </div>`;
}

function companionsSectionMarkup(state: GameState, registry: ContentRegistry): string {
  const rest = state.party.slice(1);
  if (!rest.length) {
    return `<div class="sidebar-line sidebar-muted">Nenhum companheiro no grupo.</div>`;
  }
  return rest.map((ch) => companionCardMarkup(ch, state, registry)).join('');
}

function repBarMarkup(
  label: string,
  value: number,
  variant: 'vigilia' | 'circulo' | 'culto'
): string {
  const pct = Math.min(100, Math.max(0, Math.round(((value + 3) / 6) * 100)));
  return `<div class="faction-rep-row">
    <div class="sidebar-line faction-rep-label sidebar-line--with-icon">${iconWrap(icons.factions)}<span>${escHtml(label)} <strong>${value}</strong></span></div>
    <div class="faction-rep-track faction-rep-track--${variant}" title="${label}: ${value} (−3 a +3)">
      <div class="faction-rep-fill faction-rep-fill--${variant}" style="width:${pct}%"></div>
    </div>
  </div>`;
}

const FACTION_LORE_PT: Record<'vigilia' | 'circulo' | 'culto', string> = {
  vigilia:
    'Ordem de patrulhas e juramentos na escuridão: honra tem gosto de cinza, e quem serve não é cidadão — é ferramenta até provar o contrário.',
  circulo:
    'O Círculo Cinzento troca símbolos por sorte: rituais frágeis, empréstimos de destino e preços que não se pagam só em ouro. Hesitar é deixar o cinza fechar sem ti.',
  culto:
    'O Terceiro Sino ecoa onde não há torre: devotos carregam o som como relíquia, e a corrupção é moeda de quem quer ouvir o mundo calar quando respira.',
};

function factionLoreBlurb(variant: 'vigilia' | 'circulo' | 'culto'): string {
  return `<p class="faction-lore-blurb">${escHtml(FACTION_LORE_PT[variant])}</p>`;
}

function wireSidebarDetails(
  hud: HTMLElement,
  sidebarSections: Record<string, boolean>,
  onSectionToggle: (key: string, open: boolean) => void
): void {
  hud.querySelectorAll('details[data-section]').forEach((el) => {
    const d = el as HTMLDetailsElement;
    const key = d.dataset.section;
    if (!key) return;
    if (sidebarSections[key] !== undefined) {
      d.open = sidebarSections[key]!;
    }
    d.addEventListener('toggle', () => {
      onSectionToggle(key, d.open);
    });
  });
}

export function buildGameSidebar({
  state,
  registry,
  sidebarSections,
  onSectionToggle,
  playUiClick,
}: SidebarBuilderParams): HTMLElement {
  const hud = document.createElement('div');
  hud.className = 'sidebar-inner';
  const r = state.resources;
  const gold = r.gold ?? 0;
  const p = state.party[0];
  const rep = state.reputation;

  const openRec = sidebarSections['recursos'] ? ' open' : '';
  const openInv = sidebarSections['inventario'] ? ' open' : '';
  const openFac = sidebarSections['faccoes'] ? ' open' : '';

  const personagemBlock = (() => {
    if (!p) {
      return `<div class="sidebar-line">Escolha uma classe na narrativa.</div>
        <div class="sidebar-line">Nível <strong>${state.level}</strong> · XP <strong>${state.xp}</strong></div>`;
    }
    const cid = p.class as ClassId;
    const lv = state.level;
    const need = lv >= MAX_LEVEL ? 0 : xpToNextLevel(lv);
    const xpLine =
      lv >= MAX_LEVEL
        ? `<div class="sidebar-line">${hintedLabel('Nível')} <strong>${lv}</strong> · <em>Máx.</em></div>`
        : `<div class="sidebar-line">${hintedLabel('Nível')} <strong>${lv}</strong> · ${hintedLabel('XP')} <strong>${state.xp}</strong> / <strong>${need}</strong></div>
        ${hpBarMarkup(state.xp, need)}`;
    const buffHint =
      state.activeBuffs.length > 0
        ? `<div class="sidebar-line sidebar-buffs">${state.activeBuffs
            .map((b) => `${b.attr.toUpperCase()} ${b.delta >= 0 ? '+' : ''}${b.delta} (${b.remainingScenes} cena(s))`)
            .join(' · ')}</div>`
        : '';
    const nSpells = state.knownSpells.length;
    const filledEquip = countEquippedSlots(p);
    const heroMetaParts: string[] = [
      nSpells === 1 ? '1 magia' : `${nSpells} magias`,
      `${filledEquip}/3 itens`,
    ];
    const heroCountLabel = heroMetaParts.join(' · ');
    return `<div class="sidebar-line">Nome <strong>${escHtml(p.name)}</strong></div>
        <div class="sidebar-line sidebar-class-line">${escHtml(registry.ui.getHeroClassLabel(cid, p.path))}</div>
        ${xpLine}
        <div class="sidebar-line">${hintedLabel('HP')} <strong>${p.hp}/${p.maxHp}</strong></div>
        ${hpBarMarkup(p.hp, p.maxHp, 'hp-bar-resource', 'hp')}
        ${p.maxMana > 0 ? `<div class="sidebar-line">${hintedLabel('Mana')} <strong>${p.mana}</strong> / <strong>${p.maxMana}</strong></div>${manaBarMarkup(p.mana, p.maxMana)}` : ''}
        <div class="sidebar-line sidebar-stress-label">${hintedLabel('Stress')} <strong>${p.stress}</strong> / 4</div>
        ${stressBarMarkup(p.stress)}
        ${buffHint}
        ${formatStatAttrsLineHtml(p, state, registry)}
        <div class="sidebar-collapse character-sheet-sidebar-card">
          <button type="button" class="sidebar-collapse-trigger diary-sidebar-open-btn" data-open-hero-sheet aria-haspopup="dialog">
            ${collapseTriggerStart(icons.scroll, 'Ficha do herói')}<span class="diary-sidebar-open-meta">${escHtml(heroCountLabel)}<span class="diary-sidebar-open-hint" aria-hidden="true">›</span></span>
          </button>
        </div>`;
  })();

  hud.innerHTML = `
      <h2 class="sidebar-title">Herói</h2>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.progress)}<span>Progresso</span></div>
        <div class="sidebar-static-body">
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.progress)}<span>Capítulo <strong>${state.chapter}</strong></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.memories)}<span>${hintedLabel('Dia')} <strong>${state.day}</strong></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.tier)}<span>Tier <strong>${state.narrativeTier}</strong></span></div>
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.person)}<span>Personagem</span></div>
        <div class="sidebar-static-body sidebar-stats">
          ${personagemBlock}
        </div>
      </div>
      <div class="sidebar-static">
        <div class="sidebar-static-title sidebar-static-title--with-icon">${iconWrap(icons.companions)}<span>Companheiros</span></div>
        <div class="sidebar-static-body sidebar-stats">
          ${companionsSectionMarkup(state, registry)}
        </div>
      </div>
      <details class="sidebar-collapse"${openRec} data-section="recursos">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.resources, 'Recursos')}</summary>
        <div class="sidebar-collapse-body">
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.gold)}<span>Gold <strong>${gold}</strong></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.supply)}<span>Suprimento <strong>${r.supply}</strong> <span class="sidebar-resource-hint">(mapa, acampamento)</span></span></div>
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.faith)}<span>Fé <strong>${r.faith}</strong></span></div>
          ${state.extraLifeReady ? `<div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.tier)}<span>Vida extra <strong>disponível</strong> <span class="sidebar-resource-hint">(5 fé)</span></span></div>` : ''}
          <div class="sidebar-line sidebar-line--with-icon">${iconWrap(icons.corruption)}<span>Corrupção <strong>${r.corruption}</strong></span></div>
        </div>
      </details>
      <details class="sidebar-collapse"${openInv} data-section="inventario">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.inventory, 'Inventário')}</summary>
        <div class="sidebar-collapse-body sidebar-inventory">
          ${inventoryMarkup(state, registry)}
        </div>
      </details>
      <details class="sidebar-collapse"${openFac} data-section="faccoes">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.factions, 'Facções')}</summary>
        <div class="sidebar-collapse-body sidebar-faccoes">
          ${repBarMarkup('Vigília', rep.vigilia, 'vigilia')}
          ${factionLoreBlurb('vigilia')}
          ${repBarMarkup('Círculo', rep.circulo, 'circulo')}
          ${factionLoreBlurb('circulo')}
          ${repBarMarkup('Culto', rep.culto, 'culto')}
          ${factionLoreBlurb('culto')}
        </div>
      </details>
    `;

  if (state.diary.length || state.marks.length) {
    const diaryCard = document.createElement('div');
    diaryCard.className = 'sidebar-collapse diary-sidebar-card';
    const metaParts: string[] = [];
    if (state.diary.length) {
      metaParts.push(state.diary.length === 1 ? '1 entrada' : `${state.diary.length} entradas`);
    }
    if (state.marks.length) {
      metaParts.push(state.marks.length === 1 ? '1 marca' : `${state.marks.length} marcas`);
    }
    const countLabel = metaParts.join(' · ');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sidebar-collapse-trigger diary-sidebar-open-btn';
    btn.setAttribute('aria-haspopup', 'dialog');
    btn.innerHTML = `${collapseTriggerStart(icons.diary, 'Diário')}<span class="diary-sidebar-open-meta">${escHtml(countLabel)}<span class="diary-sidebar-open-hint" aria-hidden="true">›</span></span>`;
    btn.addEventListener('click', () =>
      openDiaryModal({ diary: state.diary, marks: state.marks, registry }, playUiClick)
    );
    diaryCard.appendChild(btn);
    hud.appendChild(diaryCard);
  }

  wireSidebarDetails(hud, sidebarSections, onSectionToggle);

  const heroSheetBtn = hud.querySelector<HTMLButtonElement>('[data-open-hero-sheet]');
  if (heroSheetBtn && p) {
    heroSheetBtn.addEventListener('click', () =>
      openCharacterSheetModal({ kind: 'hero', state, registry, character: p }, playUiClick)
    );
  }
  hud.querySelectorAll<HTMLButtonElement>('[data-companion-sheet]').forEach((btn) => {
    const rawId = btn.getAttribute('data-companion-sheet');
    if (!rawId) return;
    const ch = state.party.slice(1).find((x) => x.id === rawId);
    if (!ch) return;
    btn.addEventListener('click', () =>
      openCharacterSheetModal({ kind: 'companion', state, registry, character: ch }, playUiClick)
    );
  });

  return hud;
}
