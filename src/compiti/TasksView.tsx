import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Compito } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { TaskItem } from './TaskItem';
import { TaskFormModal } from './TaskFormModal';
import { ToggleSwitch } from '../shared/ToggleSwitch';

export const TasksView: React.FC = () => {
  const { compiti, materie } = useSchoolStore();

  const [selectedMateria, setSelectedMateria] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Compito | null>(null);

  // Filtered & sorted tasks
  const filteredTasks = useMemo(() => {
    return compiti
      .filter(c => {
        // Status filter
        if (statusFilter === 'pending' && c.fatto) return false;
        if (statusFilter === 'done' && !c.fatto) return false;

        // Materia filter
        if (selectedMateria !== 'all') {
          if (selectedMateria === 'none') {
            if (c.materiaId !== null) return false;
          } else if (c.materiaId !== selectedMateria) {
            return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return c.testo.toLowerCase().includes(q);
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by deadline ascending
        if (a.scadenza !== b.scadenza) {
          return a.scadenza.localeCompare(b.scadenza);
        }
        return (a.fatto ? 1 : 0) - (b.fatto ? 1 : 0);
      });
  }, [compiti, statusFilter, selectedMateria, searchQuery]);

  const stats = useMemo(() => {
    const total = compiti.length;
    const done = compiti.filter(c => c.fatto).length;
    const pending = total - done;
    return { total, done, pending };
  }, [compiti]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-heading flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <CheckSquare className="w-5 h-5" />
            </span>
            Compiti per Casa
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {stats.pending} compiti da svolgere • {stats.done} completati con successo
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5541D] hover:bg-[#9E4616] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Compito
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Da fare ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tutti ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('done')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              statusFilter === 'done'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Fatti ({stats.done})
          </button>
        </div>

        {/* Secondary filters: Subject & Search */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Materia dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={selectedMateria}
              onChange={e => setSelectedMateria(e.target.value)}
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D]"
            >
              <option value="all">Tutte le materie</option>
              <option value="none">Senza materia</option>
              {materie.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca compiti..."
              className="pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D] w-36 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-800 font-heading">
              Nessun compito trovato
            </h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Non ci sono compiti corrispondenti ai filtri attivi. Aggiungi un nuovo compito per pianificare il tuo studio.
            </p>
            <button
              type="button"
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#B5541D] text-white rounded-xl text-xs font-semibold hover:bg-[#9E4616] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Crea nuovo compito
            </button>
          </div>
        ) : (
          filteredTasks.map(compito => (
            <TaskItem
              key={compito.id}
              compito={compito}
              onEdit={c => {
                setEditingTask(c);
                setIsModalOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Add / Edit Task Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        taskToEdit={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
};
