import React, { useMemo } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle,
  FileCheck,
  CalendarCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { Compito, Evento } from '../data/models';

interface UnifiedDeadline {
  id: string;
  type: 'evento' | 'compito';
  title: string;
  data: string; // YYYY-MM-DD
  materiaId: string | null;
  isUrgent48h: boolean;
  isOverdue: boolean;
  details?: string;
  done?: boolean;
}

export const DashboardSummary: React.FC<{
  onNavigateToTasks: () => void;
  onNavigateToTimetable: () => void;
  onNavigateToNotebooks?: () => void;
}> = ({
  onNavigateToTasks,
  onNavigateToTimetable,
  onNavigateToNotebooks,
}) => {
  const { eventi, compiti, notebooks, materie, getMateriaById } = useSchoolStore();

  // Current reference date (today is 2026-09-20)
  const today = useMemo(() => new Date('2026-09-20T00:00:00'), []);
  const todayStr = useMemo(() => '2026-09-20', []);

  // Calculate 48 hours threshold
  const in48Hours = useMemo(() => {
    const d = new Date(today.getTime() + 48 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  }, [today]);

  // Start & end of current week (Monday to Sunday)
  const { startOfWeekStr, endOfWeekStr } = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay();
    const diffToMon = d.getDate() - (day === 0 ? 6 : day - 1);
    const mon = new Date(d.setDate(diffToMon));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);

    return {
      startOfWeekStr: mon.toISOString().split('T')[0],
      endOfWeekStr: sun.toISOString().split('T')[0],
    };
  }, [today]);

  // Verifiche stats
  const totalVerifiche = eventi.length;
  const verificheThisWeek = useMemo(() => {
    return eventi.filter(e => e.data >= startOfWeekStr && e.data <= endOfWeekStr).length;
  }, [eventi, startOfWeekStr, endOfWeekStr]);

  const verificheFuture = useMemo(() => {
    return eventi.filter(e => e.data >= todayStr).length;
  }, [eventi, todayStr]);

  // Compiti stats
  const compitiDaFare = useMemo(() => {
    return compiti.filter(c => !c.fatto).length;
  }, [compiti]);

  // Unified next 3-5 deadlines
  const upcomingDeadlines = useMemo<UnifiedDeadline[]>(() => {
    const list: UnifiedDeadline[] = [];

    // Add upcoming events
    eventi.forEach(e => {
      const isUrgent = e.data >= todayStr && e.data <= in48Hours;
      const isOverdue = e.data < todayStr;
      const mat = getMateriaById(e.materiaId);
      list.push({
        id: e.id,
        type: 'evento',
        title: `${e.tipo === 'verifica' ? '📝 Verifica' : '🗣️ Interrogazione'}: ${mat?.nome || 'Materia'}`,
        data: e.data,
        materiaId: e.materiaId,
        isUrgent48h: isUrgent,
        isOverdue,
        details: e.note,
      });
    });

    // Add uncompleted tasks
    compiti
      .filter(c => !c.fatto)
      .forEach(c => {
        const isUrgent = c.scadenza >= todayStr && c.scadenza <= in48Hours;
        const isOverdue = c.scadenza < todayStr;
        list.push({
          id: c.id,
          type: 'compito',
          title: c.testo,
          data: c.scadenza,
          materiaId: c.materiaId,
          isUrgent48h: isUrgent,
          isOverdue,
          done: c.fatto,
        });
      });

    // Sort ascending by date
    list.sort((a, b) => a.data.localeCompare(b.data));

    // Prioritize today and future, or max 5 items
    return list.slice(0, 5);
  }, [eventi, compiti, todayStr, in48Hours, getMateriaById]);

  // Format date helper: "Martedì 22 Set"
  const formatDateIt = (dStr: string) => {
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
    <div className="space-y-4">
      {/* 3 Metric Summary Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Verifiche in programma */}
        <div className="soft-card p-4 sm:p-5 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Verifiche & Interrogazioni
            </span>
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <CalendarCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-stone-900">{totalVerifiche}</span>
            <span className="text-xs text-stone-500 font-medium">in totale</span>
          </div>
          <div className="mt-2 text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
            <span>Questa settimana: <strong className="text-stone-900">{verificheThisWeek}</strong></span>
            <span>Future: <strong className="text-[#B5541D]">{verificheFuture}</strong></span>
          </div>
        </div>

        {/* Card 2: Compiti da fare */}
        <div className="soft-card p-4 sm:p-5 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Compiti da Svolgere
            </span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <FileCheck className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-stone-900">{compitiDaFare}</span>
            <span className="text-xs text-stone-500 font-medium">non completati</span>
          </div>
          <div className="mt-2 text-xs text-stone-600 flex items-center justify-between border-t border-stone-100 pt-2">
            <button
              type="button"
              onClick={onNavigateToTasks}
              className="text-[#B5541D] hover:underline font-semibold flex items-center gap-1"
            >
              Vai ai compiti
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Card 3: Scadenze imminenti (entro 48 ore) */}
        <div className="soft-card p-4 sm:p-5 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Urgente (Entro 48 Ore)
            </span>
            <span className="p-2 rounded-xl bg-[#FDE8E9] text-[#C1272D]">
              <AlertCircle className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-heading text-[#C1272D]">
              {upcomingDeadlines.filter(d => d.isUrgent48h).length}
            </span>
            <span className="text-xs text-stone-500 font-medium">scadenze a breve</span>
          </div>
          <div className="mt-2 text-xs text-[#C1272D] font-medium border-t border-stone-100 pt-2">
            {upcomingDeadlines.some(d => d.isUrgent48h)
              ? '⚠️ Preparati subito per le prove imminenti!'
              : 'Nessuna urgenza critica nelle prossime 48 ore.'}
          </div>
        </div>
      </div>

      {/* Quick Access to Sections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={onNavigateToTimetable}
          className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-xs font-bold text-stone-900 group-hover:text-[#B5541D] flex items-center gap-1.5">
              📅 Orario Lezioni
            </span>
            <span className="text-[11px] text-stone-500">Vedi la settimana</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#B5541D] group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          type="button"
          onClick={onNavigateToTasks}
          className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-xs font-bold text-stone-900 group-hover:text-[#B5541D] flex items-center gap-1.5">
              ✅ Compiti &amp; Verifiche
            </span>
            <span className="text-[11px] text-stone-500">{compitiDaFare} da completare</span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#B5541D] group-hover:translate-x-0.5 transition-all" />
        </button>

        {onNavigateToNotebooks && (
          <button
            type="button"
            onClick={onNavigateToNotebooks}
            className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between text-left transition-all group cursor-pointer shadow-2xs col-span-2 sm:col-span-1"
          >
            <div>
              <span className="text-xs font-bold text-stone-900 group-hover:text-[#B5541D] flex items-center gap-1.5">
                📚 Quaderni NotebookLM
              </span>
              <span className="text-[11px] text-stone-500">{notebooks.length} quaderni</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#B5541D] group-hover:translate-x-0.5 transition-all" />
          </button>
        )}
      </div>

      {/* Prossime 3-5 Scadenze Card (Soft-card structure) */}
      <div className="soft-card p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-heading">
                Prossime Scadenze in Ordine Cronologico
              </h3>
              <p className="text-xs text-stone-500">
                Verifiche e compiti ordinati per data. Evidenziati in rosso entro le 48 ore.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-stone-100">
          {upcomingDeadlines.length === 0 ? (
            <div className="py-6 text-center text-xs text-stone-500 italic">
              Nessuna scadenza in arrivo. Sei in pari con tutti gli impegni!
            </div>
          ) : (
            upcomingDeadlines.map(item => {
              const materia = getMateriaById(item.materiaId);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors rounded-xl px-2.5 ${
                    item.isUrgent48h ? 'bg-[#FDE8E9]/60' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SubjectBadge materia={materia} size="sm" />
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          item.isUrgent48h ? 'text-[#C1272D]' : 'text-stone-900'
                        }`}
                      >
                        {item.title}
                      </p>
                      {item.details && (
                        <p className="text-xs text-stone-500 truncate">{item.details}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {item.isUrgent48h && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C1272D] text-white">
                        <AlertCircle className="w-3 h-3" />
                        Entro 48h
                      </span>
                    )}

                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                        item.isUrgent48h
                          ? 'border-[#C1272D]/30 bg-white text-[#C1272D]'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      {formatDateIt(item.data)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
