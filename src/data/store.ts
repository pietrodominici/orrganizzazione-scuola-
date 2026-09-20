import { Materia, SlotOrario, Evento, Compito, NotebookLink, UserProfile } from './models';
import {
  DEFAULT_MATERIE,
  DEFAULT_ORARIO,
  DEFAULT_EVENTI,
  DEFAULT_COMPITI,
  DEFAULT_NOTEBOOKS,
  DEFAULT_USER,
} from './defaultData';

const PREFIX = 'organizza-scuola:';

export const STORAGE_KEYS = {
  MATERIE: `${PREFIX}materie`,
  ORARIO: `${PREFIX}orario`,
  EVENTI: `${PREFIX}eventi`,
  COMPITI: `${PREFIX}compiti`,
  NOTEBOOKS: `${PREFIX}notebooks`,
  USER: `${PREFIX}user`,
} as const;

export interface StorageResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type StoreListener = () => void;
const listeners = new Set<StoreListener>();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error executing store listener', e);
    }
  });
}

export function subscribeToStore(listener: StoreListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Safe local storage read with JSON parse error catching and fallback
 */
function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Store] Impossibile leggere "${key}" dal localStorage:`, err);
    return fallback;
  }
}

/**
 * Safe local storage write with quota exceeded / private mode error detection
 */
function safeSet<T>(key: string, value: T): StorageResult<T> {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    notifyListeners();
    return { success: true, data: value };
  } catch (err: unknown) {
    let message = 'Errore sconosciuto durante il salvataggio dei dati.';
    if (err instanceof DOMException) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        message = 'Spazio memoria locale esaurito. Elimina alcuni appunti o compiti per liberare spazio.';
      } else if (err.name === 'SecurityError') {
        message = 'Accesso alla memoria locale bloccato dalle impostazioni del browser (modalità privata o cookie disabilitati).';
      }
    } else if (err instanceof Error) {
      message = err.message;
    }
    console.error(`[Store] Fallimento scrittura su "${key}":`, err);
    return { success: false, error: message };
  }
}

/* ==================== MATERIE ==================== */
export function getMaterie(): Materia[] {
  return safeGet<Materia[]>(STORAGE_KEYS.MATERIE, DEFAULT_MATERIE);
}

export function saveMaterie(materie: Materia[]): StorageResult<Materia[]> {
  return safeSet(STORAGE_KEYS.MATERIE, materie);
}

/* ==================== ORARIO ==================== */
export function getOrario(): SlotOrario[] {
  return safeGet<SlotOrario[]>(STORAGE_KEYS.ORARIO, DEFAULT_ORARIO);
}

export function saveOrario(orario: SlotOrario[]): StorageResult<SlotOrario[]> {
  return safeSet(STORAGE_KEYS.ORARIO, orario);
}

/* ==================== EVENTI (VERIFICHE / INTERROGAZIONI) ==================== */
export function getEventi(): Evento[] {
  return safeGet<Evento[]>(STORAGE_KEYS.EVENTI, DEFAULT_EVENTI);
}

export function saveEventi(eventi: Evento[]): StorageResult<Evento[]> {
  return safeSet(STORAGE_KEYS.EVENTI, eventi);
}

/* ==================== COMPITI ==================== */
export function getCompiti(): Compito[] {
  return safeGet<Compito[]>(STORAGE_KEYS.COMPITI, DEFAULT_COMPITI);
}

export function saveCompiti(compiti: Compito[]): StorageResult<Compito[]> {
  return safeSet(STORAGE_KEYS.COMPITI, compiti);
}

/* ==================== NOTEBOOK ==================== */
export function getNotebooks(): NotebookLink[] {
  return safeGet<NotebookLink[]>(STORAGE_KEYS.NOTEBOOKS, DEFAULT_NOTEBOOKS);
}

export function saveNotebooks(notebooks: NotebookLink[]): StorageResult<NotebookLink[]> {
  return safeSet(STORAGE_KEYS.NOTEBOOKS, notebooks);
}

/* ==================== USER PROFILE ==================== */
export function getUserProfile(): UserProfile {
  const profile = safeGet<UserProfile>(STORAGE_KEYS.USER, DEFAULT_USER);
  if (profile.classe === '4ª B') {
    profile.classe = '4ª S';
    safeSet(STORAGE_KEYS.USER, profile);
  }
  return profile;
}

export function saveUserProfile(user: UserProfile): StorageResult<UserProfile> {
  return safeSet(STORAGE_KEYS.USER, user);
}

/* ==================== RESET / REINITIALIZE DEMO ==================== */
export function resetToDefaults(): StorageResult<boolean> {
  saveMaterie(DEFAULT_MATERIE);
  saveOrario(DEFAULT_ORARIO);
  saveEventi(DEFAULT_EVENTI);
  saveCompiti(DEFAULT_COMPITI);
  saveNotebooks(DEFAULT_NOTEBOOKS);
  saveUserProfile(DEFAULT_USER);
  return { success: true, data: true };
}

/* ==================== WIPE / CLEAR ALL DATA (COMPLETELY EMPTY) ==================== */
export function clearAllData(): StorageResult<boolean> {
  saveMaterie([]);
  saveOrario([]);
  saveEventi([]);
  saveCompiti([]);
  saveNotebooks([]);
  saveUserProfile({
    id: 'user-local',
    nome: 'Studente',
    scuola: '',
    classe: '',
    isGoogleConnected: false,
  });
  return { success: true, data: true };
}
