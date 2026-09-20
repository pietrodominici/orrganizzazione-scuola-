import React, { useState, useMemo } from 'react';
import {
  ExternalLink,
  Plus,
  BookMarked,
  Info,
  Calendar,
  Edit2,
  Trash2,
  LogIn,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import { NotebookLink } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import {
  NOTEBOOK_LM_STATUS,
  NOTEBOOK_LM_BASE_URL,
  launchNotebook,
} from './notebookProvider';
import { NotebookFormModal } from './NotebookFormModal';
import { ConfirmModal } from '../shared/ConfirmModal';

export const NotebookView: React.FC = () => {
  const { notebooks, materie, getMateriaById, deleteNotebook, user, updateUser } = useSchoolStore();

  const [selectedMateria, setSelectedMateria] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNb, setEditingNb] = useState<NotebookLink | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredNotebooks = useMemo(() => {
    return notebooks.filter(nb => {
      if (selectedMateria === 'all') return true;
      if (selectedMateria === 'none') return nb.materiaId === null;
      return nb.materiaId === selectedMateria;
    });
  }, [notebooks, selectedMateria]);

  const handleToggleGoogleAuth = () => {
    if (user.isGoogleConnected) {
      updateUser({ isGoogleConnected: false, email: undefined });
    } else {
      // Simulate Google Sign-In connection client-side
      updateUser({
        isGoogleConnected: true,
        email: 'studente.scuola@gmail.com',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-heading flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <BookMarked className="w-5 h-5" />
            </span>
            Raccoglitore NotebookLM
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Salva, cataloga e apri rapidamente i tuoi quaderni di studio creati su Google NotebookLM.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick link to NotebookLM */}
          <button
            type="button"
            onClick={() => launchNotebook(NOTEBOOK_LM_BASE_URL)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#B5541D]" />
            Apri NotebookLM
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingNb(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5541D] hover:bg-[#9E4616] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Notebook
          </button>
        </div>
      </div>

      {/* Honest Technical Note & Google Account Status */}
      <div className="bg-[#FBF1EB]/70 border border-[#B5541D]/25 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-white text-[#B5541D] shadow-2xs shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Come funziona l&apos;integrazione NotebookLM
            </h3>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed max-w-2xl">
              {NOTEBOOK_LM_STATUS.message}
            </p>
          </div>
        </div>

        {/* Google Sign-in status widget */}
        <div className="shrink-0 bg-white p-3 rounded-xl border border-stone-200 flex items-center gap-3">
          {user.isGoogleConnected ? (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div className="leading-tight">
                <span className="block font-semibold text-stone-900">Google Connesso</span>
                <span className="text-[11px] text-stone-500">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={handleToggleGoogleAuth}
                className="ml-2 text-[11px] text-stone-400 hover:text-stone-700 underline"
              >
                Disconnetti
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleToggleGoogleAuth}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-[#B5541D]" />
              Accedi con Google
            </button>
          )}
        </div>
      </div>

      {/* Filter by Subject */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400 shrink-0" />
          <select
            value={selectedMateria}
            onChange={e => setSelectedMateria(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
          >
            <option value="all">Tutte le materie ({notebooks.length})</option>
            <option value="none">Senza materia</option>
            {materie.map(m => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notebooks List */}
      {filteredNotebooks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
            <BookMarked className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-stone-800 font-heading">
            Nessun notebook salvato
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Crea un quaderno su Google NotebookLM caricando i tuoi PDF o appunti Drive, poi salva qui il link per accedervi all&apos;istante.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => launchNotebook(NOTEBOOK_LM_BASE_URL)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-100 text-stone-800 hover:bg-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Vai su NotebookLM
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingNb(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5541D] text-white rounded-xl text-xs font-semibold hover:bg-[#9E4616] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Salva il link qui
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotebooks.map(nb => {
            const materia = getMateriaById(nb.materiaId);

            return (
              <div
                key={nb.id}
                className="soft-card p-5 flex flex-col justify-between hover:border-stone-300 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <SubjectBadge materia={materia} size="sm" />
                    <span className="text-[11px] text-stone-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {nb.creatoIl}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900 line-clamp-1 font-heading group-hover:text-[#B5541D] transition-colors">
                    {nb.titolo}
                  </h3>

                  {nb.note && (
                    <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {nb.note}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => launchNotebook(nb.url)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FBF1EB] hover:bg-[#F5E2D6] text-[#B5541D] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Apri Notebook</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNb(nb);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                      aria-label={`Modifica notebook ${nb.titolo}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(nb.id)}
                      className="p-1.5 text-stone-400 hover:text-[#C1272D] hover:bg-[#FDE8E9] rounded-lg transition-colors cursor-pointer"
                      aria-label={`Elimina notebook ${nb.titolo}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <NotebookFormModal
        isOpen={isModalOpen}
        notebookToEdit={editingNb}
        onClose={() => {
          setIsModalOpen(false);
          setEditingNb(null);
        }}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deletingId}
        title="Elimina Notebook"
        message="Sei sicuro di voler rimuovere questo notebook dal tuo raccoglitore? Il notebook su Google NotebookLM non verrà eliminato."
        confirmLabel="Rimuovi"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={() => {
          if (deletingId) {
            deleteNotebook(deletingId);
            setDeletingId(null);
          }
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
