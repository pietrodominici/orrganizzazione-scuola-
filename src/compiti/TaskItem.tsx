import React from 'react';
import { Compito } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { AnimatedCheckbox } from '../shared/AnimatedCheckbox';
import { SubjectBadge } from '../shared/SubjectBadge';
import { Edit2, Trash2, AlertCircle, Calendar } from 'lucide-react';

interface TaskItemProps {
  compito: Compito;
  onEdit: (compito: Compito) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ compito, onEdit }) => {
  const { toggleCompito, deleteCompito, getMateriaById } = useSchoolStore();
  const materia = getMateriaById(compito.materiaId);

  // Reference date (2026-09-20)
  const todayStr = '2026-09-20';
  const isOverdue = !compito.fatto && compito.scadenza < todayStr;
  const isToday = compito.scadenza === todayStr;

  const formatDate = (dStr: string) => {
    try {
      const [y, m, d] = dStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('it-IT', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div
      className={`group p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
        compito.fatto
          ? 'bg-stone-50/70 border-stone-200 opacity-60'
          : isOverdue
          ? 'bg-[#FDE8E9]/70 border-[#C1272D]/40 shadow-xs'
          : 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Animated Checkbox */}
        <div className="pt-0.5 shrink-0">
          <AnimatedCheckbox
            checked={compito.fatto}
            onChange={() => toggleCompito(compito.id)}
            id={`task-check-${compito.id}`}
            ariaLabel={`Segna come ${compito.fatto ? 'da fare' : 'completato'}: ${compito.testo}`}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SubjectBadge materia={materia} size="sm" />
            {isOverdue && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C1272D] bg-white px-2 py-0.5 rounded-md border border-[#C1272D]/30">
                <AlertCircle className="w-3 h-3" />
                Scaduto
              </span>
            )}
            {isToday && !compito.fatto && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B5541D] bg-[#FBF1EB] px-2 py-0.5 rounded-md border border-[#B5541D]/20">
                Scade oggi
              </span>
            )}
          </div>

          {/* Secure text output (textContent / React JSX safe escaping) */}
          <p
            className={`text-sm text-stone-900 leading-relaxed break-words ${
              compito.fatto ? 'line-through text-stone-400' : ''
            }`}
          >
            {compito.testo}
          </p>

          <div className="mt-2 flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3 text-stone-400" />
              {formatDate(compito.scadenza)}
            </span>
          </div>
        </div>
      </div>

      {/* Item actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => onEdit(compito)}
          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
          aria-label={`Modifica compito: ${compito.testo}`}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => deleteCompito(compito.id)}
          className="p-1.5 text-stone-400 hover:text-[#C1272D] hover:bg-[#FDE8E9] rounded-lg transition-colors cursor-pointer"
          aria-label={`Elimina compito: ${compito.testo}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
