import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  BookOpen,
} from 'lucide-react';
import { Evento } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { EventModal } from './EventModal';

const MESI_ITALIANI = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const GIORNI_SETT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export const MonthCalendar: React.FC = () => {
  const { eventi, getMateriaById } = useSchoolStore();

  // Selected viewing year and month
  // Default to September 2026 based on the active school calendar
  const today = useMemo(() => new Date('2026-09-20'), []);
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(8); // 8 = September (0-indexed)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-22');

  const selectedDateEvents = useMemo(() => {
    return eventi.filter(e => e.data === selectedDate);
  }, [eventi, selectedDate]);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Build calendar matrix (weeks of 7 days, starting on Monday)
  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // In JS, Sunday is 0. Shift so Monday is 0 and Sunday is 6
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const weeks: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: Evento[];
    }[][] = [];

    let currentWeek: typeof weeks[0] = [];

    // Days from previous month to fill first week
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const dayEvents = eventi.filter(e => e.data === dateStr);

      currentWeek.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
        events: dayEvents,
      });
    }

    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = dateStr === todayFormatted;
      const dayEvents = eventi.filter(e => e.data === dateStr);

      currentWeek.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Days from next month to finish last week
    if (currentWeek.length > 0) {
      let nextDayNum = 1;
      const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;

      while (currentWeek.length < 7) {
        const dateStr = `${nextYear}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(nextDayNum).padStart(2, '0')}`;
        const dayEvents = eventi.filter(e => e.data === dateStr);

        currentWeek.push({
          dateStr,
          dayNumber: nextDayNum,
          isCurrentMonth: false,
          isToday: false,
          events: dayEvents,
        });
        nextDayNum++;
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentYear, currentMonth, eventi, today]);

  // Count of events in this month
  const eventsInCurrentMonth = useMemo(() => {
    return eventi.filter(e => {
      const parts = e.data.split('-');
      return parseInt(parts[0], 10) === currentYear && parseInt(parts[1], 10) === currentMonth + 1;
    });
  }, [eventi, currentYear, currentMonth]);

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
      {/* Calendar Navigation Header */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100">
        <div className="flex items-center gap-3">
          <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
            <CalendarIcon className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-stone-900 font-heading">
              {MESI_ITALIANI[currentMonth]} {currentYear}
            </h3>
            <p className="text-xs text-stone-500">
              {eventsInCurrentMonth.length}{' '}
              {eventsInCurrentMonth.length === 1 ? 'prova programmata' : 'prove programmate'} in questo mese
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
          >
            Oggi
          </button>
          <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-white rounded transition-colors"
              aria-label="Mese precedente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 text-stone-600 hover:text-stone-900 hover:bg-white rounded transition-colors"
              aria-label="Mese successivo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setSelectedDateForNewEvent(undefined);
              setIsEventModalOpen(true);
            }}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-[#B5541D] hover:bg-[#9E4616] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuova Prova
          </button>
        </div>
      </div>

      {/* Semantic Accessible Calendar Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" aria-label={`Calendario verifiche per ${MESI_ITALIANI[currentMonth]} ${currentYear}`}>
          <caption className="sr-only">Calendario mensile con verifiche ed interrogazioni</caption>
          <thead>
            <tr className="bg-stone-50/70 border-b border-stone-200 text-center">
              {GIORNI_SETT.map(g => (
                <th
                  key={g}
                  scope="col"
                  className="py-2.5 px-2 text-xs font-bold text-stone-600 uppercase tracking-wider"
                >
                  {g}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {calendarWeeks.map((week, wIdx) => (
              <tr key={wIdx} className="divide-x divide-stone-100">
                {week.map(day => {
                  const isSelected = selectedDate === day.dateStr;
                  return (
                    <td
                      key={day.dateStr}
                      onClick={() => setSelectedDate(day.dateStr)}
                      className={`p-1.5 sm:p-2 align-top h-20 sm:h-28 transition-colors cursor-pointer ${
                        day.isCurrentMonth ? 'bg-white' : 'bg-stone-50/40 text-stone-400'
                      } ${isSelected ? 'bg-[#FBF1EB]/60 ring-2 ring-inset ring-[#B5541D]' : 'hover:bg-stone-50/80'} ${
                        day.isToday && !isSelected ? 'bg-[#FBF1EB]/30' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-all ${
                            isSelected
                              ? 'bg-[#B5541D] text-white font-bold shadow-xs'
                              : day.isToday
                              ? 'border-2 border-[#B5541D] text-[#B5541D] font-bold'
                              : day.isCurrentMonth
                              ? 'text-stone-800'
                              : 'text-stone-400'
                          }`}
                        >
                          {day.dayNumber}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingEvent(null);
                            setSelectedDateForNewEvent(day.dateStr);
                            setIsEventModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 sm:hover:opacity-100 p-0.5 rounded text-stone-400 hover:text-[#B5541D] transition-opacity cursor-pointer"
                          aria-label={`Aggiungi prova per il giorno ${day.dateStr}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Mobile Event Dots (iOS Style) */}
                      <div className="flex items-center justify-center gap-1 sm:hidden mt-1">
                        {day.events.slice(0, 3).map(ev => {
                          const mat = getMateriaById(ev.materiaId);
                          return (
                            <span
                              key={ev.id}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: mat?.colore || '#B5541D' }}
                            />
                          );
                        })}
                        {day.events.length > 3 && (
                          <span className="text-[9px] text-stone-400 font-bold">+</span>
                        )}
                      </div>

                      {/* Event Badges on day (Tablet / Desktop) */}
                      <div className="hidden sm:block space-y-1 overflow-y-auto max-h-16">
                        {day.events.map(ev => {
                          const mat = getMateriaById(ev.materiaId);
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(ev);
                                setIsEventModalOpen(true);
                              }}
                              className="w-full text-left rounded-md p-1 border border-black/5 hover:brightness-95 transition-all text-[11px] leading-tight flex items-center gap-1 truncate cursor-pointer shadow-2xs"
                              style={{
                                backgroundColor: mat?.colore || '#475569',
                                color: '#FFFFFF',
                              }}
                              title={`${ev.tipo === 'verifica' ? 'Verifica' : 'Interrogazione'} di ${mat?.nome || 'Materia'}${ev.note ? `: ${ev.note}` : ''}`}
                            >
                              <span className="font-bold shrink-0 text-[10px]">
                                {ev.tipo === 'verifica' ? 'V' : 'I'}:
                              </span>
                              <span className="font-semibold truncate">{mat?.nome || 'Materia'}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected Day Agenda (iOS Style) */}
      <div className="p-4 bg-stone-50/80 border-t border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#B5541D]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Agenda del {selectedDate}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setSelectedDateForNewEvent(selectedDate);
              setIsEventModalOpen(true);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#B5541D] hover:underline cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Aggiungi prova
          </button>
        </div>

        {selectedDateEvents.length > 0 ? (
          <div className="space-y-2">
            {selectedDateEvents.map(ev => {
              const mat = getMateriaById(ev.materiaId);
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setEditingEvent(ev);
                    setIsEventModalOpen(true);
                  }}
                  className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between gap-3 cursor-pointer hover:border-stone-300 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: mat?.colore || '#B5541D' }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900">
                          {mat?.nome || 'Materia'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            ev.tipo === 'verifica'
                              ? 'bg-red-50 text-[#C1272D]'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {ev.tipo === 'verifica' ? 'Verifica Scritta' : 'Interrogazione'}
                        </span>
                      </div>
                      {ev.note && (
                        <p className="text-xs text-stone-500 truncate mt-0.5">{ev.note}</p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-semibold text-[#B5541D] shrink-0">
                    Modifica
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-stone-400 italic">
            Nessuna prova programmata per questo giorno. Tocca &quot;Aggiungi prova&quot; per inserirne una.
          </p>
        )}
      </div>

      {/* Empty State message if no events in month */}
      {eventsInCurrentMonth.length === 0 && (
        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-stone-400" />
            <span>Nessuna verifica o interrogazione programmata per questo mese.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingEvent(null);
              setSelectedDateForNewEvent(undefined);
              setIsEventModalOpen(true);
            }}
            className="text-[#B5541D] hover:underline font-semibold"
          >
            + Aggiungi la prima prova
          </button>
        </div>
      )}

      {/* Event Add/Edit Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        eventToEdit={editingEvent}
        initialDate={selectedDateForNewEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
          setSelectedDateForNewEvent(undefined);
        }}
      />
    </div>
  );
};
