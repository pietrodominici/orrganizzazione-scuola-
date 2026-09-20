import React, { useState } from 'react';
import { X, Edit2, Trash2, Plus, Palette, AlertCircle, Check } from 'lucide-react';
import { Materia } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { PALETTE_MATERIE, getFirstAvailableColor, findSubjectByColor } from './subjectColors';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({ isOpen, onClose }) => {
  const { materie, orario, updateMateria, deleteMateria, getOrCreateMateria } = useSchoolStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editColore, setEditColore] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newNome, setNewNome] = useState('');
  const [newFeedback, setNewFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const startEdit = (m: Materia) => {
    setEditingId(m.id);
    setEditNome(m.nome);
    setEditColore(m.colore);
    setErrorMsg(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditNome('');
    setEditColore('');
    setErrorMsg(null);
  };

  const handleSaveEdit = (id: string) => {
    setErrorMsg(null);
    // Uniqueness validation on color
    const conflict = findSubjectByColor(editColore, materie, id);
    if (conflict) {
      const suggested = getFirstAvailableColor(materie, id);
      setErrorMsg(
        `Questo colore è già assegnato a "${conflict.nome}". Scegline un altro (es. ${suggested}).`
      );
      return;
    }

    const res = updateMateria(id, editNome, editColore);
    if (!res.success) {
      setErrorMsg(res.error || 'Errore durante l\'aggiornamento.');
      return;
    }

    setEditingId(null);
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();
    setNewFeedback(null);
    if (!newNome.trim()) return;

    try {
      const { materia, isNew } = getOrCreateMateria(newNome.trim());
      if (!isNew) {
        setNewFeedback(`La materia "${materia.nome}" esiste già.`);
      } else {
        setNewNome('');
        setNewFeedback(`Materia "${materia.nome}" creata con successo!`);
      }
    } catch (err: any) {
      setNewFeedback(err.message || 'Errore durante la creazione.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manager-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 id="manager-title" className="text-lg font-bold text-stone-900 font-heading">
                Gestione Materie e Colori
              </h3>
              <p className="text-xs text-stone-500">
                Regola colori, rinomina materie o aggiungine di nuove. I colori sono sempre unici e accessibili.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create new subject bar */}
        <form onSubmit={handleCreateNew} className="mt-4 p-3 bg-stone-50 rounded-xl border border-stone-200 shrink-0">
          <label htmlFor="nuova-materia-input" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Aggiungi nuova materia
          </label>
          <div className="flex items-center gap-2">
            <input
              id="nuova-materia-input"
              type="text"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              placeholder="Nome nuova materia (es. Informatica, Diritto...)"
              className="flex-1 px-3.5 py-2 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D] transition-all"
            />
            <button
              type="submit"
              disabled={!newNome.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5541D] hover:bg-[#9E4616] disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Aggiungi
            </button>
          </div>
          {newFeedback && (
            <p className="mt-2 text-xs font-medium text-stone-700">
              {newFeedback}
            </p>
          )}
        </form>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mt-3 p-3 bg-[#FDE8E9] text-[#C1272D] text-xs rounded-xl font-medium flex items-start gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Subject list */}
        <div className="mt-4 overflow-y-auto flex-1 divide-y divide-stone-100 pr-1">
          {materie.map(m => {
            const isEditing = editingId === m.id;
            const slotCount = orario.filter(s => s.materiaId === m.id).length;

            return (
              <div key={m.id} className="py-3 px-2 flex flex-col gap-3 hover:bg-stone-50/70 rounded-xl transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs border border-black/10"
                      style={{ backgroundColor: isEditing ? editColore : m.colore }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-sm truncate">
                          {m.nome}
                        </span>
                        <SubjectBadge materia={isEditing ? { ...m, colore: editColore } : m} size="sm" />
                      </div>
                      <span className="text-xs text-stone-500">
                        {slotCount} {slotCount === 1 ? 'ora settimanale' : 'ore settimanali'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => startEdit(m)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                          aria-label={`Modifica materia ${m.nome}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Modifica</span>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Vuoi davvero eliminare la materia "${m.nome}"? Verrà rimossa anche dall'orario.`)) {
                              deleteMateria(m.id);
                            }
                          }}
                          className="p-1.5 text-[#C1272D] hover:bg-[#FDE8E9] rounded-lg transition-colors cursor-pointer"
                          aria-label={`Elimina materia ${m.nome}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1 text-xs font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(m.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#B5541D] hover:bg-[#9E4616] rounded-lg transition-colors cursor-pointer"
                        >
                          Salva
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline edit details */}
                {isEditing && (
                  <div className="p-3 bg-stone-100/70 rounded-xl space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Nome materia
                      </label>
                      <input
                        type="text"
                        value={editNome}
                        onChange={e => setEditNome(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">
                        Seleziona colore (deve essere unico per ogni materia)
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {PALETTE_MATERIE.map(col => {
                          const conflictSubject = findSubjectByColor(col, materie, m.id);
                          const isSelected = editColore.toUpperCase() === col.toUpperCase();
                          const isOccupied = conflictSubject !== undefined;

                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => {
                                setEditColore(col);
                                setErrorMsg(null);
                              }}
                              title={
                                isOccupied
                                  ? `Già assegnato a: ${conflictSubject.nome}`
                                  : `Seleziona colore ${col}`
                              }
                              className={`relative h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'ring-2 ring-stone-900 ring-offset-2 scale-105'
                                  : isOccupied
                                  ? 'opacity-40 hover:opacity-75'
                                  : 'hover:scale-105'
                              }`}
                              style={{ backgroundColor: col }}
                            >
                              {isSelected && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
