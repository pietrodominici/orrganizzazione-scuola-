import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Materia,
  SlotOrario,
  Evento,
  Compito,
  NotebookLink,
  UserProfile,
  GiornoSettimana,
} from './models';
import * as store from './store';
import {
  normalizeNomeMateria,
  getFirstAvailableColor,
  isColorInUse,
  findSubjectByColor,
} from '../orario/subjectColors';

interface SchoolStoreContextType {
  materie: Materia[];
  orario: SlotOrario[];
  eventi: Evento[];
  compiti: Compito[];
  notebooks: NotebookLink[];
  user: UserProfile;
  lastError: string | null;
  clearError: () => void;
  // Subject methods
  getMateriaById: (id: string | null | undefined) => Materia | undefined;
  getOrCreateMateria: (nome: string) => { materia: Materia; isNew: boolean; error?: string };
  updateMateria: (id: string, newNome: string, newColore: string) => { success: boolean; error?: string };
  deleteMateria: (id: string) => { success: boolean; error?: string };
  // Timetable methods
  setSlot: (giorno: GiornoSettimana, ora: string, materiaId: string | null) => void;
  bulkSetOrario: (newSlots: SlotOrario[], mode: 'replace' | 'merge') => void;
  clearOrario: () => void;
  // Events methods
  addEvento: (evento: Omit<Evento, 'id'>) => Evento;
  updateEvento: (evento: Evento) => void;
  deleteEvento: (id: string) => void;
  // Tasks methods
  addCompito: (compito: Omit<Compito, 'id'>) => Compito;
  toggleCompito: (id: string) => void;
  updateCompito: (compito: Compito) => void;
  deleteCompito: (id: string) => void;
  // Notebook methods
  addNotebook: (nb: Omit<NotebookLink, 'id' | 'creatoIl'>) => NotebookLink;
  updateNotebook: (nb: NotebookLink) => void;
  deleteNotebook: (id: string) => void;
  // User profile
  updateUser: (user: Partial<UserProfile>) => void;
  // Reset demo & Clear all
  resetAllData: () => void;
  clearAllData: () => void;
}

const SchoolStoreContext = createContext<SchoolStoreContextType | null>(null);

