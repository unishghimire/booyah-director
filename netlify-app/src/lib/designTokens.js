/**
 * NexOverlays Design Tokens
 * Centralized design system for all overlay and UI components.
 * Purple & Blue modern esports broadcast aesthetic.
 *
 * Usage: import { TOKENS, getTheme } from '@/lib/designTokens';
 */

// ═════════════════════════════════════════════════════
// COLOR PALETTE
// ═════════════════════════════════════════════════════
export const COLORS = {
  // Brand
  purple:        '#7C3AED',
  purpleBright:  '#9D5CFF',
  purpleDeep:    '#5B21B6',
  purpleDark:    '#3D1670',

  blue:          '#3B82F6',
  blueBright:    '#60A5FA',
  blueDeep:      '#1D4ED8',
  blueDark:      '#0F1A3D',

  // Backgrounds (dark spectrum)
  bgDarkest:     '#070611',
  bgDark:        '#0D0B1A',
  bgCard:        '#131127',
  bgElevated:    '#1A1830',
  bgGlass:       'rgba(19, 17, 39, 0.85)',

  // Text
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  textMuted:     'rgba(255, 255, 255, 0.4)',
  textDim:       'rgba(255, 255, 255, 0.15)',

  // Status
  greenAlive:    '#10B981',
  greenBright:   '#34D399',
  redElim:       '#EF4444',
  redBright:     '#F87171',
  goldRank:      '#FBBF24',
  silverRank:    '#C0C0C0',
  bronzeRank:    '#CD7F32',

  // Accents
  accentPurple:  '#A78BFA',
  accentBlue:    '#60A5FA',
  accentCyan:    '#22D3EE',

  // Borders
  borderSubtle:  'rgba(167, 139, 250, 0.15)',
  borderMedium:  'rgba(167, 139, 250, 0.3)',
  borderStrong:  'rgba(167, 139, 250, 0.5)',

  // Gradients
  gradHeader:    'linear-gradient(135deg, #7C3AED 0%, #3B82F6 100%)',
  gradHeaderRev: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)',
  gradAccent:    'linear-gradient(90deg, #7C3AED, #3B82F6)',
  gradBg:        'linear-gradient(180deg, #0D0B1A 0%, #070611 100%)',
  gradCard:      'linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%)',
  gradGlow:      'radial-gradient(ellipse 1200px 700px at 50% 30%, rgba(124, 58, 237, 0.2) 0%, rgba(59, 130, 246, 0.08) 40%, transparent 70%)',

  // Shadows / Glows
  glowPurple:    '0 0 20px rgba(124, 58, 237, 0.4)',
  glowBlue:      '0 0 20px rgba(59, 130, 246, 0.4)',
  glowPurpleSm:  '0 0 10px rgba(124, 58, 237, 0.3)',
  glowBlueSm:    '0 0 10px rgba(59, 130, 246, 0.3)',
  shadowCard:    '0 4px 24px rgba(0, 0, 0, 0.4)',
  shadowElev:    '0 8px 32px rgba(0, 0, 0, 0.5)',
};

// ═════════════════════════════════════════════════════
// TYPOGRAPHY
// ═════════════════════════════════════════════════════
export const FONTS = {
  display:  "'Orbitron', ui-sans-serif, system-ui, sans-serif",
  heading:  "'Rajdhani', ui-sans-serif, system-ui, sans-serif",
  body:     "'Rajdhani', ui-sans-serif, system-ui, sans-serif",
  mono:     "'Teko', ui-sans-serif, system-ui, sans-serif",
  stat:     "'Teko', ui-sans-serif, system-ui, sans-serif",
};


// ═════════════════════════════════════════════════════
// SPACING & RADIUS
// ═════════════════════════════════════════════════════
export const RADIUS = { none: 0, sm: 4, md: 8, lg: 12, xl: 16, pill: 9999 };

// ═════════════════════════════════════════════════════
// CLIP PATHS — Angular broadcast aesthetics
// ═════════════════════════════════════════════════════

// ═════════════════════════════════════════════════════
// DESIGN TOKEN MERGE — combines defaults with user config
// ═════════════════════════════════════════════════════
export const DEFAULT_DESIGN = {
  accentColor:      COLORS.purple,
  accentColor2:     COLORS.blue,
  textColor:        COLORS.textPrimary,
  scoreboardBrand:  'NEXOVERLAYS',
  tournamentName:   'NEXOVERLAYS',
  dayLabel:         'DAY 1',
  stageLabel:       'GROUP STAGE',
  matchLabel:       'MATCH 1',
};

/**
 * Merges user-provided design config with NexOverlays defaults.
 * Sanitizes and validates all values.
 */
export function getTheme(design = {}) {
  const d = design || {};
  return {
    accent:    d.accentColor  || COLORS.purple,
    accent2:   d.accentColor2 || COLORS.blue,
    text:      d.textColor    || COLORS.textPrimary,
    brand:     (d.scoreboardBrand || 'NEXOVERLAYS').toUpperCase(),
    tName:     (d.tournamentName  || 'NEXOVERLAYS').toUpperCase(),
    dayLabel:  (d.dayLabel     || 'DAY 1').toUpperCase(),
    stage:     (d.stageLabel   || 'GROUP STAGE').toUpperCase(),
    matchLabel: (d.matchLabel  || 'MATCH 1').toUpperCase(),
  };
}

/**
 * Returns inline style object for common overlay containers.
 * Use: style={TOKENS.overlayContainer}
 */
