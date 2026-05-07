import { deserializeState, serializeState } from '../engine/core/index.ts';
import type { GameState } from '../engine/schema/index.ts';

/** Slots visíveis e graváveis fora do modo desenvolvedor. */
export const SAVE_SLOT_COUNT_PLAYER = 3;
/** Limite de slots com modo desenvolvedor (e teto de `localStorage`). */
export const SAVE_SLOT_COUNT_DEV = 10;

export function saveSlotLimit(devMode: boolean): number {
  return devMode ? SAVE_SLOT_COUNT_DEV : SAVE_SLOT_COUNT_PLAYER;
}

export function slotStorageKey(campaignId: string, slot: number): string {
  return `${campaignId}_save_v1_s${slot}`;
}

/** localStorage: último dia (YYYY-MM-DD) em que o bônus de retorno foi aplicado neste slot. */
export function slotReturnRewardDateKey(campaignId: string, slot: number): string {
  return `${campaignId}_return_reward_date_v2_s${slot}`;
}

/** Copia a gravação legada para o slot 1 se o slot 1 ainda estiver vazio. */
export function migrateLegacySaveIfNeeded(campaignId: string, legacySaveKey: string): void {
  try {
    const legacy = localStorage.getItem(legacySaveKey);
    if (!legacy?.trim()) return;
    const s1 = localStorage.getItem(slotStorageKey(campaignId, 1));
    if (s1?.trim()) return;
    localStorage.setItem(slotStorageKey(campaignId, 1), legacy);
    localStorage.removeItem(legacySaveKey);
  } catch {
    /* noop */
  }
}

export function readRawSlot(campaignId: string, slot: number): string | null {
  if (slot < 1 || slot > SAVE_SLOT_COUNT_DEV) return null;
  try {
    return localStorage.getItem(slotStorageKey(campaignId, slot));
  } catch {
    return null;
  }
}

/** True se já existir gravação legada ou em qualquer slot (primeira visita = false). */
export function hasAnyStoredSaveForCampaign(
  campaignId: string,
  legacySaveKey: string
): boolean {
  try {
    if (localStorage.getItem(legacySaveKey)?.trim()) return true;
    for (let s = 1; s <= SAVE_SLOT_COUNT_DEV; s++) {
      if (localStorage.getItem(slotStorageKey(campaignId, s))?.trim()) return true;
    }
  } catch {
    /* noop */
  }
  return false;
}

export type SlotPreview =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'wrongCampaign' }
  | { kind: 'ok'; chapter: number; level: number; playerName: string };

export function getSlotPreview(campaignId: string, slot: number): SlotPreview {
  const raw = readRawSlot(campaignId, slot);
  if (!raw?.trim()) return { kind: 'empty' };
  try {
    const s = deserializeState(raw);
    if (s.campaignId !== campaignId) return { kind: 'wrongCampaign' };
    return { kind: 'ok', chapter: s.chapter, level: s.level, playerName: s.playerName };
  } catch {
    return { kind: 'invalid' };
  }
}

function previewTitle(slot: number, p: SlotPreview): string {
  switch (p.kind) {
    case 'empty':
      return `Slot ${slot} — sem gravação`;
    case 'invalid':
      return `Slot ${slot} — gravação inválida`;
    case 'wrongCampaign':
      return `Slot ${slot} — outra campanha`;
    case 'ok':
      return `Slot ${slot} — ${p.playerName} · Cap. ${p.chapter} · Nv. ${p.level}`;
  }
}

export type SaveSlotMenuCallbacks = {
  onSave: (slot: number) => void;
  onLoad: (slot: number) => void;
};

export function buildMenuSaveSlot(
  slot: number,
  campaignId: string,
  cbs: SaveSlotMenuCallbacks
): HTMLElement {
  const preview = getSlotPreview(campaignId, slot);

  const wrap = document.createElement('div');
  wrap.className = 'menu-save-slot';
  wrap.setAttribute('role', 'group');
  wrap.setAttribute('aria-label', previewTitle(slot, preview));

  const row = document.createElement('div');
  row.className = 'menu-save-slot-row';

  const badge = document.createElement('span');
  badge.className = 'menu-save-slot-badge';
  badge.textContent = String(slot);
  badge.setAttribute('aria-hidden', 'true');

  const details = document.createElement('div');
  details.className = 'menu-save-slot-details';
  if (preview.kind === 'ok') {
    const nameEl = document.createElement('div');
    nameEl.className = 'menu-save-slot-name';
    nameEl.textContent = preview.playerName;
    const stats = document.createElement('div');
    stats.className = 'menu-save-slot-stats';
    const cap = document.createElement('span');
    cap.textContent = `Cap. ${preview.chapter}`;
    const sep = document.createElement('span');
    sep.className = 'menu-save-slot-stats-sep';
    sep.textContent = '·';
    const lv = document.createElement('span');
    lv.textContent = `Nv. ${preview.level}`;
    stats.append(cap, sep, lv);
    details.append(nameEl, stats);
  } else {
    const msg = document.createElement('div');
    msg.className = 'menu-save-slot-message';
    if (preview.kind === 'empty') {
      wrap.classList.add('menu-save-slot--empty');
      wrap.classList.remove('menu-save-slot--warn');
      msg.textContent = 'Sem gravação';
    } else {
      wrap.classList.remove('menu-save-slot--empty');
      wrap.classList.add('menu-save-slot--warn');
      msg.textContent =
        preview.kind === 'invalid' ? 'Gravação inválida' : 'Outra campanha';
    }
    details.appendChild(msg);
  }

  row.append(badge, details);
  wrap.title = previewTitle(slot, preview);

  const actions = document.createElement('div');
  actions.className = 'menu-save-slot-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'menu-item menu-save-slot-btn menu-save-slot-btn--secondary';
  saveBtn.textContent = 'Salvar';
  saveBtn.setAttribute('aria-label', `Salvar partida atual no slot ${slot}`);
  saveBtn.addEventListener('click', () => cbs.onSave(slot));

  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  const raw = readRawSlot(campaignId, slot);
  const hasSave = raw != null && raw.trim().length > 0;
  loadBtn.className = hasSave
    ? 'menu-item menu-save-slot-btn menu-save-slot-btn--primary'
    : 'menu-item menu-save-slot-btn menu-save-slot-btn--ghost';
  loadBtn.disabled = !hasSave;
  loadBtn.textContent = 'Carregar';
  loadBtn.setAttribute(
    'aria-label',
    hasSave ? `Carregar gravação do slot ${slot}` : `Slot ${slot} vazio — carregar indisponível`
  );
  loadBtn.addEventListener('click', () => {
    if (!hasSave) return;
    cbs.onLoad(slot);
  });

  actions.append(saveBtn, loadBtn);
  wrap.append(row, actions);
  return wrap;
}

export function saveStateToSlot(
  campaignId: string,
  slot: number,
  state: GameState,
  devMode: boolean
): void {
  if (slot < 1 || slot > saveSlotLimit(devMode)) return;
  try {
    localStorage.setItem(slotStorageKey(campaignId, slot), serializeState(state));
  } catch {
    /* noop */
  }
}
