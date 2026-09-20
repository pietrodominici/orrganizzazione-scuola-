import React, { useState, useEffect } from 'react';
import { X, ExternalLink, BookmarkPlus, AlertCircle } from 'lucide-react';
import { NotebookLink } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { isValidNotebookUrl, normalizeNotebookUrl, NOTEBOOK_LM_BASE_URL } from './notebookProvider';

interface NotebookFormModalProps {
  isOpen: boolean;
  notebookToEdit?: NotebookLink | null;
  onClose: () => void;
}

export const NotebookFormModal: React.FC<NotebookFormModalProps> = ({
  isOpen,
  notebookToEdit,
  onClose,
}) => {
  const { materie, addNotebook, updateNotebook } = useSchoolStore();

  const [titolo, setTitolo] = useState('');
  const [url, setUrl] = useState(NOTEBOOK_LM_BASE_URL);
  const [materiaId, setMateriaId] = useState<string>('');
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (notebookToEdit) {
        setTitolo(notebookToEdit.titolo);
        setUrl(notebookToEdit.url);
        setMateriaId(notebookToEdit.materiaId || '');
        setNote(notebookToEdit.note || '');
      } else {
        setTitolo('');
        setUrl(NOTEBOOK_LM_BASE_URL);
        setMateriaId(materie[0]?.id || '');
        setNote('');
      }
      setErrorMsg(null);
    }
  }, [isOpen, notebookToEdit, materie]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titolo.trim()) {
      setErrorMsg('Inserisci un titolo per il tuo notebook.');
      return;
    }

    const cleanUrl = normalizeNotebookUrl(url);
    if (!isValidNotebookUrl(cleanUrl)) {
      setErrorMsg('Inserisci un URL valido (es. https://notebooklm.google.com/notebook/...)');
      return;
    }

    if (notebookToEdit) {
      updateNotebook({
        ...notebookToEdit,
        titolo: titolo.trim(),
        url: cleanUrl,
        materiaId: materiaId ? materiaId : null,
        note: note.trim(),
      });
    } else {
      addNotebook({
        titolo: titolo.trim(),
        url: cleanUrl,
        materiaId: materiaId ? materiaId : null,
        note: note.trim(),
      });
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notebook-modal-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <BookmarkPlus className="w-5 h-5" />
            </span>
            <h3 id="notebook-modal-title" className="text-lg font-bold text-stone-900 font-heading">
              {notebookToEdit ? 'Modifica Notebook' : 'Salva Link NotebookLM'}
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
          <div className="mt-3 p-3 bg-[#FDE8E9] text-[#C1272D] text-xs rounded-xl font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="nb-title" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Titolo del Notebook
            </label>
            <input
              id="nb-title"
              type="text"
              value={titolo}
              onChange={e => setTitolo(e.target.value)}
              placeholder="Es. Sintesi Filosofia Illuminismo, Schemi Chimica..."
              required
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            />
          </div>

          <div>
            <label htmlFor="nb-url" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Link NotebookLM
            </label>
            <div className="relative">
              <input
                id="nb-url"
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://notebooklm.google.com/notebook/..."
                required
                className="w-full pl-3.5 pr-9 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-mono text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-3 text-stone-400 hover:text-[#B5541D]"
                title="Apri link di prova"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Incolla l&apos;URL del notebook creato su <strong>notebooklm.google.com</strong>.
            </p>
          </div>

          <div>
            <label htmlFor="nb-materia" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Materia associata
            </label>
            <select
              id="nb-materia"
              value={materiaId}
              onChange={e => setMateriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            >
              <option value="">Nessuna materia (Generale)</option>
              {materie.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nb-notes" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Fonti caricate o promemoria
            </label>
            <textarea
              id="nb-notes"
              rows={2}
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Es. Contiene capitolo 3 del libro e PDF dispense del professore..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            />
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
              {notebookToEdit ? 'Salva Modifiche' : 'Aggiungi Notebook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
