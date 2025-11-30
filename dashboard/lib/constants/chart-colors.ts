// Premium Fintech Chart Palette
// Vibrant yet professional colors optimized for data visualization

export const CHART_COLORS = [
  '#0d9488', // Teal (primary)
  '#6366f1', // Indigo (accent)
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// Extended palette for larger datasets
export const CHART_COLORS_EXTENDED = [
  ...CHART_COLORS,
  '#ef4444', // Red
  '#14b8a6', // Light teal
  '#a855f7', // Purple
  '#f97316', // Orange
  '#22c55e', // Green
];

// Gradient definitions for premium chart segments
export const CHART_GRADIENTS = {
  teal: ['#0d9488', '#14b8a6'],
  indigo: ['#6366f1', '#818cf8'],
  amber: ['#f59e0b', '#fbbf24'],
  pink: ['#ec4899', '#f472b6'],
  violet: ['#8b5cf6', '#a78bfa'],
  cyan: ['#06b6d4', '#22d3ee'],
  lime: ['#84cc16', '#a3e635'],
};

// Status-specific colors
export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  neutral: '#64748b',
};

// Phase colors mapped to chart indices
export const PHASE_COLOR_MAP: Record<string, string> = {
  discovery: CHART_COLORS[0],
  definition: CHART_COLORS[1],
  design: CHART_COLORS[2],
  development: CHART_COLORS[3],
  testing: CHART_COLORS[4],
  deployment: CHART_COLORS[5],
  measure: CHART_COLORS[6],
  unknown: '#94a3b8',
};
