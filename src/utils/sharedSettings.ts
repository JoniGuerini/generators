const SETTINGS_KEY = "idle-settings";

export interface SharedSettings {
  showFPS: boolean;
  sfxEnabled: boolean;
  sfxVolume: number;
  locale: string;
}

const DEFAULTS: SharedSettings = {
  showFPS: false,
  sfxEnabled: true,
  sfxVolume: 50,
  locale: "pt-BR",
};

export function loadSharedSettings(): SharedSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      showFPS: Boolean(parsed.showFPS ?? DEFAULTS.showFPS),
      sfxEnabled:
        parsed.sfxEnabled !== undefined
          ? Boolean(parsed.sfxEnabled)
          : DEFAULTS.sfxEnabled,
      sfxVolume:
        typeof parsed.sfxVolume === "number"
          ? parsed.sfxVolume
          : DEFAULTS.sfxVolume,
      locale:
        typeof parsed.locale === "string" ? parsed.locale : DEFAULTS.locale,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSharedSettings(
  options: Partial<SharedSettings>,
) {
  try {
    const current = loadSharedSettings();
    const merged = { ...current, ...options };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  } catch {
    /* noop */
  }
}
