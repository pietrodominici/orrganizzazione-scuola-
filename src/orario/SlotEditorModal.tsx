import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Check } from 'lucide-react';
import { GiornoSettimana, GIORNI_SETTIMANA } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { normalizeNomeMateria } from './subjectColors';

interface SlotEditorModalProps {
  isOpen: boolean;
  giorno: GiornoSettimana;
  ora: string;
  currentMateriaId?: string;
  onClose: () => void;
}

export const SlotEditorModal: React.FC<SlotEditorModalProps> = ({
  isOpen,
  giorno,
  ora,
  currentMateriaId,
  onClose,
}) => {
  const { materie, setSlot, getOrCreateMateria } = useSchoolStore();
  const [typedSubject, setTypedSubject] = useState('');
  const [selectedMateriaId, setSelectedMateriaId] = useState<string | null>(currentMateriaId || null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedMateriaId(currentMateriaId || null);
      setTypedSubject('');
      setFeedbackMsg(null);
    }
  }, [isOpen, currentMateriaId]);

  if (!isOpen) return null;

  const giornoObj = GIORNI_SETTIMANA.find(g => g.id === giorno);
  const matchingSubject = typedSubject.trim()
    ? materie.find(m => normalizeNomeMateria(m.nome) === normalizeNomeMateria(typedSubject))
    : undefined;

  const handleSave = () => {
    if (typedSubject.trim()) {
      try {
        const { materia } = getOrCreateMateria(typedSubject.trim());
        setSlot(giorno, ora, materia.id);
        onClose();
      } catch (err: any) {
        setFeedbackMsg(err.message || 'Errore durante l\'assegnazione della materia');
      }
    } else if (selectedMateriaId) {
      setSlot(giorno, ora, selectedMateriaId);
      onClose();
    } else {
      setSlot(giorno, ora, null);
      onClose();
    }
  };

  const handleClearSlot = () => {
    setSlot(giorno, ora, null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="slot-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 id="slot-modal-title" className="text-lg font-bold text-stone-900 font-heading">
              Modifica Lezione
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {giornoObj?.nome} • Ore {ora}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {feedbackMsg && (
          <div className="mt-3 p-3 bg-[#FDE8E9] text-[#C1272D] text-xs rounded-lg font-medium">
            {feedbackMsg}
          </div>
        )}

        {/* Input for new or search subject */}
        <div className="mt-4">
          <label htmlFor="input-materia" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
            Digita o crea nuova materia
          </label>
          <div className="relative">
            <input
              id="input-materia"
              type="text"
              value={typedSubject}
              onChange={e => {
                setTypedSubject(e.target.value);
                if (selectedMateriaId) setSelectedMateriaId(null);
              }}
              placeholder="Es. Matematica, Filosofia, Chimica..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#B5541D] focus:ring-2 focus:ring-[#B5541D]/20 transition-all"
            />
          </div>

          {/* Autocompletion info */}
          {typedSubject.trim() && (
            <div className="mt-2 p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs">
              {matchingSubject ? (
                <div className="flex items-center justify-between">
                  <span className="text-stone-600">Riconosciuta materia esistente:</span>
                  <SubjectBadge materia={matchingSubject} size="sm" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-stone-600">
                  <Plus className="w-3.5 h-3.5 text-[#B5541D]" />
                  <span>
                    Verrà creata la nuova materia &quot;<strong>{typedSubject.trim()}</strong>&quot; con colore automatico della palette.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing subjects list */}
        <div className="mt-5">
          <span className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
            Oppure scegli tra le materie esistenti:
          </span>
          <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-1 border border-stone-100 rounded-xl bg-stone-50/50">
            {materie.map(m => {
              const isSelected = selectedMateriaId === m.id && !typedSubject.trim();
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMateriaId(m.id);
                    setTypedSubject('');
                  }}
                  className={`flex items-center gap-1.5 p-1 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#B5541D] bg-[#FBF1EB] ring-2 ring-[#B5541D]/20'
                      : 'border-transparent hover:bg-stone-200/60'
                  }`}
                >
                  <SubjectBadge materia={m} size="sm" />
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#B5541D]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={handleClearSlot}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#C1272D] hover:bg-[#FDE8E9] rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Svuota ora
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#B5541D] hover:bg-[#9E4616] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Salva
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
