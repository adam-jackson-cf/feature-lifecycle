import type { JiraIssueLite, JiraTicket } from '@/lib/types';

export type ComplexityFactors = Record<'B' | 'T' | 'S' | 'A' | 'U', number>;

export interface ComplexityConfig {
  weights: Record<'B' | 'T' | 'S' | 'A' | 'U', number>;
  thresholds: Record<'XS' | 'S' | 'M' | 'L' | 'XL', number>;
  oversize: { threshold: 'XL' | 'L' };
  clamping: { min: number; max: number };
  allowlists: {
    T: string[];
    S: string[];
  };
  bespokePatterns: string[];
}

export class ComplexityService {
  /**
   * Calculate RCS (Relative Complexity Score) from ticket data and config
   */
  calculateRCS(
    issue: JiraIssueLite | JiraTicket,
    config: ComplexityConfig
  ): {
    score: number;
    size: 'XS' | 'S' | 'M' | 'L' | 'XL';
    oversize: boolean;
    factors: ComplexityFactors;
  } {
    const text =
      `${(issue as JiraIssueLite).fields?.summary || (issue as JiraTicket).summary || ''} ${
        (issue as JiraIssueLite).fields?.description || (issue as JiraTicket).description || ''
      }`.toLowerCase();

    const ticketRaw = (issue as JiraTicket).rawJiraData as
      | { fields?: { labels?: string[]; components?: Array<{ name?: string }> } }
      | undefined;
    const labels =
      ((issue as JiraIssueLite).fields?.labels || ticketRaw?.fields?.labels || []).map(
        (l: string) => l.toLowerCase()
      ) || [];

    const components =
      ((issue as JiraIssueLite).fields?.components || ticketRaw?.fields?.components || []).map(
        (c: { name?: string }) => (c.name || '').toLowerCase()
      ) || [];

    const factors: ComplexityFactors = {
      B: this.scoreBespoke(text, config),
      T: this.scoreTechnology(labels, components, config),
      S: this.scoreSystems(text, labels, components, config),
      A: this.scoreAcceptance(text),
      U: this.scoreUserJourneys(text),
    };

    const clamped = this.clampMetrics(factors, config.clamping.min, config.clamping.max);
    const score =
      clamped.B * config.weights.B +
      clamped.T * config.weights.T +
      clamped.S * config.weights.S +
      clamped.A * config.weights.A +
      clamped.U * config.weights.U;

    const size = this.mapToSize(score, config.thresholds);
    const oversize = size === config.oversize.threshold;

    return { score, size, oversize, factors: clamped };
  }

  /**
   * Map complexity score to size bucket
   */
  private mapToSize(
    score: number,
    thresholds: Record<'XS' | 'S' | 'M' | 'L' | 'XL', number>
  ): 'XS' | 'S' | 'M' | 'L' | 'XL' {
    if (score >= thresholds.XL) return 'XL';
    if (score >= thresholds.L) return 'L';
    if (score >= thresholds.M) return 'M';
    if (score >= thresholds.S) return 'S';
    return 'XS';
  }

  private clampMetrics(metrics: ComplexityFactors, min: number, max: number): ComplexityFactors {
    return {
      B: Math.max(min, Math.min(max, metrics.B)),
      T: Math.max(min, Math.min(max, metrics.T)),
      S: Math.max(min, Math.min(max, metrics.S)),
      A: Math.max(min, Math.min(max, metrics.A)),
      U: Math.max(min, Math.min(max, metrics.U)),
    };
  }

  // Scoring helpers — deterministic regex/count based on linear estimation engine
  private scoreBespoke(text: string, config: ComplexityConfig): number {
    const patterns = config.bespokePatterns.map((p) => new RegExp(p, 'gi'));
    const hits = new Set<string>();
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        for (const m of match) {
          hits.add(m);
        }
      }
    }
    return hits.size;
  }

  private scoreTechnology(
    labels: string[],
    components: string[],
    config: ComplexityConfig
  ): number {
    const tokens = new Set<string>();
    const allow = config.allowlists.T.map((t) => t.toLowerCase());
    for (const l of labels) if (allow.some((a) => l.includes(a))) tokens.add(l);
    for (const c of components) if (allow.some((a) => c.includes(a))) tokens.add(c);
    return tokens.size;
  }

  private scoreSystems(
    text: string,
    labels: string[],
    components: string[],
    config: ComplexityConfig
  ): number {
    const allow = config.allowlists.S.map((t) => t.toLowerCase());
    const tokens = new Set<string>();
    for (const l of labels) if (allow.some((a) => l.includes(a))) tokens.add(l);
    for (const c of components) if (allow.some((a) => c.includes(a))) tokens.add(c);
    allow.forEach((a) => {
      if (text.includes(a)) tokens.add(a);
    });
    return tokens.size;
  }

  private scoreAcceptance(text: string): number {
    const matches = text.match(/given|when|then|- \[ \]|acceptance/gi);
    return matches ? matches.length : 0;
  }

  private scoreUserJourneys(text: string): number {
    const matches = text.match(/\b(user|admin|operator|customer|developer)\b/gi);
    if (!matches) return 0;
    return new Set(matches.map((m) => m.toLowerCase())).size;
  }
}
