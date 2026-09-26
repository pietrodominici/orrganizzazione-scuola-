import React, { useState, useRef, useId } from 'react';
import {
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Copy,
  Check,
  FileJson,
  HardDrive,
  School,
  GraduationCap,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { useSchoolStore } from '../data/useSchoolStore';
import { AppBackupData } from '../data/models';
import { ConfirmModal } from '../shared/ConfirmModal';

interface SettingsViewProps {
  onNavigateToDashboard?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToDashboard }) => {
  const {
    materie,
    orario,
    eventi,
    compiti,
    notebooks,
    user,
    updateUser,
    clearAllData,
    resetAllData,
    exportBackup,
    importBackup,
    getStorageEstimate,
  } = useSchoolStore();

  // Profile form state
  const [nome, setNome] = useState(user.nome || 'Studente');
  const [scuola, setScuola] = useState(user.scuola || 'Liceo Scientifico');
  const [classe, setClasse] = useState(user.classe || '4ª S');
  const [profileSaved, setProfileSaved] = useState(false);

  // Modals
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);

  // Export / Copy feedback
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);

  // Import state
  const [pendingBackup, setPendingBackup] = useState<AppBackupData | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileInputId = useId();
  const nomeInputId = useId();
  const scuolaInputId = useId();
  const classeInputId = useId();

  const storageEstimate = getStorageEstimate();
  const pendingTasks = compiti.filter(c => !c.fatto).length;

  // Handle Profile Update
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      nome: nome.trim() || 'Studente',
      scuola: scuola.trim() || 'Liceo Scientifico',
      classe: classe.trim() || '4ª S',
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  // Generate Backup Data
  const currentBackup = exportBackup();
  const backupJsonString = JSON.stringify(currentBackup, null, 2);

  // Download Backup JSON file
  const handleDownloadBackup = () => {
    try {
      const classSlug = (user.classe || '4s')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `backup-organizza-scuola-${classSlug || '4s'}-${dateStr}.json`;

      const blob = new Blob([backupJsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotice(`Backup salvato come "${filename}"`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      console.error('Errore export backup:', err);
      setExportNotice('Impossibile completare il download del backup.');
    }
  };

  // Copy JSON to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(backupJsonString);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      // Fallback
      setIsCopied(false);
    }
  };

  // Handle File Input for Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();

    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation of essential shapes
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Il file non contiene un JSON valido.');
        }

        // At least one of the expected array collections or user profile must be present
        const hasExpectedFields =
          Array.isArray(parsed.materie) ||
          Array.isArray(parsed.orario) ||
          Array.isArray(parsed.compiti) ||
          Array.isArray(parsed.eventi) ||
          parsed.user;

        if (!hasExpectedFields) {
          throw new Error(
            'Il file selezionato non sembra essere un backup di Organizza Scuola (mancano le voci richieste).'
          );
        }

        setPendingBackup(parsed as AppBackupData);
        setIsImportConfirmOpen(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Errore nella lettura del file di backup.';
        setImportError(msg);
        setPendingBackup(null);
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setImportError('Impossibile leggere il file selezionato dal dispositivo.');
    };

    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!pendingBackup) return;
    const res = importBackup(pendingBackup);
    if (res.success) {
      // Update local form state with imported user profile
      if (pendingBackup.user) {
        setNome(pendingBackup.user.nome || 'Studente');
        setScuola(pendingBackup.user.scuola || 'Liceo Scientifico');
        setClasse(pendingBackup.user.classe || '4ª S');
      }
      setIsImportConfirmOpen(false);
      setPendingBackup(null);
      setExportNotice('Backup ripristinato con successo in tutta l\'applicazione!');
      setTimeout(() => setExportNotice(null), 4000);
    } else {
      setImportError(res.error || 'Errore durante il ripristino.');
      setIsImportConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header Page Title */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#B5541D]/10 via-[#B5541D]/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B5541D]/10 text-[#B5541D] text-xs font-bold mb-2">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Gestione Dati & Sicurezza</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 font-heading tracking-tight">
              Impostazioni & Backup
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl mt-1">
              Esporta il tuo orario e i tuoi compiti in un file JSON sicuro, ripristina backup precedenti,
              modifica la classe o azzera l&apos;applicazione.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-center min-w-[120px]">
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                Memoria Locale
              </span>
              <span className="text-base font-extrabold text-stone-900 font-heading">
                {storageEstimate.formatted}
              </span>
            </div>
          </div>
        </div>

        {/* Global Notice Toast */}
        {exportNotice && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 underline text-xs cursor-pointer ml-3 font-bold"
            >
              Chiudi
            </button>
          </div>
        )}

        {importError && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{importError}</span>
            </div>
            <button
              onClick={() => setImportError(null)}
              className="text-rose-700 underline text-xs cursor-pointer ml-3 font-bold"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>

      {/* Grid: 2 Columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Backup & Esporta / Importa (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Esporta Backup */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#B5541D]/10 text-[#B5541D] flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-stone-900 font-heading">
                    Esporta Backup (.json)
                  </h2>
                </div>
                <p className="text-xs text-stone-600 mt-1">
                  Scarica una copia completa di tutti i tuoi dati scolastici. Puoi conservarlo,
                  trasferirlo su un altro dispositivo o reimportarlo in qualsiasi momento.
                </p>
              </div>
            </div>

            {/* Current Data Overview Pills */}
            <div className="bg-stone-50 border border-stone-200/80 rounded-2xl p-4">
              <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Riepilogo dati inclusi nel backup</span>
                <span className="text-[#B5541D] font-bold">{user.classe || '4ª S'}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70">
                  <span className="text-stone-500 block text-[10px]">Materie</span>
                  <span className="font-extrabold text-stone-900 text-sm">{materie.length} registrate</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70">
                  <span className="text-stone-500 block text-[10px]">Orario settimanale</span>
                  <span className="font-extrabold text-stone-900 text-sm">{orario.length} ore / slot</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70">
                  <span className="text-stone-500 block text-[10px]">Compiti</span>
                  <span className="font-extrabold text-stone-900 text-sm">
                    {compiti.length} ({pendingTasks} aperti)
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70">
                  <span className="text-stone-500 block text-[10px]">Verifiche & Int.</span>
                  <span className="font-extrabold text-stone-900 text-sm">{eventi.length} registrate</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 sm:col-span-2">
                  <span className="text-stone-500 block text-[10px]">Quaderni NotebookLM</span>
                  <span className="font-extrabold text-stone-900 text-sm">{notebooks.length} collegamenti</span>
                </div>
              </div>
            </div>

            {/* Action Buttons for Export */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#B5541D] hover:bg-[#964214] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Scarica File Backup (.json)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyToClipboard}
                className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                  isCopied
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
                title="Copia l'intero testo JSON del backup negli appunti"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
                <span>{isCopied ? 'Copiato!' : 'Copia JSON'}</span>
              </button>
            </div>

            {/* JSON Preview accordion */}
            <div className="border-t border-stone-100 pt-3">
              <button
                type="button"
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 font-medium cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 text-stone-400" />
                <span>{showJsonPreview ? 'Nascondi anteprima JSON' : 'Mostra anteprima codice JSON'}</span>
                {showJsonPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showJsonPreview && (
                <div className="mt-3 relative">
                  <pre className="p-3.5 bg-stone-900 text-stone-200 text-[11px] font-mono rounded-2xl overflow-x-auto max-h-56 leading-relaxed border border-stone-800 select-all">
                    {backupJsonString}
                  </pre>
                  <p className="text-[10px] text-stone-400 mt-1">
                    Dimensione JSON formattato: {(backupJsonString.length / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Importa / Ripristina Backup */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-heading">
                  Ripristina da un Backup
                </h2>
                <p className="text-xs text-stone-600">
                  Carica un file JSON precedentemente esportato per ripristinare i tuoi dati.
                </p>
              </div>
            </div>

            {/* File Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-300 hover:border-[#B5541D] bg-stone-50/70 hover:bg-stone-50 rounded-2xl p-6 text-center transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                id={fileInputId}
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 group-hover:border-[#B5541D]/40 text-stone-500 group-hover:text-[#B5541D] flex items-center justify-center mx-auto mb-2 transition-colors">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-stone-800">
                Clicca per selezionare un file di backup (.json)
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Supporta file esportati da Organizza Scuola
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Svuota & Ripristina Demo + Profilo (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Svuota e Reset (Requested: "dove ci metti lo svuota") */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-heading">
                  Gestione & Svuota App
                </h2>
                <p className="text-xs text-stone-600">
                  Azioni di pulizia e configurazione dell&apos;applicazione.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {/* Option 1: Svuota Tutti i Dati */}
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-rose-950">
                      Svuota Tutti i Dati (Azzera App)
                    </h3>
                    <p className="text-[11px] text-rose-800 mt-0.5 leading-relaxed">
                      Elimina completamente tutte le tabelle orario, compiti, verifiche, materie e quaderni.
                      L&apos;app rimarrà vuota, pronta per compilare il tuo anno da zero.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota Applicazione</span>
                </button>
              </div>

              {/* Option 2: Ripristina Demo 4ª S */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      Ripristina Dati Demo (4ª S)
                    </h3>
                    <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                      Sostituisce i dati attuali con l&apos;orario e i compiti di prova del Liceo Scientifico (4ª S).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
                  <span>Carica Dati Demo</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card: Profilo Studente & Classe (Personalizzazione) */}
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-stone-900 font-heading">
                  Profilo & Classe
                </h2>
                <p className="text-xs text-stone-600">
                  Personalizza la tua classe, istituto e intestazione.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-1">
              <div>
                <label htmlFor={classeInputId} className="block text-xs font-bold text-stone-700 mb-1">
                  Classe Scolastica
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    id={classeInputId}
                    value={classe}
                    onChange={e => setClasse(e.target.value)}
                    placeholder="Es. 4ª S"
                    className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B5541D]/30 focus:border-[#B5541D] font-bold"
                  />
                  {/* Quick Select Buttons */}
                  <div className="flex items-center gap-1">
                    {['4ª S', '4ª B', '5ª S'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setClasse(c)}
                        className={`px-2 py-1.5 text-[10px] font-bold rounded-lg transition-colors cursor-pointer ${
                          classe === c
                            ? 'bg-[#B5541D] text-white'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor={scuolaInputId} className="block text-xs font-bold text-stone-700 mb-1">
                  Scuola / Istituto
                </label>
                <input
                  type="text"
                  id={scuolaInputId}
                  value={scuola}
                  onChange={e => setScuola(e.target.value)}
                  placeholder="Es. Liceo Scientifico"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B5541D]/30 focus:border-[#B5541D]"
                />
              </div>

              <div>
                <label htmlFor={nomeInputId} className="block text-xs font-bold text-stone-700 mb-1">
                  Nome Studente
                </label>
                <input
                  type="text"
                  id={nomeInputId}
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Es. Lorenzo"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B5541D]/30 focus:border-[#B5541D]"
                />
              </div>

              <button
                type="submit"
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  profileSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-900 hover:bg-stone-800 text-white'
                }`}
              >
                {profileSaved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{profileSaved ? 'Modifiche Salvate!' : 'Salva Modifiche Profilo'}</span>
              </button>
            </form>
          </div>

          {/* Card: Informazioni & PWA */}
          <div className="bg-stone-100/80 rounded-3xl p-5 border border-stone-200/80 space-y-2.5 text-xs text-stone-600">
            <div className="flex items-center gap-2 text-stone-900 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacy & Sicurezza Locale</span>
            </div>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Tutti i dati della scuola (orario, compiti, verifiche e quaderni) risiedono
              esclusivamente nella memoria locale del tuo dispositivo (LocalStorage). Nessun dato personale
              viene inviato a server esterni.
            </p>
            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1 text-stone-500">
                <Smartphone className="w-3.5 h-3.5 text-[#B5541D]" />
                <span>PWA & Schermata Home abilitate</span>
              </span>
              <span className="font-mono text-stone-400">v1.2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Svuota Tutti i Dati */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Azzera e Svuota Completamente l'App"
        message="Sei sicuro di voler eliminare tutti i dati? Verranno rimossi l'orario delle lezioni, tutti i compiti, le verifiche, le materie e i collegamenti ai quaderni. Se non l'hai fatto, ti consigliamo di scaricare prima una copia con il pulsante 'Scarica File Backup'."
        confirmLabel="Sì, svuota tutti i dati"
        cancelLabel="Annulla"
        isDestructive={true}
        onConfirm={() => {
          clearAllData();
          setIsClearModalOpen(false);
          setExportNotice('Applicazione svuotata con successo. Sei pronto per inserire i tuoi dati reali!');
          setTimeout(() => setExportNotice(null), 4000);
          if (onNavigateToDashboard) {
            onNavigateToDashboard();
          }
        }}
        onCancel={() => setIsClearModalOpen(false)}
      />

      {/* Confirmation Modal: Ripristina Demo */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Ripristina Dati Demo di Esempio (4ª S)"
        message="Vuoi ricaricare l'orario e i compiti di esempio della 4ª S? Tutti i dati attualmente presenti verranno sostituiti con i dati di esempio."
        confirmLabel="Sì, carica demo"
        cancelLabel="Annulla"
        isDestructive={false}
        onConfirm={() => {
          resetAllData();
          setIsResetModalOpen(false);
          setExportNotice('Dati demo della 4ª S caricati con successo!');
          setTimeout(() => setExportNotice(null), 4000);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Confirmation Modal: Importazione Backup */}
      <ConfirmModal
        isOpen={isImportConfirmOpen}
        title="Conferma Ripristino Backup"
        message={
          pendingBackup
            ? `Sei sicuro di voler ripristinare questo backup? Verranno caricati: ${pendingBackup.materie?.length || 0} materie, ${pendingBackup.orario?.length || 0} ore di orario, ${pendingBackup.compiti?.length || 0} compiti e ${pendingBackup.eventi?.length || 0} verifiche per la classe ${pendingBackup.user?.classe || 'salvata'}. I dati attuali non salvati verranno sovrascritti.`
            : 'Confermi il ripristino del file di backup selezionato?'
        }
        confirmLabel="Sì, ripristina backup"
        cancelLabel="Annulla"
        isDestructive={false}
        onConfirm={handleExecuteImport}
        onCancel={() => {
          setIsImportConfirmOpen(false);
          setPendingBackup(null);
        }}
      />
    </div>
  );
};
