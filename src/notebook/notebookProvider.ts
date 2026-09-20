import { NotebookLink } from '../data/models';

/**
 * NotebookLM Integration Provider abstraction
 * As detailed in Section 4.6, Google has not released a public third-party REST/OAuth API for NotebookLM.
 * This provider encapsulates personal notebook link management and establishes an extensible interface
 * ready for when a public API becomes available.
 */
export interface NotebookApiStatus {
  hasPublicApi: boolean;
  message: string;
}

export const NOTEBOOK_LM_STATUS: NotebookApiStatus = {
  hasPublicApi: false,
  message:
    'Al momento Google non fornisce API pubbliche ufficiali di terze parti per creare o manipolare notebook NotebookLM. Puoi creare i tuoi notebook su notebooklm.google.com e salvarne qui il link per averli organizzati per materia scolastica.',
};

export const NOTEBOOK_LM_BASE_URL = 'https://notebooklm.google.com';

/**
 * Validates whether a provided string resembles a valid NotebookLM or web URL
 */
export function isValidNotebookUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes notebook URLs, prepending https if missing
 */
export function normalizeNotebookUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Opens a Notebook link safely in a new browser tab
 */
export function launchNotebook(url: string): void {
  const target = normalizeNotebookUrl(url || NOTEBOOK_LM_BASE_URL);
  window.open(target, '_blank', 'noopener,noreferrer');
}

/**
 * Google Sign-In profile session (client-side only for UI identification)
 */
export interface GoogleSession {
  isConnected: boolean;
  name?: string;
  email?: string;
  picture?: string;
}

// In-memory session store (avoid storing plain credentials in localStorage)
let currentSession: GoogleSession = {
  isConnected: false,
};

export function getGoogleSession(): GoogleSession {
  return currentSession;
}

export function setGoogleSession(session: GoogleSession): void {
  currentSession = session;
}
