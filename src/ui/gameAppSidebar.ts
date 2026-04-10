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

let diaryModalLayer: HTMLDivElement | null = null;
let diaryModalOnKey: ((e: KeyboardEvent) => void) | null = null;

function closeDiaryModal(): void {
  if (diaryModalOnKey) {
    window.removeEventListener('keydown', diaryModalOnKey);
    diaryModalOnKey = null;
  }
  if (diaryModalLayer) {
    diaryModalLayer.remove();
    diaryModalLayer = null;
  }
}

type DiaryModalOpenParams = {
  diary: string[];
  marks: string[];
  registry: ContentRegistry;
};

function openDiaryModal({ diary: entries, marks, registry }: DiaryModalOpenParams, playUiClick?: () => void): void {
  closeDiaryModal();
  playUiClick?.();

  const layer = document.createElement('div');
  layer.className = 'diary-modal-layer';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-modal', 'true');
  layer.setAttribute('aria-labelledby', 'diary-modal-title');

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'diary-modal-backdrop';
  backdrop.setAttribute('aria-label', 'Fechar diário');

  const panel = document.createElement('div');
  panel.className = 'diary-modal-panel';

  const header = document.createElement('div');
  header.className = 'diary-modal-header';

  const kicker = document.createElement('div');
  kicker.className = 'diary-entry-kicker';
  kicker.textContent = 'Cronista';

  const title = document.createElement('h2');
  title.id = 'diary-modal-title';
  title.className = 'diary-modal-title';
  title.textContent = 'Diário de campanha';

  const sub = document.createElement('div');
  sub.className = 'diary-entry-subkicker';
  const subParts: string[] = [];
  if (entries.length === 1) subParts.push('1 entrada registrada');
  else if (entries.length > 1) subParts.push(`${entries.length} entradas registradas`);
  if (marks.length === 1) subParts.push('1 marca');
  else if (marks.length > 1) subParts.push(`${marks.length} marcas`);
  sub.textContent = subParts.join(' · ');

  header.appendChild(kicker);
  header.appendChild(title);
  header.appendChild(sub);

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'diary-modal-close';
  closeBtn.setAttribute('aria-label', 'Fechar');
  closeBtn.innerHTML = '&times;';
  header.appendChild(closeBtn);

  const scroll = document.createElement('div');
  scroll.className = 'diary-modal-scroll';

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

  const footer = document.createElement('div');
  footer.className = 'diary-modal-footer';
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
  document.body.appendChild(layer);
  diaryModalLayer = layer;

  const shut = () => {
    playUiClick?.();
    closeDiaryModal();
  };
  backdrop.addEventListener('click', shut);
  closeBtn.addEventListener('click', shut);
  dismiss.addEventListener('click', shut);
  panel.addEventListener('click', (e) => e.stopPropagation());

  diaryModalOnKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') shut();
  };
  window.addEventListener('keydown', diaryModalOnKey);

  requestAnimationFrame(() => dismiss.focus());
}

function formatItemEquipmentStatsHtml(it: ItemDef): string {
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
  if (parts.length === 0) return '';
  return `<span class="sidebar-equip-stats">${parts.map((s) => escHtml(s)).join(' · ')}</span>`;
}

