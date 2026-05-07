export type GameAppStorageKeys = {
  sidebarKey: string;
  fontKey: string;
  timedChoiceKey: string;
  sceneArtHighlightKey: string;
  devModeKey: string;
  onboardingPrimerKey: string;
  legacyBriefingKey: string;
};

export function buildGameAppStorageKeys(campaignId: string): GameAppStorageKeys {
  return {
    sidebarKey: `${campaignId}_sidebar_sections_v1`,
    fontKey: `${campaignId}_font_step_v1`,
    timedChoiceKey: `${campaignId}_timed_choice_v1`,
    sceneArtHighlightKey: `${campaignId}_scene_art_highlight_v1`,
    devModeKey: `${campaignId}_dev_mode`,
    onboardingPrimerKey: `${campaignId}_onboarding_primer_v1`,
    legacyBriefingKey: `${campaignId}_legacy_briefing_v1`,
  };
}

export function loadFontStep(fontKey: string): number {
  try {
    const raw = localStorage.getItem(fontKey);
    const n = raw != null ? parseInt(raw, 10) : 0;
    if (n === 1 || n === 2) return n;
    return 0;
  } catch {
    return 0;
  }
}

export function saveFontStep(fontKey: string, fontStep: number): void {
  try {
    localStorage.setItem(fontKey, String(fontStep));
  } catch {
    /* noop */
  }
}

export function loadDevMode(devModeKey: string): boolean {
  try {
    return localStorage.getItem(devModeKey) === '1';
  } catch {
    return false;
  }
}

export function saveDevMode(devModeKey: string, enabled: boolean): void {
  try {
    localStorage.setItem(devModeKey, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function loadTimedChoiceMode(timedChoiceKey: string): boolean {
  try {
    return localStorage.getItem(timedChoiceKey) === '1';
  } catch {
    return false;
  }
}

export function saveTimedChoiceMode(timedChoiceKey: string, enabled: boolean): void {
  try {
    localStorage.setItem(timedChoiceKey, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function loadSceneArtHighlightEnabled(sceneArtHighlightKey: string): boolean {
  try {
    return localStorage.getItem(sceneArtHighlightKey) !== '0';
  } catch {
    return true;
  }
}

export function saveSceneArtHighlightEnabled(sceneArtHighlightKey: string, enabled: boolean): void {
  try {
    localStorage.setItem(sceneArtHighlightKey, enabled ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function loadOnboardingPrimerVisible(onboardingPrimerKey: string): boolean {
  try {
    return localStorage.getItem(onboardingPrimerKey) !== '0';
  } catch {
    return true;
  }
}

export function saveOnboardingPrimerVisible(onboardingPrimerKey: string, visible: boolean): void {
  try {
    localStorage.setItem(onboardingPrimerKey, visible ? '1' : '0');
  } catch {
    /* noop */
  }
}

export function loadSidebarSections(sidebarKey: string): Record<string, boolean> {
  const defaults: Record<string, boolean> = { recursos: true };
  try {
    const raw = sessionStorage.getItem(sidebarKey);
    if (!raw) return { ...defaults };
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== 'object' || o === null) return { ...defaults };
    return { ...defaults, ...(o as Record<string, boolean>) };
  } catch {
    return { ...defaults };
  }
}

export function saveSidebarSections(sidebarKey: string, sections: Record<string, boolean>): void {
  try {
    sessionStorage.setItem(sidebarKey, JSON.stringify(sections));
  } catch {
    /* noop */
  }
}
