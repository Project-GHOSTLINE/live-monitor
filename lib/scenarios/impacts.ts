import { ImpactMatrix, Signal } from '@/types/scenario';

/**
 * Calculate impact matrix for a scenario based on active signals
 */
export async function getImpactMatrix(scenarioId: string, signals: Signal[]): Promise<ImpactMatrix> {
  const impacts = [
    analyzeAviationImpact(signals),
    analyzeEnergyImpact(signals),
    analyzeCyberImpact(signals),
    analyzeHumanitarianImpact(signals),
    analyzeSupplyChainImpact(signals),
    analyzeFinancialImpact(signals),
    analyzeSecurityImpact(signals),
  ];

  // Determine overall severity
  const severityLevels = impacts.map((i) => i.level);
  const overallSeverity = determineOverallSeverity(severityLevels);

  return {
    scenario_id: scenarioId,
    impacts,
    overall_severity: overallSeverity,
    last_updated: Date.now(),
  };
}

function analyzeAviationImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) => s.event_type === 'strike' || s.event_type === 'border_closure' || s.event_type === 'infrastructure_damage'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Impact limité sur l\'aviation commerciale.';

  if (relevantSignals.length > 5) {
    level = 'high';
    reasoning = 'Perturbations majeures attendues dans l\'espace aérien régional avec fermetures possibles.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Modifications de routes aériennes et retards probables.';
  }

  return {
    domain: 'aviation' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeEnergyImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) =>
      s.event_type === 'infrastructure_damage' ||
      s.event_type === 'economic_disruption' ||
      s.event_type === 'sanction'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Approvisionnements énergétiques stables.';

  if (relevantSignals.length > 4) {
    level = 'high';
    reasoning = 'Risque élevé de disruption des approvisionnements pétroliers et gaziers.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Volatilité des prix de l\'énergie attendue.';
  }

  return {
    domain: 'energy' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeCyberImpact(signals: Signal[]) {
  const relevantSignals = signals.filter((s) => s.event_type === 'cyber_attack');

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Menace cyber limitée aux acteurs de la zone de conflit.';

  if (relevantSignals.length > 3) {
    level = 'high';
    reasoning = 'Cyberattaques majeures en cours visant infrastructures critiques.';
  } else if (relevantSignals.length > 1) {
    level = 'medium';
    reasoning = 'Activité cyber accrue avec risque de débordement.';
  }

  return {
    domain: 'cyber' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeHumanitarianImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) =>
      s.event_type === 'civilian_casualties' ||
      s.event_type === 'aid_blockage' ||
      s.event_type === 'infrastructure_damage'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Situation humanitaire difficile mais stable.';

  if (relevantSignals.length > 5) {
    level = 'high';
    reasoning = 'Crise humanitaire majeure avec accès aux soins et aide bloqués.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Détérioration de la situation humanitaire avec déplacements de population.';
  }

  return {
    domain: 'humanitarian' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeSupplyChainImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) =>
      s.event_type === 'border_closure' ||
      s.event_type === 'economic_disruption' ||
      s.event_type === 'infrastructure_damage'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Chaînes logistiques fonctionnelles avec délais mineurs.';

  if (relevantSignals.length > 4) {
    level = 'high';
    reasoning = 'Ruptures majeures des chaînes d\'approvisionnement régionales.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Retards et coûts accrus dans les transports internationaux.';
  }

  return {
    domain: 'supply_chain' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeFinancialImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) => s.event_type === 'sanction' || s.event_type === 'economic_disruption' || s.event_type === 'policy_change'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Marchés financiers résilients avec volatilité normale.';

  if (relevantSignals.length > 4) {
    level = 'high';
    reasoning = 'Turbulences financières majeures avec risque systémique.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Volatilité accrue sur les marchés avec ajustements de portefeuille.';
  }

  return {
    domain: 'financial' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function analyzeSecurityImpact(signals: Signal[]) {
  const relevantSignals = signals.filter(
    (s) => s.event_type === 'strike' || s.event_type === 'troop_movement' || s.event_type === 'border_closure'
  );

  let level: 'low' | 'medium' | 'high' = 'low';
  let reasoning = 'Niveau de sécurité normal, pas de menace immédiate.';

  if (relevantSignals.length > 5) {
    level = 'high';
    reasoning = 'Menace sécuritaire élevée nécessitant mesures de protection accrues.';
  } else if (relevantSignals.length > 2) {
    level = 'medium';
    reasoning = 'Vigilance accrue recommandée avec restrictions de déplacement possibles.';
  }

  return {
    domain: 'security' as const,
    level,
    reasoning,
    supporting_signals: relevantSignals.map((s) => s.signal_id),
    source_links: relevantSignals.flatMap((s) => s.feed_item_ids),
  };
}

function determineOverallSeverity(levels: Array<'low' | 'medium' | 'high'>): 'low' | 'medium' | 'high' | 'critical' {
  const highCount = levels.filter((l) => l === 'high').length;
  const mediumCount = levels.filter((l) => l === 'medium').length;

  if (highCount >= 4) return 'critical';
  if (highCount >= 2) return 'high';
  if (mediumCount >= 3) return 'medium';
  return 'low';
}
