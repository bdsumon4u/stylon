"use client";

import { useState, useEffect } from "react";
import { getSettings, getLocalSettings } from "@/lib/api";

export function useSettings(initialSettings?: any) {
  const [settings, setSettings] = useState<any>(initialSettings || null);

  useEffect(() => {
    // Read from client-side cache after component hydration to avoid mismatch
    const local = getLocalSettings();
    if (local) {
      setSettings(local);
    }

    getSettings()
      .then((data) => {
        if (data) {
          setSettings(data);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch settings in useSettings hook:", err);
      });
  }, []);

  return settings;
}