function sidebarEquipBodyHtml(c: Character, registry: ContentRegistry): string {
  const d = registry.data.items;
  const slotIcon: Record<string, string> = {
    Arma: icons.weapon,
    Armadura: icons.armor,
    Relíquia: icons.relic,
  };
  const line = (label: string, id: string | null) => {
    const ic = slotIcon[label] ?? icons.equipment;
    if (!id) {
      return `<p class="sidebar-equip-line sidebar-equip-line--empty">${iconWrap(ic)}<span class="sidebar-muted"><strong>${label}</strong> — —</span></p>`;
    }
    const it = d[id];
    const name = it?.name ?? id;
    const stats = it ? formatItemEquipmentStatsHtml(it) : '';
    return `<p class="sidebar-equip-line">${iconWrap(ic)}<span><strong>${label}</strong> — ${escHtml(name)}${stats ? `<br>${stats}` : ''}</span></p>`;
  };
  return `${line('Arma', c.weaponId)}${line('Armadura', c.armorId)}${line('Relíquia', c.relicId)}`;
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

function companionCardMarkup(
  c: Character,
  state: GameState,
  registry: ContentRegistry,
  sidebarSections: Record<string, boolean>
): string {
  const cid = c.class as ClassId;
  const clsLabel = registry.ui.getHeroClassLabel(cid, c.path);
  const def = registry.data.companions[c.id];
  const lore = def?.lorePt;
  const openKey = `companion_lore_${c.id}`;
  const open = sidebarSections[openKey] ? ' open' : '';
  const openEquipKey = `companion_equip_${c.id}`;
  const openEquip = sidebarSections[openEquipKey] ? ' open' : '';
  const equipBody = sidebarEquipBodyHtml(c, registry);
  const loreHtml = lore
    ? lore
        .split('\n\n')
        .map((para) => `<p>${escHtml(para)}</p>`)
        .join('')
    : `<p class="sidebar-muted">Sem história gravada.</p>`;
  return `<div class="companion-sidebar-card">
      <div class="companion-sidebar-name">${escHtml(c.name)}</div>
      <div class="companion-sidebar-class">${escHtml(clsLabel)}</div>
      <div class="sidebar-line">${hintedLabel('HP')} <strong>${c.hp}</strong> / <strong>${c.maxHp}</strong></div>
      ${hpBarMarkup(c.hp, c.maxHp, 'hp-bar-resource', 'hp')}
      <div class="sidebar-line sidebar-stress-label">${hintedLabel('Stress')} <strong>${c.stress}</strong> / 4</div>
      ${stressBarMarkup(c.stress)}
      ${formatStatAttrsLineHtml(c, state, registry, { compact: true })}
      <details class="sidebar-collapse sidebar-equip"${openEquip} data-section="${openEquipKey}">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.equipment, 'Equipamento')}</summary>
        <div class="sidebar-collapse-body sidebar-lore-body">${equipBody}</div>
      </details>
      <details class="sidebar-collapse companion-lore"${open} data-section="${openKey}">
        <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.scroll, 'História')}</summary>
        <div class="sidebar-collapse-body sidebar-lore-body">${loreHtml}</div>
      </details>
    </div>`;
}

function companionsSectionMarkup(
  state: GameState,
  registry: ContentRegistry,
  sidebarSections: Record<string, boolean>
): string {
  const rest = state.party.slice(1);
  if (!rest.length) {
    return `<div class="sidebar-line sidebar-muted">Nenhum companheiro no grupo.</div>`;
  }
  return rest.map((ch) => companionCardMarkup(ch, state, registry, sidebarSections)).join('');
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
  const openLore = sidebarSections['personagem_lore'] ? ' open' : '';
  const openSpells = sidebarSections['personagem_spells'] ? ' open' : '';
  const openEquip = sidebarSections['personagem_equip'] ? ' open' : '';
  const openPassive = sidebarSections['personagem_passivos'] ? ' open' : '';

  const personagemBlock = (() => {
    if (!p) {
      return `<div class="sidebar-line">Escolha uma classe na narrativa.</div>
        <div class="sidebar-line">Nível <strong>${state.level}</strong> · XP <strong>${state.xp}</strong></div>`;
    }
    const cid = p.class as ClassId;
    const loreHtml = registry.ui
      .getHeroLore(cid, p.path)
      .split('\n\n')
      .map((para) => `<p>${escHtml(para)}</p>`)
      .join('');
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
    const passiveUnlocked =
      state.inventory.includes(PASSIVE_UNLOCK_ITEM_ID) ||
      p.weaponId === PASSIVE_UNLOCK_ITEM_ID ||
      p.armorId === PASSIVE_UNLOCK_ITEM_ID ||
      p.relicId === PASSIVE_UNLOCK_ITEM_ID;
    const storyPassiveBlocks: string[] = [];
    for (const pid of state.leadStoryPassives) {
      const def = registry.data.leadStoryPassives[pid];
      if (def) {
        const ic = passiveSidebarIconSvg(pid);
        storyPassiveBlocks.push(
          `<p class="sidebar-passive-line sidebar-line--with-icon">${iconWrap(ic, 'ui-icon-wrap ui-icon-wrap--sm')}<span><strong>${escHtml(def.name)}</strong></span></p>
            <p class="sidebar-line sidebar-muted">${escHtml(def.description)}</p>`
        );
      }
    }
    const showPassivesSection = passiveUnlocked || storyPassiveBlocks.length > 0;
    const passiveDef = registry.data.passives[cid];
    const classPassiveBlock = passiveUnlocked
      ? `<p class="sidebar-passive-line sidebar-line--with-icon">${iconWrap(passiveSidebarIconSvg(passiveDef?.id ?? ''), 'ui-icon-wrap ui-icon-wrap--sm')}<span><strong>${escHtml(passiveDef?.name ?? 'Passivo de classe')}</strong></span></p>
            <p class="sidebar-line sidebar-muted">${escHtml(passiveDef?.description ?? 'Sem descrição.')}</p>`
      : '';
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
        ${(() => {
          const equipBody = sidebarEquipBodyHtml(p, registry);
          return `<details class="sidebar-collapse sidebar-equip"${openEquip} data-section="personagem_equip">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.equipment, 'Equipamento')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${equipBody}</div>
        </details>`;
        })()}
        ${showPassivesSection ? `<details class="sidebar-collapse sidebar-spells"${openPassive} data-section="personagem_passivos">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.tier, 'Passivos')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">
            ${classPassiveBlock}
            ${passiveUnlocked && storyPassiveBlocks.length > 0 ? '<hr class="sidebar-passive-divider" />' : ''}
            ${storyPassiveBlocks.join('')}
          </div>
        </details>` : ''}
        ${(() => {
          const spellLines = state.knownSpells
            .map((id) => registry.data.spells[id])
            .filter((sp): sp is SpellDef => !!sp);
          const body =
            spellLines.length === 0
              ? `<p class="sidebar-muted">Nenhuma magia aprendida.</p>`
              : spellLines
                  .map(
                    (sp) =>
                      `<p class="sidebar-spell-line sidebar-line--with-icon"><span class="spell-emoji" aria-hidden="true">${spellEmoji(sp.id, sp)}</span><span><strong>${escHtml(sp.name)}</strong> — ${sp.manaCost} mana · ${spellSidebarMechanicsLinePt(sp)}</span></p>`
                  )
                  .join('');
          return `<details class="sidebar-collapse sidebar-spells"${openSpells} data-section="personagem_spells">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.spellbook, 'Magias aprendidas')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${body}</div>
        </details>`;
        })()}
        <details class="sidebar-collapse sidebar-lore"${openLore} data-section="personagem_lore">
          <summary class="sidebar-collapse-trigger">${collapseTriggerStart(icons.scroll, 'História do herói')}</summary>
          <div class="sidebar-collapse-body sidebar-lore-body">${loreHtml}</div>
        </details>`;
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
          ${companionsSectionMarkup(state, registry, sidebarSections)}
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
  return hud;
}
