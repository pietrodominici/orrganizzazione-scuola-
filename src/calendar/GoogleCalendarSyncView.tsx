import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  CheckCircle2,
  CalendarCheck,
  Share2,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  Smartphone,
  Laptop,
  Check,
  LogOut,
  AlertCircle,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { useSchoolStore } from '../data/useSchoolStore';
import { SubjectBadge } from '../shared/SubjectBadge';
import { Evento, Materia } from '../data/models';
import {
  initAuth,
  googleSignIn,
  logout,
  createGoogleCalendarEvent,
  buildGoogleCalendarPayload,
  getAccessToken,
} from './googleCalendarService';
import { User } from 'firebase/auth';

export const GoogleCalendarSyncView: React.FC = () => {
  const { eventi, materie, getMateriaById, user: schoolUser } = useSchoolStore();
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Confirmation Modal for Syncing all to Google Calendar (mandated by Workspace skill)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [syncCount, setSyncCount] = useState<number | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (u, token) => {
        setGoogleUser(u);
        setAccessToken(token);
      },
      () => {
        setGoogleUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setSyncStatusMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setAccessToken(res.accessToken);
        setSyncStatusMessage({
          type: 'success',
          text: `Connesso con successo come ${res.user.displayName || res.user.email}!`,
        });
      }
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setSyncStatusMessage({
          type: 'error',
          text: err?.message || 'Accesso non riuscito. Riprova.',
        });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setGoogleUser(null);
    setAccessToken(null);
    setSyncStatusMessage({
      type: 'info',
      text: 'Account Google scollegato.',
    });
  };

  // Sort upcoming events
  const sortedEvents = useMemo(() => {
    return [...eventi].sort((a, b) => a.data.localeCompare(b.data));
  }, [eventi]);

  // Direct sync all events to Google Calendar via API with user confirmation
  const handleConfirmSyncAll = async () => {
    setIsConfirmModalOpen(false);
    if (!accessToken) {
      setSyncStatusMessage({
        type: 'error',
        text: 'Accedi prima con il tuo account Google.',
      });
      return;
    }

    if (sortedEvents.length === 0) {
      setSyncStatusMessage({
        type: 'info',
        text: 'Nessuna verifica o interrogazione da sincronizzare.',
      });
      return;
    }

    setIsSyncingAll(true);
    setSyncStatusMessage({
      type: 'info',
      text: 'Sincronizzazione in corso su Google Calendar...',
    });

    let successCount = 0;
    try {
      for (const ev of sortedEvents) {
        const mat = getMateriaById(ev.materiaId);
        const payload = buildGoogleCalendarPayload(ev, mat, schoolUser);
        await createGoogleCalendarEvent(accessToken, payload);
        successCount++;
      }

      setSyncCount(successCount);
      setSyncStatusMessage({
        type: 'success',
        text: `Tutte le ${successCount} verifiche e interrogazioni sono state aggiunte a Google Calendar!`,
      });
    } catch (err: any) {
      setSyncStatusMessage({
        type: 'error',
        text: `Sincronizzate ${successCount} di ${sortedEvents.length} prove. Errore: ${err?.message || 'Problema di rete'}`,
      });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Single event sync via API (if logged in) or web URL
  const handleSyncSingleEvent = async (evento: Evento) => {
    if (accessToken) {
      try {
        const mat = getMateriaById(evento.materiaId);
        const payload = buildGoogleCalendarPayload(evento, mat, schoolUser);
        await createGoogleCalendarEvent(accessToken, payload);
        setSyncStatusMessage({
          type: 'success',
          text: `"${payload.summary}" aggiunta direttamente al tuo Google Calendar!`,
        });
        return;
      } catch (err: any) {
        // Fallback to web link if API fails
        console.warn('API sync fallback to URL:', err);
      }
    }

    // Open Web URL
    window.open(getGoogleCalendarUrl(evento), '_blank');
  };

  // Generate Google Calendar direct web URL for a single event
  const getGoogleCalendarUrl = (evento: Evento) => {
    const materia = getMateriaById(evento.materiaId);
    const tipoLabel = evento.tipo === 'verifica' ? 'Verifica' : 'Interrogazione';
    const title = encodeURIComponent(`${tipoLabel} di ${materia?.nome || 'Materia'} - ${schoolUser.classe || 'Scuola'}`);

    const dateFormatted = evento.data.replace(/-/g, '');
    const startIso = `${dateFormatted}T083000`;
    const endIso = `${dateFormatted}T093000`;

    const description = encodeURIComponent(
      `Prova scolastica: ${tipoLabel}\n` +
      `Materia: ${materia?.nome || ''}\n` +
      `Classe: ${schoolUser.classe || ''}\n` +
      `Istituto: ${schoolUser.scuola || ''}\n` +
      (evento.note ? `Note / Argomenti: ${evento.note}\n` : '') +
      `\nGenerato con Organizza Scuola.`
    );

    const location = encodeURIComponent(schoolUser.scuola || 'Scuola');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${description}&location=${location}`;
  };

  // Generate and download RFC 5545 .ics calendar file
  const handleDownloadIcs = () => {
    try {
      const now = new Date();
      const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Organizza Scuola//Calendario Scolastico//IT',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:Scuola - ${schoolUser.classe || 'Verifiche e Orario'}`,
        'X-WR-TIMEZONE:Europe/Rome',
      ];

      sortedEvents.forEach(evento => {
        const materia = getMateriaById(evento.materiaId);
        const tipoLabel = evento.tipo === 'verifica' ? 'Verifica' : 'Interrogazione';
        const dateFormatted = evento.data.replace(/-/g, '');
        const uid = `scuola-evento-${evento.id}-${dateFormatted}@organizzascuola.app`;

        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${dtstamp}`,
          `DTSTART;VALUE=DATE:${dateFormatted}`,
          `DTEND;VALUE=DATE:${dateFormatted}`,
          `SUMMARY:${tipoLabel}: ${materia?.nome || 'Materia'} (${schoolUser.classe || 'Scuola'})`,
          `DESCRIPTION:${tipoLabel} di ${materia?.nome || ''}. ${evento.note ? 'Argomenti: ' + evento.note : ''}`,
          `LOCATION:${schoolUser.scuola || 'Scuola'}`,
          'STATUS:CONFIRMED',
          'BEGIN:VALARM',
          'ACTION:DISPLAY',
          `DESCRIPTION:Promemoria: ${tipoLabel} di ${materia?.nome || 'Materia'} domani`,
          'TRIGGER:-P1D',
          'END:VALARM',
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendario-scuola-${schoolUser.classe?.toLowerCase().replace(/[^a-z0-9]/g, '') || '4s'}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch {
      setSyncStatusMessage({
        type: 'error',
        text: 'Errore durante la creazione del file di calendario .ics',
      });
    }
  };

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Notice Banner */}
      {syncStatusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            syncStatusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : syncStatusMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncStatusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : syncStatusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{syncStatusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncStatusMessage(null)}
            className="font-bold underline cursor-pointer text-[11px]"
          >
            Chiudi
          </button>
        </div>
      )}

      {/* Hero Banner with Google Workspace Connection */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-br from-[#FBF1EB]/50 via-white to-stone-50 border-b border-stone-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              {/* Google Calendar Multi-color Logo */}
              <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center shrink-0 p-2.5">
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <rect width="48" height="48" rx="8" fill="#FFFFFF" />
                  <path fill="#4285F4" d="M35 10H13c-1.66 0-3 1.34-3 3v22c0 1.66 1.34 3 3 3h22c1.66 0 3-1.34 3-3V13c0-1.66-1.34-3-3-3z"/>
                  <path fill="#FFFFFF" d="M19 32h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4v-4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4v-4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4v-4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4v-4h4v4z"/>
                  <path fill="#EA4335" d="M38 13v-1c0-1.1-.9-2-2-2H12c-1.1 0-2 .9-2 2v1h28z"/>
                  <circle cx="16" cy="9" r="1.5" fill="#34A853"/>
                  <circle cx="32" cy="9" r="1.5" fill="#FBBC05"/>
                </svg>
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F0FE] text-[#1A73E8] mb-2">
                  <Sparkles className="w-3 h-3" />
                  Google Workspace Calendar
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-heading">
                  Sincronizzazione con Google Calendar
                </h2>
                <p className="text-sm text-stone-600 mt-1 max-w-xl">
                  Sincronizza le date di verifiche e interrogazioni direttamente nel tuo account Google Calendar
                  per ricevere promemoria puntuali su iPhone, Android e computer.
                </p>
              </div>
            </div>

            {/* Account Connect or Sync Button */}
            <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2.5">
              {googleUser ? (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Connesso: {googleUser.displayName || googleUser.email}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <button
                      type="button"
                      disabled={isSyncingAll}
                      onClick={() => setIsConfirmModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSyncingAll ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sincronizzazione...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Sincronizza Tutto ({sortedEvents.length})</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleLogout}
                      title="Disconnetti account Google"
                      className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* Google Official Styled Sign In Button */
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoggingIn ? 'Accesso in corso...' : 'Accedi con Google per Sincronizzare'}</span>
                </button>
              )}

              {/* Quick Export .ICS Button */}
              <button
                type="button"
                onClick={handleDownloadIcs}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>File .ics Scaricato!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Esporta File Calendario (.ics)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Sync Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-stone-100 bg-stone-50/50 border-t border-stone-100 text-center p-3 text-xs">
          <div>
            <span className="font-bold text-stone-900 text-sm">{sortedEvents.length}</span>
            <span className="block text-stone-500 text-[11px]">Prove in programma</span>
          </div>
          <div>
            <span className="font-bold text-stone-900 text-sm">{materie.length}</span>
            <span className="block text-stone-500 text-[11px]">Materie scolastiche</span>
          </div>
          <div className="col-span-2 sm:col-span-1 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
            <span className={`font-bold text-sm ${googleUser ? 'text-emerald-600' : 'text-[#1A73E8]'}`}>
              {googleUser ? 'Google Connesso' : 'Pronto alla sincronizzazione'}
            </span>
            <span className="block text-stone-500 text-[11px]">Stato account</span>
          </div>
        </div>
      </div>

      {/* 1-Click Sync List for Verifiche & Interrogazioni */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <CalendarCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-heading">
                Verifiche e Interrogazioni da Sincronizzare
              </h3>
              <p className="text-xs text-stone-500">
                Tocca il pulsante su ogni singola prova per aggiungerla a Google Calendar
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 divide-y divide-stone-100">
          {sortedEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 italic">
              Nessuna verifica o interrogazione attualmente salvata nel calendario scolastico.
            </div>
          ) : (
            sortedEvents.map(evento => {
              const materia = getMateriaById(evento.materiaId);

              return (
                <div
                  key={evento.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/60 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <SubjectBadge materia={materia} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-stone-900 truncate">
                        {evento.tipo === 'verifica' ? '📝 Verifica' : '🗣️ Interrogazione'}: {materia?.nome || 'Materia'}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateIt(evento.data)} {evento.note ? `• ${evento.note}` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSyncSingleEvent(evento)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] border border-[#1A73E8]/20 transition-all shadow-2xs self-end sm:self-auto cursor-pointer"
                    title="Aggiungi a Google Calendar"
                  >
                    <span>{googleUser ? 'Sincronizza in Google' : 'Aggiungi a Google Calendar'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Guide: How to Sync on iPhone & Android */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs p-5 sm:p-6">
        <h3 className="text-base font-bold text-stone-900 font-heading mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#B5541D]" />
          Come sincronizzare sul tuo smartphone
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* iPhone */}
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FCFBF9]">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs mb-2">
              <Smartphone className="w-4 h-4 text-stone-700" />
              <span>Su iPhone (Safari / Apple Calendar / App Google Calendar)</span>
            </div>
            <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                <strong>Connetti il tuo account Google</strong> con il pulsante in alto oppure tocca <strong>"Esporta File Calendario (.ics)"</strong>.
              </li>
              <li>
                Se scarichi il file <code>.ics</code>, toccalo per importare tutte le verifiche direttamente in Apple Calendar o Google Calendar.
              </li>
              <li>
                In alternativa, tocca <strong>"Aggiungi a Google Calendar"</strong> per ogni prova per aprirla direttamente nell'app Google Calendar.
              </li>
            </ol>
          </div>

          {/* Android & PC */}
          <div className="p-4 rounded-xl border border-stone-200 bg-[#FCFBF9]">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-xs mb-2">
              <Laptop className="w-4 h-4 text-stone-700" />
              <span>Su Android &amp; Computer</span>
            </div>
            <ol className="text-xs text-stone-600 space-y-2 list-decimal list-inside pl-1 leading-relaxed">
              <li>
                Connetti il tuo account Google per caricare automaticamente tutte le prove con un solo click.
              </li>
              <li>
                Oppure scarica il file <strong>.ics</strong> e importalo su <strong>calendar.google.com</strong> &gt; Impostazioni ⚙️ &gt; <strong>"Importazione ed esportazione"</strong>.
              </li>
              <li>
                Tutte le notifiche 24 ore prima e 2 ore prima suoneranno automaticamente sul tuo smartphone.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal for Mutating/Writing to Google Calendar (Mandatory per Skill) */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-stone-900">
                  Conferma Sincronizzazione Google Calendar
                </h4>
                <p className="text-xs text-stone-500">
                  Account: {googleUser?.email}
                </p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Stai per aggiungere <strong>{sortedEvents.length} eventi</strong> (verifiche ed interrogazioni scolastiche) al calendario principale del tuo account Google Calendar con promemoria automatici.
            </p>

            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              {sortedEvents.map(e => {
                const m = getMateriaById(e.materiaId);
                return (
                  <div key={e.id} className="flex justify-between items-center text-stone-700">
                    <span className="font-semibold truncate">{e.tipo === 'verifica' ? '📝' : '🗣️'} {m?.nome}</span>
                    <span className="text-stone-500 shrink-0">{e.data}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={handleConfirmSyncAll}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1A73E8] hover:bg-[#1557B0] shadow-xs transition-colors cursor-pointer"
              >
                Sì, sincronizza su Google Calendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
