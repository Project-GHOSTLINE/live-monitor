'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FeatureFlags {
  ORCH_ENABLED: boolean;
  STATE_ENABLED: boolean;
  MAP_ENABLED: boolean;
}

interface FeatureFlagContextType {
  flags: FeatureFlags;
  isFeatureEnabled: (feature: keyof FeatureFlags) => boolean;
  toggleFeature: (feature: keyof FeatureFlags) => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export function FeatureFlagProvider({ children }: { children: ReactNode }) {
  const [flags, setFlags] = useState<FeatureFlags>({
    ORCH_ENABLED: false,
    STATE_ENABLED: false,
    MAP_ENABLED: false,
  });

  useEffect(() => {
    // Load feature flags from localStorage (client-side override)
    // In production, this would fetch from /api/admin/features or read from env
    const loadedFlags: FeatureFlags = {
      ORCH_ENABLED: getStoredFlag('ORCH_ENABLED', false),
      STATE_ENABLED: getStoredFlag('STATE_ENABLED', false),
      MAP_ENABLED: getStoredFlag('MAP_ENABLED', false),
    };

    setFlags(loadedFlags);
  }, []);

  const getStoredFlag = (key: string, defaultValue: boolean): boolean => {
    if (typeof window === 'undefined') return defaultValue;

    const stored = localStorage.getItem(`feature_${key}`);
    if (stored !== null) return stored === 'true';

    // Check if env var is available (in production, this would be server-side)
    return defaultValue;
  };

  const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
    return flags[feature];
  };

  const toggleFeature = (feature: keyof FeatureFlags) => {
    setFlags((prev) => {
      const newValue = !prev[feature];
      localStorage.setItem(`feature_${feature}`, String(newValue));
      return { ...prev, [feature]: newValue };
    });
  };

  return (
    <FeatureFlagContext.Provider value={{ flags, isFeatureEnabled, toggleFeature }}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagProvider');
  }
  return context;
}

// Hook for checking a single feature
export function useFeature(feature: keyof FeatureFlags): boolean {
  const { isFeatureEnabled } = useFeatureFlags();
  return isFeatureEnabled(feature);
}
