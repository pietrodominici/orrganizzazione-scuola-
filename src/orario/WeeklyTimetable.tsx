import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  Palette,
  Upload,
  Clock,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { GiornoSettimana, GIORNI_SETTIMANA, ORE_DEFAULT } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { SlotEditorModal } from './SlotEditorModal';
import { SubjectManagerModal } from './SubjectManagerModal';
import { ImportTimetableModal } from './ImportTimetableModal';
import { ConfirmModal } from '../shared/ConfirmModal';

export const WeeklyTimetable: React.FC = () => {
  const { orario, materie, getMateriaById, clearOrario } = useSchoolStore();

  // Active view: day view by default for mobile/iPhone friendliness, with option for full week
  const [viewMode, setViewMode] = useState<'giorno' | 'settimana'>('giorno');
  const [selectedDay, setSelectedDay] = useState<GiornoSettimana>('lun');

  // Active editing state for slot
  const [selectedSlot, setSelectedSlot] = useState<{
    giorno: GiornoSettimana;
    ora: string;
    materiaId?: string;
  } | null>(null);

  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [newHourInput, setNewHourInput] = useState('');
  const [showAddHour, setShowAddHour] = useState(false);

  // Compute unique hours sorted
  const hoursList = useMemo(() => {
    const set = new Set<string>(ORE_DEFAULT);
    orario.forEach(s => set.add(s.ora));
    return Array.from(set).sort((a, b) => {
      const getStart = (str: string) => {
        const m = str.match(/(\d{1,2}):(\d{2})/);
        return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : 999;
      };
      return getStart(a) - getStart(b);
    });
  }, [orario]);

  // Fast map lookup: `${giorno}-${ora}` -> materiaId
  const slotMap = useMemo(() => {
    const map = new Map<string, string>();
    orario.forEach(s => {
      map.set(`${s.giorno}-${s.ora}`, s.materiaId);
    });
    return map;
  }, [orario]);

  const handleAddHour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHourInput.trim()) return;
    setSelectedSlot({ giorno: selectedDay, ora: newHourInput.trim() });
    setNewHourInput('');
    setShowAddHour(false);
  };

  const selectedDayInfo = GIORNI_SETTIMANA.find(g => g.id === selectedDay);

  // Slots for selected day
  const daySlots = useMemo(() => {
    return hoursList.map(ora => {
      const materiaId = slotMap.get(`${selectedDay}-${ora}`);
      const materia = getMateriaById(materiaId);
      return { ora, materiaId, materia };
    });
  }, [hoursList, slotMap, selectedDay, getMateriaById]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-heading flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <CalendarDays className="w-5 h-5" />
            </span>
            Orario Settimanale
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Clicca su una casella per impostare la materia. I colori vengono associati automaticamente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4 text-[#B5541D]" />
            Importa orario (PDF / MD)
          </button>

          <button
            type="button"
            onClick={() => setIsSubjectManagerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4 text-[#B5541D]" />
            Gestione Materie ({materie.length})
          </button>

          <button
            type="button"
            onClick={() => setShowAddHour(!showAddHour)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#B5541D] hover:bg-[#9E4616] text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Ora
          </button>
        </div>
      </div>

      {/* Add custom hour prompt */}
      {showAddHour && (
        <form
          onSubmit={handleAddHour}
          className="p-4 bg-[#FBF1EB] rounded-2xl border border-[#B5541D]/20 flex items-center gap-3 animate-in fade-in"
        >
          <Clock className="w-5 h-5 text-[#B5541D] shrink-0" />
          <span className="text-xs font-semibold text-stone-800 shrink-0">Nuova fascia oraria:</span>
          <input
            type="text"
            value={newHourInput}
            onChange={e => setNewHourInput(e.target.value)}
            placeholder="es. 14:00-15:00 o 6ª ora"
            className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs text-stone-900 focus:border-[#B5541D] focus:ring-1 focus:ring-[#B5541D] flex-1 max-w-xs"
            autoFocus
          />
          <button
            type="submit"
            disabled={!newHourInput.trim()}
            className="px-3 py-1.5 bg-[#B5541D] text-white text-xs font-semibold rounded-lg hover:bg-[#9E4616] disabled:opacity-50 cursor-pointer"
          >
            Aggiungi riga
          </button>
          <button
            type="button"
            onClick={() => setShowAddHour(false)}
            className="text-xs text-stone-500 hover:text-stone-800"
          >
            Annulla
          </button>
        </form>
      )}

      {/* iOS Segmented Control for View Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs">
        {/* iOS style Segmented Toggle */}
        <div className="flex items-center p-1 bg-stone-100 rounded-xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode('giorno')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              viewMode === 'giorno'
                ? 'bg-white text-[#B5541D] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Vista Giorno
          </button>
          <button
            type="button"
            onClick={() => setViewMode('settimana')}
            className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
              viewMode === 'settimana'
                ? 'bg-white text-[#B5541D] shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tutta la Settimana
          </button>
        </div>

        {/* Day Selector (only shown in Day View) */}
        {viewMode === 'giorno' && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {GIORNI_SETTIMANA.map(g => {
              const isSelected = selectedDay === g.id;
              // count hours for this day
              const countForDay = hoursList.filter(ora => slotMap.has(`${g.id}-${ora}`)).length;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedDay(g.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex flex-col items-center min-w-[54px] ${
                    isSelected
                      ? 'bg-[#B5541D] text-white shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <span>{g.nomeBreve}</span>
                  <span className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-white/80' : 'text-stone-400'}`}>
                    {countForDay}h
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day View Timeline (iPhone Optimized) */}
      {viewMode === 'giorno' && (
        <div className="space-y-3">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-stone-900 font-heading">
                {selectedDayInfo?.nome}
              </h3>
              <p className="text-xs text-stone-500">
                {daySlots.filter(s => !!s.materia).length} lezioni programmate su {daySlots.length} ore
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddHour(true)}
              className="text-xs font-semibold text-[#B5541D] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuova ora
            </button>
          </div>

          <div className="space-y-2.5">
            {daySlots.map(({ ora, materiaId, materia }) => (
              <div
                key={ora}
                onClick={() =>
                  setSelectedSlot({
                    giorno: selectedDay,
                    ora,
                    materiaId,
                  })
                }
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  materia
                    ? 'bg-white border-stone-200 hover:border-stone-300 shadow-2xs'
                    : 'bg-stone-50/50 border-dashed border-stone-300 hover:border-stone-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Hour badge */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-bold shrink-0 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>{ora}</span>
                  </div>

                  {/* Subject info */}
                  {materia ? (
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: materia.colore }}
                      />
                      <span className="text-sm font-bold text-stone-900 truncate">
                        {materia.nome}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400 italic">
                      Ora libera (tocca per assegnare)
                    </span>
                  )}
                </div>

                <div className="shrink-0">
                  {materia ? (
                    <span className="text-xs font-semibold text-[#B5541D] bg-[#FBF1EB] px-2.5 py-1 rounded-lg">
                      Modifica
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-lg bg-stone-200/60 text-stone-500">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semantic Accessible Table for Schedule (Week Mode) */}
      {viewMode === 'settimana' && (
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" aria-label="Orario delle lezioni settimanali">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th
                  scope="col"
                  className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-600 w-32 border-r border-stone-200"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Orario</span>
                  </div>
                </th>
                {GIORNI_SETTIMANA.map(g => (
                  <th
                    key={g.id}
                    scope="col"
                    className="py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-stone-800 min-w-[140px]"
                  >
                    <span className="hidden sm:inline">{g.nome}</span>
                    <span className="sm:hidden">{g.nomeBreve}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-200">
              {hoursList.map(ora => (
                <tr key={ora} className="hover:bg-stone-50/40 transition-colors">
                  {/* Hour column header */}
                  <th
                    scope="row"
                    className="py-3 px-4 text-xs font-semibold text-stone-700 bg-stone-50/70 border-r border-stone-200 whitespace-nowrap"
                  >
                    {ora}
                  </th>

                  {/* Days slots */}
                  {GIORNI_SETTIMANA.map(g => {
                    const materiaId = slotMap.get(`${g.id}-${ora}`);
                    const materia = getMateriaById(materiaId);

                    return (
                      <td key={g.id} className="p-2 align-top">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSlot({
                              giorno: g.id,
                              ora,
                              materiaId,
                            })
                          }
                          aria-label={`${g.nome} ore ${ora}: ${materia ? materia.nome : 'Ora libera, clicca per assegnare materia'}`}
                          className={`w-full min-h-[52px] p-2.5 rounded-xl border text-left flex flex-col justify-center transition-all cursor-pointer group focus:outline-hidden focus:ring-2 focus:ring-[#B5541D] ${
                            materia
                              ? 'border-transparent shadow-2xs hover:shadow-xs hover:brightness-95'
                              : 'border-dashed border-stone-200 hover:border-stone-400 hover:bg-stone-50 bg-stone-50/30'
                          }`}
                          style={
                            materia
                              ? {
                                  backgroundColor: materia.colore,
                                }
                              : undefined
                          }
                        >
                          {materia ? (
                            <div className="flex items-center justify-between gap-1 w-full">
                              <SubjectBadge materia={materia} size="md" className="shadow-none" />
                            </div>
                          ) : (
                            <span className="text-[11px] text-stone-400 group-hover:text-stone-600 flex items-center justify-center gap-1">
                              <Plus className="w-3 h-3" />
                              <span className="italic">Libero</span>
                            </span>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Timetable footer info & clear button */}
        <div className="p-4 bg-stone-50/60 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>
              {orario.length} ore programmate questa settimana su {hoursList.length * 5} slot disponibili.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="text-[#C1272D] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Cancella intero orario
          </button>
        </div>
      </div>
      )}

      {/* Legend of subjects */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
        <h3 className="text-xs font-bold text-stone-600 uppercase tracking-wider mb-3">
          Legenda Materie e Codici Colore Attivi
        </h3>
        <div className="flex flex-wrap gap-2">
          {materie.map(m => (
            <SubjectBadge key={m.id} materia={m} size="md" />
          ))}
          {materie.length === 0 && (
            <p className="text-xs text-stone-500 italic">
              Nessuna materia registrata. Aggiungi ore all&apos;orario o usa &quot;Gestione Materie&quot;.
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedSlot && (
        <SlotEditorModal
          isOpen={!!selectedSlot}
          giorno={selectedSlot.giorno}
          ora={selectedSlot.ora}
          currentMateriaId={selectedSlot.materiaId}
          onClose={() => setSelectedSlot(null)}
        />
      )}

      <SubjectManagerModal
        isOpen={isSubjectManagerOpen}
        onClose={() => setIsSubjectManagerOpen(false)}
      />

      <ImportTimetableModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        title="Cancella Orario Settimanale"
        message="Sei sicuro di voler svuotare tutti gli slot dell'orario settimanale? Le materie registrate e le verifiche non verranno eliminate."
        confirmLabel="Sì, cancella"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={() => {
          clearOrario();
          setIsClearConfirmOpen(false);
        }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </div>
  );
};
