import React, { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Trash2 } from 'lucide-react';
import { Evento, TipoEvento } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';

interface EventModalProps {
  isOpen: boolean;
  eventToEdit?: Evento | null;
  initialDate?: string;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  eventToEdit,
  initialDate,
  onClose,
}) => {
  const { materie, addEvento, updateEvento, deleteEvento } = useSchoolStore();

  const [materiaId, setMateriaId] = useState<string>('');
  const [tipo, setTipo] = useState<TipoEvento>('verifica');
  const [data, setData] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (eventToEdit) {
        setMateriaId(eventToEdit.materiaId);
        setTipo(eventToEdit.tipo);
        setData(eventToEdit.data);
        setNote(eventToEdit.note || '');
      } else {
        setMateriaId(materie[0]?.id || '');
        setTipo('verifica');
        // Default to initialDate or current date
        const todayStr = initialDate || new Date().toISOString().split('T')[0];
        setData(todayStr);
        setNote('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, eventToEdit, initialDate, materie]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materiaId) {
      setErrorMsg('Seleziona una materia per la verifica/interrogazione.');
      return;
    }
    if (!data) {
      setErrorMsg('Inserisci la data dell\'evento.');
      return;
    }

    if (eventToEdit) {
      updateEvento({
        ...eventToEdit,
        materiaId,
        tipo,
        data,
        note: note.trim(),
      });
    } else {
      addEvento({
        materiaId,
        tipo,
        data,
        note: note.trim(),
      });
    }

    onClose();
  };

  const handleDelete = () => {
    if (eventToEdit) {
      deleteEvento(eventToEdit.id);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 id="event-modal-title" className="text-lg font-bold text-stone-900 font-heading">
              {eventToEdit ? 'Modifica Prova' : 'Nuova Verifica o Interrogazione'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Chiudi"
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
          {/* Tipo di evento */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Tipologia di prova
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipo('verifica')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  tipo === 'verifica'
                    ? 'border-[#B5541D] bg-[#FBF1EB] text-[#B5541D] ring-2 ring-[#B5541D]/20'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                📝 Verifica Scritta
              </button>
              <button
                type="button"
                onClick={() => setTipo('interrogazione')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  tipo === 'interrogazione'
                    ? 'border-[#B5541D] bg-[#FBF1EB] text-[#B5541D] ring-2 ring-[#B5541D]/20'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                }`}
              >
                🗣️ Interrogazione Orale
              </button>
            </div>
          </div>

          {/* Materia */}
          <div>
            <label htmlFor="event-materia" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Materia
            </label>
            <select
              id="event-materia"
              value={materiaId}
              onChange={e => setMateriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            >
              {materie.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label htmlFor="event-date" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Data dell&apos;evento
            </label>
            <input
              id="event-date"
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            />
          </div>

          {/* Note / Argomenti */}
          <div>
            <label htmlFor="event-notes" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Argomenti e note di studio
            </label>
            <textarea
              id="event-notes"
              rows={3}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Es. Capitoli 4-5, disequazioni di secondo grado..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            {eventToEdit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#C1272D] hover:bg-[#FDE8E9] rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Elimina
              </button>
            ) : <span />}

            <div className="flex items-center gap-2">
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
                {eventToEdit ? 'Aggiorna' : 'Crea Prova'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
