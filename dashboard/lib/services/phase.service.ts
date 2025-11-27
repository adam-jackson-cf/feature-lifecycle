import type { JiraTicket, LifecyclePhase } from '@/lib/types';

export interface PhaseRule {
  phase: LifecyclePhase;
  patterns: string[];
}

export interface PhaseRulesConfig {
  disciplineMapping: Record<string, LifecyclePhase>;
  labelOverrides: PhaseRule[];
  default: LifecyclePhase;
  priority: ('labels' | 'discipline')[];
}

export class PhaseService {
  constructor(private rules: PhaseRulesConfig) {}

  /**
   * Derive lifecycle phase from ticket data
   * Priority order (configurable): labels > discipline > default
   * If ticket has a phase_override, that takes precedence over everything
   */
  derivePhase(ticket: JiraTicket): LifecyclePhase {
    // Manual override takes precedence
    if (ticket.phaseOverride) {
      return ticket.phaseOverride as LifecyclePhase;
    }

    const labels = this.extractLabels(ticket);

    for (const priority of this.rules.priority) {
      if (priority === 'labels') {
        const labelPhase = this.matchLabels(labels);
        if (labelPhase) return labelPhase;
      }

      if (priority === 'discipline') {
        const discipline = ticket.disciplineOverride || ticket.discipline;
        if (discipline) {
          const disciplinePhase = this.rules.disciplineMapping[discipline.toLowerCase()];
          if (disciplinePhase) return disciplinePhase;
        }
      }
    }

    return this.rules.default;
  }

  /**
   * Derive phase from raw arrays (for use without full ticket object)
   */
  deriveFromArrays(labels: string[], discipline?: string, phaseOverride?: string): LifecyclePhase {
    // Manual override takes precedence
    if (phaseOverride) {
      return phaseOverride as LifecyclePhase;
    }

    for (const priority of this.rules.priority) {
      if (priority === 'labels') {
        const labelPhase = this.matchLabels(labels.map((l) => l.toLowerCase()));
        if (labelPhase) return labelPhase;
      }

      if (priority === 'discipline' && discipline) {
        const disciplinePhase = this.rules.disciplineMapping[discipline.toLowerCase()];
        if (disciplinePhase) return disciplinePhase;
      }
    }

    return this.rules.default;
  }

  /**
   * Get the effective discipline (override or original)
   */
  getEffectiveDiscipline(ticket: JiraTicket): string | null {
    return ticket.disciplineOverride || ticket.discipline || null;
  }

  /**
   * Get the effective complexity (override or original)
   */
  getEffectiveComplexity(ticket: JiraTicket): string | null {
    return ticket.complexityOverride || ticket.complexitySize || null;
  }

  /**
   * Check if a ticket should be excluded from metrics
   */
  isExcludedFromMetrics(ticket: JiraTicket): boolean {
    return ticket.excludedFromMetrics === true;
  }

  /**
   * Extract labels from ticket's raw Jira data
   */
  private extractLabels(ticket: JiraTicket): string[] {
    const rawData = ticket.rawJiraData as {
      fields?: { labels?: string[] };
    };
    return (rawData.fields?.labels || []).map((l) => l.toLowerCase());
  }

  /**
   * Match labels against phase rules
   */
  private matchLabels(labels: string[]): LifecyclePhase | null {
    for (const rule of this.rules.labelOverrides) {
      const match = rule.patterns.some((pattern) =>
        labels.some((label) => label.includes(pattern.toLowerCase()))
      );
      if (match) return rule.phase;
    }
    return null;
  }

  /**
   * Get all available phases for display
   */
  getAvailablePhases(): LifecyclePhase[] {
    return ['discovery', 'definition', 'design', 'development', 'testing', 'deployment', 'measure'];
  }

  /**
   * Get the discipline to phase mapping
   */
  getDisciplineMapping(): Record<string, LifecyclePhase> {
    return { ...this.rules.disciplineMapping };
  }
}

// Factory function to create PhaseService from config file
export function createPhaseService(config: PhaseRulesConfig): PhaseService {
  return new PhaseService(config);
}
