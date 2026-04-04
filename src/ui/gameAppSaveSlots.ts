import { deserializeState, serializeState } from '../engine/state.ts';
import type { GameState } from '../engine/schema.ts';

export const SAVE_SLOT_COUNT = 3;

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
  if (slot < 1 || slot > SAVE_SLOT_COUNT) return null;
  try {
    return localStorage.getItem(slotStorageKey(campaignId, slot));
  } catch {
    return null;
  }
}

export function slotPreviewLines(
  campaignId: string,
  slot: number
): { line1: string; line2?: string } {
  const raw = readRawSlot(campaignId, slot);
  if (!raw?.trim()) return { line1: 'Vazio' };
  try {
    const s = deserializeState(raw);
    if (s.campaignId !== campaignId) return { line1: 'Outra campanha' };
    const sceneShort = s.sceneId.length > 28 ? `${s.sceneId.slice(0, 25)}…` : s.sceneId;
    return {
      line1: `Cap. ${s.chapter} · ${s.playerName}`,
      line2: sceneShort,
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
  const line1El = document.createElement('div');
  line1El.className = 'menu-save-slot-meta-line';
  line1El.textContent = lines.line1;
  meta.appendChild(line1El);
  if (lines.line2 !== undefined) {
    const line2El = document.createElement('div');
    line2El.className = 'menu-save-slot-meta-line menu-save-slot-meta-line--scene';
    line2El.textContent = lines.line2;
    meta.appendChild(line2El);
  }
  meta.title =
    lines.line2 !== undefined ? `${lines.line1}\n${lines.line2}` : lines.line1;
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

export function saveStateToSlot(campaignId: string, slot: number, state: GameState): void {
  if (slot < 1 || slot > SAVE_SLOT_COUNT) return;
  try {
    localStorage.setItem(slotStorageKey(campaignId, slot), serializeState(state));
  } catch {
    /* noop */
  }
}
