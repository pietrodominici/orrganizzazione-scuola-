import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Calendar, BookOpen } from 'lucide-react';
import { Compito } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';

interface TaskFormModalProps {
  isOpen: boolean;
  taskToEdit?: Compito | null;
  onClose: () => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  taskToEdit,
  onClose,
}) => {
  const { materie, addCompito, updateCompito } = useSchoolStore();

  const [testo, setTesto] = useState('');
  const [materiaId, setMateriaId] = useState<string>('');
  const [scadenza, setScadenza] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTesto(taskToEdit.testo);
        setMateriaId(taskToEdit.materiaId || '');
        setScadenza(taskToEdit.scadenza);
      } else {
        setTesto('');
        setMateriaId(materie[0]?.id || '');
        // default to tomorrow
        const tom = new Date();
        tom.setDate(tom.getDate() + 1);
        setScadenza(tom.toISOString().split('T')[0]);
      }
      setErrorMsg(null);
    }
  }, [isOpen, taskToEdit, materie]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testo.trim()) {
      setErrorMsg('Inserisci la descrizione o gli esercizi del compito.');
      return;
    }
    if (!scadenza) {
      setErrorMsg('Inserisci una data di scadenza valida.');
      return;
    }

    if (taskToEdit) {
      updateCompito({
        ...taskToEdit,
        testo: testo.trim(),
        materiaId: materiaId ? materiaId : null,
        scadenza,
      });
    } else {
      addCompito({
        testo: testo.trim(),
        materiaId: materiaId ? materiaId : null,
        scadenza,
        fatto: false,
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <CheckSquare className="w-5 h-5" />
            </span>
            <h3 id="task-modal-title" className="text-lg font-bold text-stone-900 font-heading">
              {taskToEdit ? 'Modifica Compito' : 'Nuovo Compito per Casa'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-[#FDE8E9] text-[#C1272D] text-xs rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="task-text" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Descrizione / Esercizi
            </label>
            <textarea
              id="task-text"
              rows={3}
              value={testo}
              onChange={e => setTesto(e.target.value)}
              placeholder="Es. Esercizi pag. 142 n. 34, 35; studiare regole grammaticali..."
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-materia" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Materia (Opzionale)
              </label>
              <select
                id="task-materia"
                value={materiaId}
                onChange={e => setMateriaId(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
              >
                <option value="">Generale (Nessuna)</option>
                {materie.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="task-deadline" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Data Scadenza
              </label>
              <input
                id="task-deadline"
                type="date"
                value={scadenza}
                onChange={e => setScadenza(e.target.value)}
                required
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-[#B5541D] hover:bg-[#9E4616] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {taskToEdit ? 'Aggiorna' : 'Crea Compito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
