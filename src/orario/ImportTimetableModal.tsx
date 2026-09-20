import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { GiornoSettimana, SlotOrario, GIORNI_SETTIMANA } from '../data/models';
import { useSchoolStore } from '../data/useSchoolStore';
import {
  parseMarkdownTimetable,
  parsePdfTimetable,
  ParsedTimetableRow,
  SAMPLE_MARKDOWN_TIMETABLE,
} from './timetableParsers';
import { SquareSpinner } from '../shared/SquareSpinner';

interface ImportTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportTimetableModal: React.FC<ImportTimetableModalProps> = ({ isOpen, onClose }) => {
  const { bulkSetOrario, getOrCreateMateria } = useSchoolStore();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editableRows, setEditableRows] = useState<ParsedTimetableRow[] | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [copiedSample, setCopiedSample] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setIsLoading(false);
    setFileName('');
    setErrorMessage(null);
    setEditableRows(null);
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setEditableRows(null);
    setFileName(file.name);

    // Validation 1: Size (Max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage('Il file supera la dimensione massima consentita di 10 MB.');
      return;
    }

    if (file.size === 0) {
      setErrorMessage('Il file caricato è vuoto (0 byte). Seleziona un file valido.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'md' && ext !== 'txt') {
      setErrorMessage('Formato non supportato. Carica un file con estensione .pdf, .md o .txt.');
      return;
    }

    setIsLoading(true);
    setLoadingText(
      ext === 'pdf'
        ? 'Estrazione del testo e riconoscimento della tabella dal PDF in corso...'
        : 'Interpretazione della tabella Markdown in corso...'
    );

    try {
      if (ext === 'pdf') {
        const buffer = await file.arrayBuffer();
        const result = await parsePdfTimetable(buffer);
        if (!result.success || result.rows.length === 0) {
          setErrorMessage(
            result.error ||
              'Nessuna tabella orario valida rilevata nel PDF. Assicurati che contenga una griglia con orari e giorni (Lun-Ven).'
          );
          setIsLoading(false);
          return;
        }
        setEditableRows(result.rows);
      } else {
        const text = await file.text();
        const result = parseMarkdownTimetable(text);
        if (!result.success || result.rows.length === 0) {
          setErrorMessage(
            result.error ||
              'Impossibile leggere la tabella Markdown. Verifica che rispetti la convenzione a colonne: | Ora | Lun | Mar | Mer | Gio | Ven |.'
          );
          setIsLoading(false);
          return;
        }
        setEditableRows(result.rows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Errore imprevisto durante l'analisi del file: ${err.message || 'Errore sconosciuto'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRowChange = (index: number, day: GiornoSettimana, value: string) => {
    if (!editableRows) return;
    const updated = [...editableRows];
    updated[index] = { ...updated[index], [day]: value };
    setEditableRows(updated);
  };

  const handleApplyImport = () => {
    if (!editableRows) return;

    const newSlots: SlotOrario[] = [];
    const days: GiornoSettimana[] = ['lun', 'mar', 'mer', 'gio', 'ven'];

    for (const row of editableRows) {
      const ora = row.ora.trim();
      if (!ora) continue;

      for (const d of days) {
        const rawMateria = row[d]?.trim();
        if (rawMateria && rawMateria !== '—' && rawMateria !== '-' && rawMateria.toLowerCase() !== 'libero') {
          // Automatic subject color assignment rule!
          // Normalize and reuse if existing, or pick first free color
          const { materia } = getOrCreateMateria(rawMateria);
          newSlots.push({
            id: `slot-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            giorno: d,
            ora,
            materiaId: materia.id,
          });
        }
      }
    }

    bulkSetOrario(newSlots, importMode);
    onClose();
    resetState();
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_MARKDOWN_TIMETABLE], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'esempio-orario.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySample = () => {
    navigator.clipboard.writeText(SAMPLE_MARKDOWN_TIMETABLE);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div className="relative w-full max-w-3xl bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#FBF1EB] text-[#B5541D]">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 id="import-title" className="text-lg font-bold text-stone-900 font-heading">
                Importa Orario Settimanale
              </h3>
              <p className="text-xs text-stone-500">
                Carica un file <strong>PDF</strong> o <strong>Markdown (.md)</strong>. Le materie verranno riconosciute e colorate in automatico.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Chiudi finestra"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* File Upload Box */}
          {!editableRows && !isLoading && (
            <div>
              <div
                onDragOver={e => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-[#B5541D] bg-[#FBF1EB]/50 scale-[0.99]'
                    : 'border-stone-300 hover:border-[#B5541D] bg-stone-50/50 hover:bg-stone-50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInput}
                  accept=".pdf,.md,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-stone-200 text-[#B5541D] mx-auto flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-stone-800">
                  Trascina qui il file oppure <span className="text-[#B5541D] underline">sfoglia</span>
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Supporta file <strong>PDF</strong> (tabelle orario scolastico) e <strong>Markdown (.md)</strong> fino a 10 MB.
                </p>
              </div>

              {/* Format guidance and downloadable sample */}
              <div className="mt-5 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600">
                <div className="flex items-center justify-between font-semibold text-stone-800 mb-2">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#B5541D]" />
                    Formato Markdown standard supportato:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySample}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-200 rounded-md hover:bg-stone-100 font-medium text-stone-700 transition-colors"
                    >
                      {copiedSample ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedSample ? 'Copiato!' : 'Copia'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSample}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-stone-200 rounded-md hover:bg-stone-100 font-medium text-stone-700 transition-colors"
                    >
                      <Download className="w-3 h-3 text-[#B5541D]" />
                      Scarica template .md
                    </button>
                  </div>
                </div>
                <pre className="p-2.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] overflow-x-auto text-stone-700 leading-relaxed">
                  {SAMPLE_MARKDOWN_TIMETABLE}
                </pre>
                <p className="mt-2 text-stone-500 italic">
                  * I trattini &quot;—&quot; indicano ore libere. Materie già presenti nel tuo database manterranno il colore assegnato; materie nuove riceveranno automaticamente il prossimo colore libero della palette.
                </p>
              </div>
            </div>
          )}

          {/* Loading Spinner */}
          {isLoading && (
            <div className="py-12">
              <SquareSpinner label={loadingText} />
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="p-4 bg-[#FDE8E9] text-[#C1272D] rounded-xl text-xs font-medium flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Attenzione:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Editable Preview */}
          {editableRows && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-[#FBF1EB] p-3 rounded-xl border border-[#B5541D]/20">
                <div className="flex items-center gap-2 text-xs text-stone-800">
                  <CheckCircle2 className="w-4 h-4 text-[#B5541D]" />
                  <span>
                    Dati estratti da <strong>{fileName}</strong>. Puoi modificare le celle direttamente prima di confermare.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditableRows(null)}
                  className="text-xs text-[#B5541D] hover:underline font-semibold"
                >
                  Carica un altro file
                </button>
              </div>

              {/* Conflict handling choice: Overwrite vs Merge */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-stone-700">Modalità di importazione:</span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                    <input
                      type="radio"
                      name="import-mode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-[#B5541D] focus:ring-[#B5541D]"
                    />
                    <span>Sovrascrivi orario attuale</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                    <input
                      type="radio"
                      name="import-mode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-[#B5541D] focus:ring-[#B5541D]"
                    />
                    <span>Unisci / aggiorna slot</span>
                  </label>
                </div>
              </div>

              {/* Editable Table */}
              <div className="overflow-x-auto rounded-xl border border-stone-200">
                <table className="w-full text-xs text-left text-stone-700 border-collapse bg-white">
                  <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                    <tr>
                      <th className="p-2.5 w-24">Ora</th>
                      {GIORNI_SETTIMANA.map(g => (
                        <th key={g.id} className="p-2.5">
                          {g.nome}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {editableRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="p-2 font-mono font-semibold text-stone-900 bg-stone-50">
                          {row.ora}
                        </td>
                        {(['lun', 'mar', 'mer', 'gio', 'ven'] as GiornoSettimana[]).map(day => (
                          <td key={day} className="p-1">
                            <input
                              type="text"
                              value={row[day]}
                              onChange={e => handleRowChange(idx, day, e.target.value)}
                              placeholder="—"
                              className="w-full px-2 py-1 bg-transparent hover:bg-stone-100 focus:bg-white border border-transparent focus:border-[#B5541D] rounded font-medium text-stone-900"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              resetState();
            }}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-xl transition-colors cursor-pointer"
          >
            Annulla
          </button>

          {editableRows && (
            <button
              type="button"
              onClick={handleApplyImport}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#B5541D] hover:bg-[#9E4616] text-white font-semibold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Conferma e Salva nell&apos;Orario</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
