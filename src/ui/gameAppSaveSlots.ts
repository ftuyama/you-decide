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

export function slotPreviewLines(campaignId: string, slot: number): { line1: string } {
  const raw = readRawSlot(campaignId, slot);
  if (!raw?.trim()) return { line1: 'Vazio' };
  try {
    const s = deserializeState(raw);
    if (s.campaignId !== campaignId) return { line1: 'Outra campanha' };
    return {
      line1: `Cap. ${s.chapter} · Nv. ${s.level} · ${s.playerName}`,
    };
  } catch {
    return { line1: 'Gravação inválida' };
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
  const wrap = document.createElement('div');
  wrap.className = 'menu-save-slot';

  const info = document.createElement('div');
  info.className = 'menu-save-slot-info';
  const titleEl = document.createElement('div');
  titleEl.className = 'menu-save-slot-title';
  titleEl.textContent = `Slot ${slot}`;
  const meta = document.createElement('div');
  meta.className = 'menu-save-slot-meta';
  const lines = slotPreviewLines(campaignId, slot);
  meta.textContent = lines.line1;
  meta.title = lines.line1;
  info.appendChild(titleEl);
  info.appendChild(meta);

  const actions = document.createElement('div');
  actions.className = 'menu-save-slot-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'menu-item menu-save-slot-btn';
  saveBtn.textContent = 'Salvar';
  saveBtn.addEventListener('click', () => cbs.onSave(slot));

  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  loadBtn.className = 'menu-item menu-save-slot-btn';
  const raw = readRawSlot(campaignId, slot);
  const hasSave = raw != null && raw.trim().length > 0;
  loadBtn.disabled = !hasSave;
  if (!hasSave) loadBtn.classList.add('menu-save-slot-btn--disabled');
  loadBtn.textContent = 'Carregar';
  loadBtn.addEventListener('click', () => {
    if (!hasSave) return;
    cbs.onLoad(slot);
  });

  actions.appendChild(saveBtn);
  actions.appendChild(loadBtn);
  wrap.appendChild(info);
  wrap.appendChild(actions);
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
