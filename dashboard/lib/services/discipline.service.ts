import type { JiraTicket } from '@/lib/types';

export interface DisciplineRule {
  discipline: string;
  patterns: {
    labels?: string[];
    components?: string[];
    repoPaths?: string[];
  };
}

export interface DisciplineRulesConfig {
  rules: DisciplineRule[];
  default: string;
  priority: string[];
}

export class DisciplineService {
  deriveFromArrays(labels: string[], components: string[], rules: DisciplineRulesConfig): string {
    const normalizedLabels = labels.map((l) => l.toLowerCase());
    const normalizedComponents = components.map((c) => c.toLowerCase());

    for (const priority of rules.priority) {
      for (const rule of rules.rules) {
        const patterns = rule.patterns[priority as keyof DisciplineRule['patterns']];
        if (!patterns) continue;
        if (this.matchPatterns(priority, patterns, normalizedLabels, normalizedComponents)) {
          return rule.discipline;
        }
      }
    }

    const fallback = this.fallbackHeuristics(normalizedLabels, normalizedComponents);
    return fallback || rules.default;
  }

  /**
   * Derive discipline from ticket data using rules
   */
  deriveDiscipline(ticket: JiraTicket, rules: DisciplineRulesConfig, repoPath?: string): string {
    // Extract labels and components from raw Jira data
    const rawData = ticket.rawJiraData as {
      fields?: {
        labels?: string[];
        components?: Array<{ name?: string }>;
      };
    };

    const labels = rawData.fields?.labels?.map((l) => l.toLowerCase()) || [];
    const components = rawData.fields?.components?.map((c) => c.name?.toLowerCase() || '') || [];

    // Match against rules in priority order
    for (const priority of rules.priority) {
      for (const rule of rules.rules) {
        const patterns = rule.patterns[priority as keyof DisciplineRule['patterns']];
        if (!patterns) continue;

        if (this.matchPatterns(priority, patterns, labels, components, repoPath)) {
          return rule.discipline;
        }
      }
    }

    const fallback = this.fallbackHeuristics(labels, components, repoPath);
    if (fallback) return fallback;

    return rules.default;
  }

  /**
   * Match patterns against ticket data
   */
  matchRules(
    labels: string[],
    components: string[],
    repoPath: string | undefined,
    rules: DisciplineRulesConfig
  ): string | null {
    for (const rule of rules.rules) {
      if (rule.patterns.labels) {
        const labelMatch = rule.patterns.labels.some((pattern) =>
          labels.some((label) => label.includes(pattern.toLowerCase()))
        );
        if (labelMatch) return rule.discipline;
      }

      if (rule.patterns.components) {
        const componentMatch = rule.patterns.components.some((pattern) =>
          components.some((comp) => comp.includes(pattern.toLowerCase()))
        );
        if (componentMatch) return rule.discipline;
      }

      if (rule.patterns.repoPaths && repoPath) {
        const repoMatch = rule.patterns.repoPaths.some((pattern) => {
          // Simple glob matching
          const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
          return regex.test(repoPath);
        });
        if (repoMatch) return rule.discipline;
      }
    }

    return null;
  }

  private matchPatterns(
    type: string,
    patterns: string[],
    labels: string[],
    components: string[],
    repoPath?: string
  ): boolean {
    if (type === 'labels') {
      return patterns.some((pattern) =>
        labels.some((label) => label.includes(pattern.toLowerCase()))
      );
    }

    if (type === 'components') {
      return patterns.some((pattern) =>
        components.some((comp) => comp.includes(pattern.toLowerCase()))
      );
    }

    if (type === 'repoPaths' && repoPath) {
      return patterns.some((pattern) => {
        const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
        return regex.test(repoPath);
      });
    }

    return false;
  }

  private fallbackHeuristics(
    labels: string[],
    components: string[],
    repoPath?: string
  ): string | null {
    const haystack = [...labels, ...components].join(' ');
    if (/frontend|ui|web/i.test(haystack)) return 'frontend';
    if (
      /android|ios|mobile/i.test(haystack) ||
      (repoPath && /mobile|android|ios/i.test(repoPath))
    ) {
      return 'mobile';
    }
    if (
      /api|backend|server|service/i.test(haystack) ||
      (repoPath && /api|server/i.test(repoPath))
    ) {
      return 'backend';
    }
    return null;
  }
}
