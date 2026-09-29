import React, { useMemo } from 'react';
import {
  BookOpen,
  CalendarDays,
  CalendarCheck,
  ChevronRight,
  GraduationCap,
  Layers,
} from 'lucide-react';
import { useSchoolStore } from '../data/useSchoolStore';
import { GIORNI_SETTIMANA, GiornoSettimana } from '../data/models';
import { SubjectBadge } from '../shared/SubjectBadge';

interface OtherSubjectsProps {
  tomorrowDayId?: GiornoSettimana;
  onNavigateToTimetable?: () => void;
}

export const OtherSubjects: React.FC<OtherSubjectsProps> = ({
  tomorrowDayId = 'lun',
  onNavigateToTimetable,
}) => {
  const { materie, orario, eventi } = useSchoolStore();

  // Find subjects that are in tomorrow's schedule
  const tomorrowSubjectIds = useMemo(() => {
    const slots = orario.filter(s => s.giorno === tomorrowDayId && s.materiaId);
    return new Set(slots.map(s => s.materiaId));
  }, [orario, tomorrowDayId]);

  // Compute statistics for all subjects:
  // - weekly hours
  // - days scheduled
  // - is taught tomorrow or is "other"
  // - next event
  const subjectListWithInfo = useMemo(() => {
    return materie.map(materia => {
      const subjectSlots = orario.filter(s => s.materiaId === materia.id);
      const weeklyHours = subjectSlots.length;

      // Collect unique days
      const daysSet = new Set<GiornoSettimana>(subjectSlots.map(s => s.giorno));
      const scheduledDaysNames = GIORNI_SETTIMANA
        .filter(g => daysSet.has(g.id))
        .map(g => g.nomeBreve)
        .join(', ');

      const isTomorrow = tomorrowSubjectIds.has(materia.id);

      // Next upcoming event for this subject
      const upcomingEvents = eventi
        .filter(e => e.materiaId === materia.id)
        .sort((a, b) => a.data.localeCompare(b.data));
      const nextEvent = upcomingEvents[0];

      return {
        materia,
        weeklyHours,
        scheduledDaysNames: scheduledDaysNames || 'Non pianificata',
        isTomorrow,
        nextEvent,
      };
    });
  }, [materie, orario, eventi, tomorrowSubjectIds]);

  // Group: other subjects (subjects not in tomorrow's schedule, or all if none)
  const otherSubjects = useMemo(() => {
    const others = subjectListWithInfo.filter(s => !s.isTomorrow);
    // If all subjects are tomorrow or none, show all
    if (others.length === 0) return subjectListWithInfo;
    return others;
  }, [subjectListWithInfo]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBF9]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-stone-100 text-stone-700">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 font-heading">
              Le Altre Materie del Corso
            </h3>
            <p className="text-xs text-stone-500 font-medium">
              Panoramica delle altre materie del piano di studi scolastico e ore settimanali
            </p>
          </div>
        </div>

        {onNavigateToTimetable && (
          <button
            type="button"
            onClick={onNavigateToTimetable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#B5541D]" />
            <span>Orario Completo</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
          </button>
        )}
      </div>

      {/* Grid of Other Subjects */}
      <div className="p-4 sm:p-5">
        {otherSubjects.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 italic">
            Tutte le materie del corso sono già pianificate per la giornata di domani.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {otherSubjects.map(({ materia, weeklyHours, scheduledDaysNames, nextEvent }) => (
              <div
                key={materia.id}
                className="p-3.5 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-50/60 transition-all shadow-2xs flex flex-col justify-between gap-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3.5 h-3.5 rounded-md shrink-0 shadow-2xs"
                      style={{ backgroundColor: materia.colore }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 truncate">
                        {materia.nome}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">
                        {weeklyHours > 0 ? `${weeklyHours} ore a settimana` : 'Nessuna ora'}
                      </p>
                    </div>
                  </div>
                  <SubjectBadge materia={materia} size="sm" />
                </div>

                <div className="text-[11px] text-stone-500 pt-2 border-t border-stone-100 flex items-center justify-between">
                  <span>
                    Giorni: <strong className="text-stone-700">{scheduledDaysNames}</strong>
                  </span>
                  {nextEvent && (
                    <span className="inline-flex items-center gap-1 text-[#B5541D] font-semibold text-[10px]">
                      <CalendarCheck className="w-3 h-3" />
                      {nextEvent.tipo === 'verifica' ? 'Verifica' : 'Interrogazione'} {nextEvent.data.split('-').slice(1).reverse().join('/')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
