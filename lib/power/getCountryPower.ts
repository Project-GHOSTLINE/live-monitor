import powerData from './country_power_seed.json';

export interface CountryPower {
  name: string;
  gfp_rank: number | null;
  budget_usd_b: number | null;
  personnel_active_k: number | null;
  air: {
    fighters: number | null;
    bombers: number | null;
  };
  sea: {
    ships: number | null;
    subs: number | null;
    carriers: number | null;
  };
  land: {
    tanks: number | null;
    artillery: number | null;
  };
  sources: Array<{
    name: string;
    url: string;
  }>;
  updated_at: string;
}

const typedPowerData = powerData as Record<string, CountryPower>;

/**
 * Get country power metrics by faction/country code
 * @param countryCode - Two-letter country code (IL, IR, US, etc.)
 * @returns CountryPower object or null if not found
 */
export function getCountryPower(countryCode: string): CountryPower | null {
  return typedPowerData[countryCode.toUpperCase()] || null;
}

/**
 * Get all available country codes
 */
export function getAllCountryCodes(): string[] {
  return Object.keys(typedPowerData);
}

/**
 * Format power metrics for display
 */
export function formatPowerMetric(
  value: number | null,
  suffix: string = ''
): string {
  if (value === null) return '—';
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k${suffix}`;
  }
  return `${value}${suffix}`;
}