export const SchoolStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [materie, setMaterieState] = useState<Materia[]>(store.getMaterie);
  const [orario, setOrarioState] = useState<SlotOrario[]>(store.getOrario);
  const [eventi, setEventiState] = useState<Evento[]>(store.getEventi);
  const [compiti, setCompitiState] = useState<Compito[]>(store.getCompiti);
  const [notebooks, setNotebooksState] = useState<NotebookLink[]>(store.getNotebooks);
  const [user, setUserState] = useState<UserProfile>(store.getUserProfile);
  const [lastError, setLastError] = useState<string | null>(null);

  // Sync with store updates
  const refreshFromStore = useCallback(() => {
    setMaterieState(store.getMaterie());
    setOrarioState(store.getOrario());
    setEventiState(store.getEventi());
    setCompitiState(store.getCompiti());
    setNotebooksState(store.getNotebooks());
    setUserState(store.getUserProfile());
  }, []);

  useEffect(() => {
    const unsubscribe = store.subscribeToStore(refreshFromStore);
    return unsubscribe;
  }, [refreshFromStore]);

  const clearError = useCallback(() => setLastError(null), []);

  const handleResult = useCallback(<T,>(res: store.StorageResult<T>) => {
    if (!res.success && res.error) {
      setLastError(res.error);
    }
  }, []);

  /* Subject helper */
  const getMateriaById = useCallback((id: string | null | undefined): Materia | undefined => {
    if (!id) return undefined;
    return materie.find(m => m.id === id);
  }, [materie]);

  /**
   * Automatic color rule:
   * 1. If subject name already exists (case-insensitive, trimmed), reuses existing materia and its color.
   * 2. If subject is new, assigns first available color from palette.
   */
  const getOrCreateMateria = useCallback((rawNome: string): { materia: Materia; isNew: boolean; error?: string } => {
    const trimmed = rawNome.trim();
    if (!trimmed) {
      throw new Error('Il nome della materia non può essere vuoto.');
    }
    const normalized = normalizeNomeMateria(trimmed);

    // Search existing
    const existing = materie.find(m => normalizeNomeMateria(m.nome) === normalized);
    if (existing) {
      return { materia: existing, isNew: false };
    }

    // Allocate new color
    const newColor = getFirstAvailableColor(materie);
    const newMateria: Materia = {
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nome: trimmed,
      colore: newColor,
    };

    const nextMaterie = [...materie, newMateria];
    setMaterieState(nextMaterie);
    handleResult(store.saveMaterie(nextMaterie));

    return { materia: newMateria, isNew: true };
  }, [materie, handleResult]);

  /**
   * Update subject with uniqueness enforcement:
   * Two different subjects CANNOT have the same color.
   */
  const updateMateria = useCallback((id: string, newNome: string, newColore: string): { success: boolean; error?: string } => {
    const trimmed = newNome.trim();
    if (!trimmed) {
      return { success: false, error: 'Il nome della materia non può essere vuoto.' };
    }

    // Uniqueness validation on color
    const conflict = findSubjectByColor(newColore, materie, id);
    if (conflict) {
      const suggestedColor = getFirstAvailableColor(materie, id);
      return {
        success: false,
        error: `Questo colore è già assegnato a "${conflict.nome}". Scegli un altro colore (ad esempio ${suggestedColor}).`,
      };
    }

    const next = materie.map(m => (m.id === id ? { ...m, nome: trimmed, colore: newColore } : m));
    setMaterieState(next);
    handleResult(store.saveMaterie(next));
    return { success: true };
  }, [materie, handleResult]);

  const deleteMateria = useCallback((id: string): { success: boolean; error?: string } => {
    // Check if materia is used in timetable
    const usedInOrario = orario.filter(s => s.materiaId === id).length;
    if (usedInOrario > 0) {
      // Clear slots where this subject is used
      const nextOrario = orario.filter(s => s.materiaId !== id);
      setOrarioState(nextOrario);
      store.saveOrario(nextOrario);
    }

    const nextMaterie = materie.filter(m => m.id !== id);
    setMaterieState(nextMaterie);
    handleResult(store.saveMaterie(nextMaterie));
    return { success: true };
  }, [materie, orario, handleResult]);

  /* Timetable Slot Editor */
  const setSlot = useCallback((giorno: GiornoSettimana, ora: string, materiaId: string | null) => {
    let nextOrario: SlotOrario[];
    const existingIndex = orario.findIndex(s => s.giorno === giorno && s.ora === ora);

    if (!materiaId) {
      // Remove slot
      nextOrario = orario.filter(s => !(s.giorno === giorno && s.ora === ora));
    } else if (existingIndex >= 0) {
      // Update existing slot
      nextOrario = orario.map((s, idx) => (idx === existingIndex ? { ...s, materiaId } : s));
    } else {
      // Add new slot
      const newSlot: SlotOrario = {
        id: `slot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        giorno,
        ora,
        materiaId,
      };
      nextOrario = [...orario, newSlot];
    }

    setOrarioState(nextOrario);
    handleResult(store.saveOrario(nextOrario));
  }, [orario, handleResult]);

  const bulkSetOrario = useCallback((newSlots: SlotOrario[], mode: 'replace' | 'merge') => {
    let combined: SlotOrario[];
    if (mode === 'replace') {
      combined = newSlots;
    } else {
      // Merge: new slots overwrite existing slot for same day and hour
      const map = new Map<string, SlotOrario>();
      orario.forEach(s => map.set(`${s.giorno}-${s.ora}`, s));
      newSlots.forEach(s => map.set(`${s.giorno}-${s.ora}`, s));
      combined = Array.from(map.values());
    }
    setOrarioState(combined);
    handleResult(store.saveOrario(combined));
  }, [orario, handleResult]);

  const clearOrario = useCallback(() => {
    setOrarioState([]);
    handleResult(store.saveOrario([]));
  }, [handleResult]);

  /* Eventi */
  const addEvento = useCallback((data: Omit<Evento, 'id'>): Evento => {
    const item: Evento = {
      ...data,
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const next = [...eventi, item];
    setEventiState(next);
    handleResult(store.saveEventi(next));
    return item;
  }, [eventi, handleResult]);

  const updateEvento = useCallback((item: Evento) => {
    const next = eventi.map(e => (e.id === item.id ? item : e));
    setEventiState(next);
    handleResult(store.saveEventi(next));
  }, [eventi, handleResult]);

  const deleteEvento = useCallback((id: string) => {
    const next = eventi.filter(e => e.id !== id);
    setEventiState(next);
    handleResult(store.saveEventi(next));
  }, [eventi, handleResult]);

  /* Compiti */
  const addCompito = useCallback((data: Omit<Compito, 'id'>): Compito => {
    const item: Compito = {
      ...data,
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    const next = [...compiti, item];
    setCompitiState(next);
    handleResult(store.saveCompiti(next));
    return item;
  }, [compiti, handleResult]);

  const toggleCompito = useCallback((id: string) => {
    const next = compiti.map(c => (c.id === id ? { ...c, fatto: !c.fatto } : c));
    setCompitiState(next);
    handleResult(store.saveCompiti(next));
  }, [compiti, handleResult]);

  const updateCompito = useCallback((item: Compito) => {
    const next = compiti.map(c => (c.id === item.id ? item : c));
    setCompitiState(next);
    handleResult(store.saveCompiti(next));
  }, [compiti, handleResult]);

  const deleteCompito = useCallback((id: string) => {
    const next = compiti.filter(c => c.id !== id);
    setCompitiState(next);
    handleResult(store.saveCompiti(next));
  }, [compiti, handleResult]);

  /* Notebook */
  const addNotebook = useCallback((data: Omit<NotebookLink, 'id' | 'creatoIl'>): NotebookLink => {
    const item: NotebookLink = {
      ...data,
      id: `nb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      creatoIl: new Date().toISOString().split('T')[0],
    };
    const next = [item, ...notebooks];
    setNotebooksState(next);
    handleResult(store.saveNotebooks(next));
    return item;
  }, [notebooks, handleResult]);

  const updateNotebook = useCallback((item: NotebookLink) => {
    const next = notebooks.map(n => (n.id === item.id ? item : n));
    setNotebooksState(next);
    handleResult(store.saveNotebooks(next));
  }, [notebooks, handleResult]);

  const deleteNotebook = useCallback((id: string) => {
    const next = notebooks.filter(n => n.id !== id);
    setNotebooksState(next);
    handleResult(store.saveNotebooks(next));
  }, [notebooks, handleResult]);

  /* User */
  const updateUser = useCallback((updated: Partial<UserProfile>) => {
    const next = { ...user, ...updated };
    setUserState(next);
    handleResult(store.saveUserProfile(next));
  }, [user, handleResult]);

  /* Reset Demo */
  const resetAllData = useCallback(() => {
    store.resetToDefaults();
    refreshFromStore();
  }, [refreshFromStore]);

  /* Wipe / Clear All Data completely */
  const clearAllData = useCallback(() => {
    store.clearAllData();
    refreshFromStore();
  }, [refreshFromStore]);

  const value = useMemo(() => ({
    materie,
    orario,
    eventi,
    compiti,
    notebooks,
    user,
    lastError,
    clearError,
    getMateriaById,
    getOrCreateMateria,
    updateMateria,
    deleteMateria,
    setSlot,
    bulkSetOrario,
    clearOrario,
    addEvento,
    updateEvento,
    deleteEvento,
    addCompito,
    toggleCompito,
    updateCompito,
    deleteCompito,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    updateUser,
    resetAllData,
    clearAllData,
  }), [
    materie,
    orario,
    eventi,
    compiti,
    notebooks,
    user,
    lastError,
    clearError,
    getMateriaById,
    getOrCreateMateria,
    updateMateria,
    deleteMateria,
    setSlot,
    bulkSetOrario,
    clearOrario,
    addEvento,
    updateEvento,
    deleteEvento,
    addCompito,
    toggleCompito,
    updateCompito,
    deleteCompito,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    updateUser,
    resetAllData,
    clearAllData,
  ]);

  return <SchoolStoreContext.Provider value={value}>{children}</SchoolStoreContext.Provider>;
};

export function useSchoolStore(): SchoolStoreContextType {
  const context = useContext(SchoolStoreContext);
  if (!context) {
    throw new Error('useSchoolStore deve essere usato all\'interno di un SchoolStoreProvider');
  }
  return context;
}
