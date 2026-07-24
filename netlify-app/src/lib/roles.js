/**
 * Role definitions for NexOverlays Director.
 * Each role defines which tabs are visible and what actions are allowed.
 */

export const ROLES = {
  admin: {
    label: 'Production Admin',
    description: 'Full access — setup, control, design, and configuration',
    color: '#7C3AED',
    tabs: ['dashboard', 'live', 'overlay', 'match', 'standings', 'players', 'design', 'theme', 'assets', 'sound', 'animations', 'ocr', 'timeline', 'setup'],
    canEdit: true,
    canDelete: true,
    canCreateTournament: true,
    canSwitchTournament: true,
  },
  operator: {
    label: 'Graphics Operator',
    description: 'Live graphics control — overlays, events, design, sound',
    color: '#3B82F6',
    tabs: ['dashboard', 'live', 'overlay', 'design', 'theme', 'assets', 'sound', 'animations'],
    canEdit: true,
    canDelete: false,
    canCreateTournament: false,
    canSwitchTournament: true,
  },
  observer: {
    label: 'Observer',
    description: 'Read-only — view dashboard, standings, and timeline',
    color: '#64748b',
    tabs: ['dashboard', 'standings', 'timeline'],
    canEdit: false,
    canDelete: false,
    canCreateTournament: false,
    canSwitchTournament: false,
  },
  referee: {
    label: 'Referee',
    description: 'Match management — teams, players, kills, placements',
    color: '#22c55e',
    tabs: ['dashboard', 'match', 'standings', 'players'],
    canEdit: true,
    canDelete: false,
    canCreateTournament: false,
    canSwitchTournament: true,
  },
  producer: {
    label: 'Stream Producer',
    description: 'Scene switching and broadcast flow control',
    color: '#eab308',
    tabs: ['dashboard', 'overlay', 'timeline', 'setup'],
    canEdit: false,
    canDelete: false,
    canCreateTournament: false,
    canSwitchTournament: true,
  },
};

export const DEFAULT_ROLE = 'admin';

/**
 * Get the role config for a user. Admins (owner emails) always get admin role.
 */
export function getRoleConfig(roleName, isOwner = false) {
  if (isOwner) return ROLES.admin;
  return ROLES[roleName] || ROLES.admin; // default to admin for backward compat
}

/**
 * Check if a role can access a specific tab.
 */
export function canAccessTab(roleName, tabId, isOwner = false) {
  const config = getRoleConfig(roleName, isOwner);
  return config.tabs.includes(tabId);
}

/**
 * Check if a role can perform a specific action.
 */
export function canPerform(roleName, action, isOwner = false) {
  const config = getRoleConfig(roleName, isOwner);
  return config[action] === true;
}
