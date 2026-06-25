'use client';

const SETTINGS_CACHE_KEY = 'stylon_settings_cache'; // Match existing key in api.ts
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface CachedSettings {
  data: any;
  timestamp: number;
}

export const settingsCache = {
  get(): CachedSettings | null {
    if (typeof window === 'undefined') return null;

    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (!cached) return null;

      return JSON.parse(cached);
    } catch {
      return null;
    }
  },

  set(data: any): void {
    if (typeof window === 'undefined') return;

    try {
      const cached: CachedSettings = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(cached));
    } catch (err) {
      console.warn('[SettingsCache] Failed to cache settings:', err);
    }
  },

  isStale(cached: CachedSettings | null): boolean {
    if (!cached) return true;
    return Date.now() - cached.timestamp > CACHE_DURATION_MS;
  },

  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(SETTINGS_CACHE_KEY);
  },
};
