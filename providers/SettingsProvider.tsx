'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { settingsCache, CachedSettings } from '@/lib/settings-cache';

interface Settings {
  logo?: any;
  site_name?: string;
  gtm_id?: string;
  pixel_ids?: string;
  contact_email?: string;
  contact_phone?: string;
  [key: string]: any;
}

interface SettingsContextValue {
  settings: Settings | null;
  isLoading: boolean;
  error: Error | null;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  isLoading: true,
  error: null,
});

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context.settings;
}

export function useSettingsContext() {
  return useContext(SettingsContext);
}

interface SettingsProviderProps {
  children: ReactNode;
  apiUrl: string;
}

export function SettingsProvider({ children, apiUrl }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings | null>(() => {
    // Initialize with cached data immediately (synchronous)
    const cached = settingsCache.get();
    return cached?.data || null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetchingRef = useRef(false);

  const fetchSettings = async (isBackground = false) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.statusText}`);
      }

      const data = await response.json();

      // Update cache
      settingsCache.set(data);

      // Update state
      setSettings(data);
      setError(null);

      if (!isBackground) {
        console.log('[Settings] Loaded from API');
      } else {
        console.log('[Settings] Background refresh completed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('[Settings] Fetch error:', error);
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    const cached = settingsCache.get();

    if (cached && !settingsCache.isStale(cached)) {
      // Cache is fresh, use it and mark as loaded
      console.log('[Settings] Loaded from cache');
      setIsLoading(false);

      // Still refresh in background
      setTimeout(() => fetchSettings(true), 1000);
    } else {
      // No cache or stale cache, fetch immediately
      console.log('[Settings] Cache miss or stale, fetching...');
      fetchSettings(false);
    }

    // Set up background refresh interval (every 5 minutes)
    const intervalId = setInterval(() => {
      console.log('[Settings] Periodic refresh triggered');
      fetchSettings(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [apiUrl]);

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error }}>
      {children}
    </SettingsContext.Provider>
  );
}
