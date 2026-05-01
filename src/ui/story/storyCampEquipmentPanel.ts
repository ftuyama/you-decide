import type { Effect, GameState } from '../../engine/schema.ts';
import type { ContentRegistry } from '../../content/registry.ts';
import { formatItemEquipmentStatParts } from '../formatItemEquipment.ts';
import { iconWrap, icons } from '../icons/index.ts';

const CAMP_EQUIPMENT_SCENES = new Set([
  'act2/camp/manage_equip',
  'act5/camp/manage_equip',
  'act6/camp/manage_equip',
]);

export function isCampEquipmentScene(sceneId: string): boolean {
  return CAMP_EQUIPMENT_SCENES.has(sceneId);
}

function inventoryEquipmentIdsForSlot(
  state: GameState,
  registry: ContentRegistry,
  slot: 'weapon' | 'armor' | 'relic'
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of state.inventory) {
    const def = registry.data.items[id];
    if (!def || def.slot !== slot) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

export type CampEquipmentCallbacks = {
  unlockAudio: () => void;
  playUiClick: () => void;
  /** applyEffects + stabilize + assign + render */
  commitEquipEffects: (effects: Effect[]) => void;
};

export function appendCampEquipmentPanel(
  parent: HTMLElement,
  state: GameState,
  registry: ContentRegistry,
  cbs: CampEquipmentCallbacks
): void {
  if (!isCampEquipmentScene(state.sceneId) || state.party.length === 0) return;

  const items = registry.data.items;
  const multiParty = state.party.length > 1;

  const panel = document.createElement('div');
  panel.className = 'camp-equip-panel';
  const hdr = document.createElement('div');
  hdr.className = 'camp-equip-hdr camp-equip-hdr--with-icon';
  hdr.innerHTML = `${iconWrap(icons.equipment)}<span>Equipamento no acampamento</span>`;
  panel.appendChild(hdr);

  const intro = document.createElement('p');
  intro.className = 'camp-equip-intro';
  intro.textContent =
    'Retirar devolve a peça ao inventário; equipar usa uma peça que já tens no inventário.';
  panel.appendChild(intro);

  const slotSvg: Record<'weapon' | 'armor' | 'relic', string> = {
    weapon: icons.weapon,
    armor: icons.armor,
    relic: icons.relic,
  };

  const appendMemberHead = (target: HTMLElement, member: (typeof state.party)[number]): void => {
    const nameEl = document.createElement('div');
    nameEl.className = 'camp-equip-member-name';
    nameEl.textContent = member.name;
    target.appendChild(nameEl);
    const classEl = document.createElement('div');
    classEl.className = 'camp-equip-member-class';
    classEl.textContent = registry.ui.getHeroClassLabel(member.class, member.path);
    target.appendChild(classEl);
  };

  for (let partyIndex = 0; partyIndex < state.party.length; partyIndex++) {
    const member = state.party[partyIndex]!;
    const slotGridHost = document.createElement('div');
    slotGridHost.className = 'camp-equip-member-body';

    if (multiParty) {
      const det = document.createElement('details');
      det.className = 'camp-equip-member-details';
      det.open = true;
      const sum = document.createElement('summary');
      sum.className = 'camp-equip-member-summary';
      appendMemberHead(sum, member);
      det.appendChild(sum);
      det.appendChild(slotGridHost);
      panel.appendChild(det);
    } else {
      const flat = document.createElement('div');
      flat.className = 'camp-equip-member camp-equip-member--flat';
      appendMemberHead(flat, member);
      flat.appendChild(slotGridHost);
      panel.appendChild(flat);
    }

    const slotGrid = document.createElement('div');
    slotGrid.className = 'camp-equip-slot-grid';
    slotGridHost.appendChild(slotGrid);

    const slotDefs: { key: 'weapon' | 'armor' | 'relic'; label: string; cur: string | null }[] = [
      { key: 'weapon', label: 'Arma', cur: member.weaponId },
      { key: 'armor', label: 'Armadura', cur: member.armorId },
      { key: 'relic', label: 'Relíquia', cur: member.relicId },
    ];

    for (const { key, label, cur } of slotDefs) {
      const candidates = inventoryEquipmentIdsForSlot(state, registry, key);

      const slotWrap = document.createElement('div');
      slotWrap.className = 'camp-equip-slot-wrap';

      const article = document.createElement('article');
      article.className = cur
        ? 'character-sheet-slot-card'
        : 'character-sheet-slot-card character-sheet-slot-card--empty';

      const head = document.createElement('div');
      head.className = 'character-sheet-slot-head';
      head.innerHTML = `${iconWrap(slotSvg[key], 'character-sheet-slot-icon-wrap')}<span class="character-sheet-slot-label">${label}</span>`;
      article.appendChild(head);

      if (cur) {
        const def = items[cur];
        const unequipBtn = document.createElement('button');
        unequipBtn.type = 'button';
        unequipBtn.className = 'camp-equip-btn camp-equip-candidate camp-equip-btn--unequip';
        unequipBtn.title = 'Retirar ao inventário';
        unequipBtn.setAttribute('aria-label', 'Retirar ao inventário');
        const main = document.createElement('span');
        main.className = 'camp-equip-candidate-main';
        const nm = document.createElement('span');
        nm.className = 'camp-equip-candidate-name';
        nm.textContent = def?.name ?? cur;
        main.appendChild(nm);
        if (def) {
          const statParts = formatItemEquipmentStatParts(def);
          if (statParts.length > 0) {
            const st = document.createElement('span');
            st.className = 'camp-equip-candidate-stats';
            st.textContent = statParts.join(' · ');
            main.appendChild(st);
          }
        }
        unequipBtn.appendChild(main);
        const act = document.createElement('span');
        act.className = 'camp-equip-candidate-action camp-equip-candidate-action--unequip';
        act.textContent = 'Retirar';
        unequipBtn.appendChild(act);
        const pi = partyIndex;
        const sk = key;
        unequipBtn.addEventListener('click', () => {
          cbs.unlockAudio();
          cbs.playUiClick();
          const eff: Effect = { op: 'unequipSlot', slot: sk, partyIndex: pi };
          cbs.commitEquipEffects([eff]);
        });
        article.appendChild(unequipBtn);
      } else {
        const emptyP = document.createElement('p');
        emptyP.className = 'character-sheet-slot-empty';
        emptyP.textContent = 'Nada equipado';
        article.appendChild(emptyP);
      }

      slotWrap.appendChild(article);

      if (candidates.length > 0) {
        const list = document.createElement('div');
        list.className = 'camp-equip-candidate-list';
        for (const itemId of candidates) {
          const def = items[itemId];
          if (!def) continue;
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'camp-equip-btn camp-equip-candidate';
          btn.setAttribute('aria-label', `Equipar ${def.name}`);
          const main = document.createElement('span');
          main.className = 'camp-equip-candidate-main';
          const nm = document.createElement('span');
          nm.className = 'camp-equip-candidate-name';
          nm.textContent = def.name;
          main.appendChild(nm);
          const statParts = formatItemEquipmentStatParts(def);
          if (statParts.length > 0) {
            const st = document.createElement('span');
            st.className = 'camp-equip-candidate-stats';
            st.textContent = statParts.join(' · ');
            main.appendChild(st);
          }
          btn.appendChild(main);
          const act = document.createElement('span');
          act.className = 'camp-equip-candidate-action';
          act.textContent = 'Equipar';
          btn.appendChild(act);
          const pi = partyIndex;
          btn.addEventListener('click', () => {
            cbs.unlockAudio();
            cbs.playUiClick();
            const eff: Effect = { op: 'equipItem', itemId, partyIndex: pi };
            cbs.commitEquipEffects([eff]);
          });
          list.appendChild(btn);
        }
        slotWrap.appendChild(list);
      } else if (!cur) {
        const hint = document.createElement('div');
        hint.className = 'camp-equip-hint';
        hint.textContent = 'Sem peças deste tipo no inventário.';
        article.appendChild(hint);
      }

      slotGrid.appendChild(slotWrap);
    }
  }

  parent.appendChild(panel);
}
