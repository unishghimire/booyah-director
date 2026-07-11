/**
 * Simple PIN-based access control for Director and Data Inputer panels.
 * PINs are stored in localStorage. Default PINs can be changed via the Director settings.
 */

const STORAGE_KEY = 'booyah_pins';
const SESSION_KEY = 'booyah_session';

const DEFAULT_PINS = {
  director: '1234',
  inputer: '5678',
};

export function getPins() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PINS, ...JSON.parse(stored) } : { ...DEFAULT_PINS };
  } catch {
    return { ...DEFAULT_PINS };
  }
}

export function setPins(pins) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
}

export function getSession() {
  try {
    const s = sessionStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function setSession(role) {
  const s = getSession();
  s[role] = true;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(role) {
  const s = getSession();
  delete s[role];
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function isAuthorized(role) {
  return getSession()[role] === true;
}

export function checkPin(role, pin) {
  const pins = getPins();
  return pins[role] === pin;
}
