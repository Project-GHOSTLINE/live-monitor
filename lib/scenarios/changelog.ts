import { getDatabase } from '@/lib/db/client';
import { ScenarioChangelog } from '@/types/scenario';

/**
 * Get changelog entries for a scenario
 */
export async function getScenarioChangelog(scenarioId: string, limit: number = 50): Promise<ScenarioChangelog[]> {
  const db = getDatabase();

  try {
    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS scenario_changelog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id TEXT NOT NULL,
        change_type TEXT NOT NULL,
        old_value REAL,
        new_value REAL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    const entries = db
      .prepare(
        `
      SELECT * FROM scenario_changelog
      WHERE scenario_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `
      )
      .all(scenarioId, limit) as any[];

    return entries.map((entry) => ({
      scenario_id: entry.scenario_id,
      change_type: entry.change_type,
      old_value: entry.old_value,
      new_value: entry.new_value,
      reason: entry.reason,
      timestamp: entry.timestamp,
    }));
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return [];
  }
}

/**
 * Add a changelog entry
 */
export function addChangelogEntry(entry: Omit<ScenarioChangelog, 'timestamp'>): void {
  const db = getDatabase();

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS scenario_changelog (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scenario_id TEXT NOT NULL,
        change_type TEXT NOT NULL,
        old_value REAL,
        new_value REAL,
        reason TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    db.prepare(
      `
      INSERT INTO scenario_changelog (scenario_id, change_type, old_value, new_value, reason, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    ).run(entry.scenario_id, entry.change_type, entry.old_value, entry.new_value, entry.reason, Date.now());
  } catch (error) {
    console.error('Error adding changelog entry:', error);
  }
}

/**
 * Track probability changes and generate changelog
 */
export function trackProbabilityChange(
  scenarioId: string,
  oldProbability: number,
  newProbability: number,
  reason: string
): void {
  const diff = Math.abs(newProbability - oldProbability);

  // Only track significant changes (> 5%)
  if (diff > 0.05) {
    const changeType = newProbability > oldProbability ? 'probability_increase' : 'probability_decrease';

    addChangelogEntry({
      scenario_id: scenarioId,
      change_type: changeType,
      old_value: oldProbability,
      new_value: newProbability,
      reason,
    });
  }
}

/**
 * Track new signal detection
 */
export function trackNewSignal(scenarioId: string, signalId: string, signalType: string): void {
  addChangelogEntry({
    scenario_id: scenarioId,
    change_type: 'new_signal',
    reason: `Nouveau signal détecté: ${signalType} (${signalId})`,
  });
}

/**
 * Track impact changes
 */
export function trackImpactChange(scenarioId: string, domain: string, oldLevel: string, newLevel: string): void {
  if (oldLevel !== newLevel) {
    addChangelogEntry({
      scenario_id: scenarioId,
      change_type: 'impact_change',
      reason: `Impact ${domain}: ${oldLevel} → ${newLevel}`,
    });
  }
}

/**
 * Generate synthetic changelog for demo purposes
 */
export function generateDemoChangelog(scenarioId: string): ScenarioChangelog[] {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  return [
    {
      scenario_id: scenarioId,
      change_type: 'new_signal',
      reason: 'Détection de nouveaux signaux de frappe aérienne en zone frontalière',
      timestamp: now - oneHour * 2,
    },
    {
      scenario_id: scenarioId,
      change_type: 'probability_increase',
      old_value: 0.35,
      new_value: 0.42,
      reason: 'Augmentation du nombre de signaux militaires',
      timestamp: now - oneHour * 3,
    },
    {
      scenario_id: scenarioId,
      change_type: 'impact_change',
      reason: 'Impact aviation: medium → high suite à fermeture espace aérien',
      timestamp: now - oneHour * 5,
    },
    {
      scenario_id: scenarioId,
      change_type: 'new_signal',
      reason: 'Détection de mouvements de troupes significatifs',
      timestamp: now - oneHour * 8,
    },
    {
      scenario_id: scenarioId,
      change_type: 'probability_decrease',
      old_value: 0.48,
      new_value: 0.35,
      reason: 'Annonce de pourparlers diplomatiques',
      timestamp: now - oneHour * 12,
    },
  ];
}
