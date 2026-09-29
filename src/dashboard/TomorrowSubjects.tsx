import React, { useState, useMemo } from 'react';
import {
  Clock,
  BookOpen,
  Calendar,
  Sparkles,
  ChevronRight,
  GraduationCap,
  CalendarCheck,
  FileText,
} from 'lucide-react';
import { useSchoolStore } from '../data/useSchoolStore';
import { GIORNI_SETTIMANA, GiornoSettimana, ORE_DEFAULT } from '../data/models';
import { SubjectBadge } from '../shared/SubjectBadge';

interface TomorrowSubjectsProps {
  onNavigateToTimetable?: () => void;
}

export const TomorrowSubjects: React.FC<TomorrowSubjectsProps> = ({ onNavigateToTimetable }) => {
  const { orario, eventi, getMateriaById, materie } = useSchoolStore();

  // Current reference date (today is 2026-09-20 - Sunday)
  const today = useMemo(() => new Date('2026-09-20T00:00:00'), []);

  // Determine tomorrow's day of week
  // 0: Domenica -> Domani è Lunedì ('lun')
  // 1: Lunedì -> Domani è Martedì ('mar')
  // 2: Martedì -> Domani è Mercoledì ('mer')
  // 3: Mercoledì -> Domani è Giovedì ('gio')
  // 4: Giovedì -> Domani è Venerdì ('ven')
  // 5/6: Venerdì/Sabato -> Prossimo giorno di scuola è Lunedì ('lun')
  const { defaultDayId, tomorrowDateStr, tomorrowDisplayLabel, isTomorrowWeekend } = useMemo(() => {
    const dayOfWeek = today.getDay(); // 0 is Sunday
    let nextDayId: GiornoSettimana = 'lun';
    let daysToAdd = 1;

    if (dayOfWeek === 0) {
      // Sunday -> Tomorrow is Monday
      nextDayId = 'lun';
      daysToAdd = 1;
    } else if (dayOfWeek === 1) {
      nextDayId = 'mar';
      daysToAdd = 1;
    } else if (dayOfWeek === 2) {
      nextDayId = 'mer';
      daysToAdd = 1;
    } else if (dayOfWeek === 3) {
      nextDayId = 'gio';
      daysToAdd = 1;
    } else if (dayOfWeek === 4) {
      nextDayId = 'ven';
      daysToAdd = 1;
    } else if (dayOfWeek === 5) {
      // Friday -> Next school day is Monday (add 3 days)
      nextDayId = 'lun';
      daysToAdd = 3;
    } else if (dayOfWeek === 6) {
      // Saturday -> Next school day is Monday (add 2 days)
      nextDayId = 'lun';
      daysToAdd = 2;
    }

    const nextDate = new Date(today.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const dateStr = nextDate.toISOString().split('T')[0];

    const giornoInfo = GIORNI_SETTIMANA.find(g => g.id === nextDayId);
    const displayLabel = `${giornoInfo?.nome || 'Lunedì'} ${nextDate.getDate()} Settembre`;

    return {
      defaultDayId: nextDayId,
      tomorrowDateStr: dateStr,
      tomorrowDisplayLabel: displayLabel,
      isTomorrowWeekend: dayOfWeek === 5 || dayOfWeek === 6,
    };
  }, [today]);

  // Allow user to toggle active viewing day, default to tomorrow's day
  const [selectedDay, setSelectedDay] = useState<GiornoSettimana>(defaultDayId);

  // Get slots for the selected day, sorted by hour
  const slotsForDay = useMemo(() => {
    const daySlots = orario.filter(s => s.giorno === selectedDay && s.materiaId);
    // Sort according to ORE_DEFAULT order
    return daySlots.sort((a, b) => {
      const idxA = ORE_DEFAULT.indexOf(a.ora);
      const idxB = ORE_DEFAULT.indexOf(b.ora);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.ora.localeCompare(b.ora);
    });
  }, [orario, selectedDay]);

  // Check if any subject for this day has an event (verifica or interrogazione) on tomorrow's date
  const eventsForDate = useMemo(() => {
    return eventi.filter(e => e.data === tomorrowDateStr);
  }, [eventi, tomorrowDateStr]);

  const selectedGiornoInfo = GIORNI_SETTIMANA.find(g => g.id === selectedDay);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFBF9]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
            <BookOpen className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 font-heading">
                Materie per Domani ({selectedGiornoInfo?.nome})
              </h3>
              {selectedDay === defaultDayId && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B5541D] text-white tracking-wide uppercase">
                  Domani
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 font-medium">
              {selectedDay === defaultDayId
                ? `${tomorrowDisplayLabel} • ${slotsForDay.length} ore di lezione previste`
                : `Orario di ${selectedGiornoInfo?.nome} • ${slotsForDay.length} ore di lezione`}
            </p>
          </div>
        </div>

        {/* Day Switcher */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200 self-start sm:self-auto">
          {GIORNI_SETTIMANA.map(g => {
            const isSelected = selectedDay === g.id;
            const isTomorrow = g.id === defaultDayId;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedDay(g.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-white text-[#B5541D] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title={`Vedi orario di ${g.nome}`}
              >
                <span>{g.nomeBreve}</span>
                {isTomorrow && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B5541D]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots List for Tomorrow */}
      <div className="p-4 sm:p-5">
        {slotsForDay.length === 0 ? (
          <div className="py-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-200">
            <GraduationCap className="w-8 h-8 mx-auto text-stone-400 mb-2" />
            <p className="text-sm font-semibold text-stone-700">
              Nessuna lezione programmata per {selectedGiornoInfo?.nome}
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Non sono ancora stati inseriti gli slot orari per questo giorno nell'orario scolastico.
            </p>
            {onNavigateToTimetable && (
              <button
                type="button"
                onClick={onNavigateToTimetable}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#B5541D] bg-white border border-[#B5541D]/30 hover:bg-[#FBF1EB] rounded-lg transition-colors cursor-pointer"
              >
                Configura Orario Settimanale
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {slotsForDay.map((slot, index) => {
              const materia = getMateriaById(slot.materiaId);
              // Check if there is an event for this subject on this day
              const eventForSubject = eventsForDate.find(e => e.materiaId === slot.materiaId);

              return (
                <div
                  key={slot.id || `${slot.giorno}-${slot.ora}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-200/80 bg-white hover:bg-stone-50/70 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Hour Number / Time badge */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-stone-100 text-stone-700 font-mono text-xs font-bold shrink-0">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>{slot.ora}</span>
                    </div>

                    {/* Color bar indicator */}
                    <div
                      className="w-1.5 h-7 rounded-full shrink-0"
                      style={{ backgroundColor: materia?.colore || '#78716C' }}
                    />

                    {/* Subject name */}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-stone-900 group-hover:text-[#B5541D] transition-colors truncate">
                        {materia?.nome || 'Materia'}
                      </h4>
                      <p className="text-[11px] text-stone-500">
                        {index + 1}ª ora • {selectedGiornoInfo?.nome}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Subject badge and scheduled test/exam if any */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {eventForSubject && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FBF1EB] text-[#B5541D] border border-[#B5541D]/20 shadow-2xs">
                        {eventForSubject.tipo === 'verifica' ? (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>Verifica in programma</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span>Interrogazione</span>
                          </>
                        )}
                      </span>
                    )}

                    <SubjectBadge materia={materia} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info & link */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>
            {slotsForDay.length} {slotsForDay.length === 1 ? 'materia programmata' : 'materie programmate'}
          </span>
          {onNavigateToTimetable && (
            <button
              type="button"
              onClick={onNavigateToTimetable}
              className="text-[#B5541D] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Vedi tutto l'orario settimanale
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
