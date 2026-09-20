import { GiornoSettimana, SlotOrario, Materia } from '../data/models';
import { normalizeNomeMateria } from './subjectColors';

export interface ParsedTimetableRow {
  ora: string;
  lun: string;
  mar: string;
  mer: string;
  gio: string;
  ven: string;
}

export interface ParseResult {
  success: boolean;
  rows: ParsedTimetableRow[];
  detectedSlots: { giorno: GiornoSettimana; ora: string; materiaNome: string }[];
  uniqueSubjectNames: string[];
  warnings: string[];
  error?: string;
}

const DAY_MAP: Record<string, GiornoSettimana> = {
  lun: 'lun',
  lunedì: 'lun',
  lunedi: 'lun',
  mar: 'mar',
  martedì: 'mar',
  martedi: 'mar',
  mer: 'mer',
  mercoledì: 'mer',
  mercoledi: 'mer',
  gio: 'gio',
  giovedì: 'gio',
  giovedi: 'gio',
  ven: 'ven',
  venerdì: 'ven',
  venerdi: 'ven',
};

export const SAMPLE_MARKDOWN_TIMETABLE = `| Ora | Lun | Mar | Mer | Gio | Ven |
|---|---|---|---|---|---|
| 08:00-09:00 | Matematica | Italiano | Storia | Matematica | Inglese |
| 09:00-10:00 | Italiano | Matematica | Inglese | Storia | Educazione Fisica |
| 10:00-11:00 | Scienze | Filosofia | Matematica | Fisica | Italiano |
| 11:00-12:00 | Fisica | Scienze | Arte | Italiano | Storia |
| 12:00-13:00 | Filosofia | Arte | Educazione Fisica | Scienze | Matematica |
`;

/**
 * Parses Markdown table format
 */
export function parseMarkdownTimetable(text: string): ParseResult {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && l.startsWith('|') && l.endsWith('|'));

  if (lines.length < 3) {
    return {
      success: false,
      rows: [],
      detectedSlots: [],
      uniqueSubjectNames: [],
      warnings: [],
      error: 'La tabella Markdown non contiene abbastanza righe valide (intestazione, separatore e almeno una riga orario).',
    };
  }

  // Parse header
  const headerCells = lines[0]
    .slice(1, -1)
    .split('|')
    .map(c => c.trim().toLowerCase());

  if (headerCells.length < 2) {
    return {
      success: false,
      rows: [],
      detectedSlots: [],
      uniqueSubjectNames: [],
      warnings: [],
      error: 'Formato intestazione Markdown non valido. Attese colonne: Ora, Lun, Mar, Mer, Gio, Ven.',
    };
  }

  // Map header column indices to days
  const colToDay: Record<number, GiornoSettimana> = {};
  for (let i = 1; i < headerCells.length; i++) {
    const rawHeader = headerCells[i].replace(/[^a-zàèéìòù]/g, '');
    for (const [key, val] of Object.entries(DAY_MAP)) {
      if (rawHeader.startsWith(key)) {
        colToDay[i] = val;
        break;
      }
    }
  }

  const rows: ParsedTimetableRow[] = [];
  const detectedSlots: { giorno: GiornoSettimana; ora: string; materiaNome: string }[] = [];
  const uniqueNamesSet = new Set<string>();

  // Skip header and separator (lines[0] and lines[1])
  for (let idx = 2; idx < lines.length; idx++) {
    const rawCells = lines[idx].slice(1, -1).split('|').map(c => c.trim());
    if (rawCells.length < 2) continue;

    const ora = rawCells[0];
    const rowObj: ParsedTimetableRow = {
      ora,
      lun: '',
      mar: '',
      mer: '',
      gio: '',
      ven: '',
    };

    for (let c = 1; c < rawCells.length; c++) {
      const subject = rawCells[c];
      const day = colToDay[c];
      if (!day) continue;

      if (subject && subject !== '—' && subject !== '-' && subject.toLowerCase() !== 'libero') {
        rowObj[day] = subject;
        detectedSlots.push({ giorno: day, ora, materiaNome: subject });
        uniqueNamesSet.add(subject);
      }
    }

    rows.push(rowObj);
  }

  return {
    success: rows.length > 0,
    rows,
    detectedSlots,
    uniqueSubjectNames: Array.from(uniqueNamesSet),
    warnings: rows.length === 0 ? ['Nessuna riga valida trovata nella tabella Markdown.'] : [],
  };
}

/**
 * Client-side PDF text extraction and tabular timetable parsing
 */
export async function parsePdfTimetable(arrayBuffer: ArrayBuffer): Promise<ParseResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    // Set worker
    if (pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }

    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;

    if (pdf.numPages === 0) {
      return {
        success: false,
        rows: [],
        detectedSlots: [],
        uniqueSubjectNames: [],
        warnings: [],
        error: 'Il documento PDF non contiene pagine.',
      };
    }

    let extractedFullText = '';
    const textItems: { text: string; x: number; y: number }[] = [];

    for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 3); pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      textContent.items.forEach((item: any) => {
        if ('str' in item && item.str.trim()) {
          const tx = item.transform ? item.transform[4] : 0;
          const ty = item.transform ? item.transform[5] : 0;
          textItems.push({ text: item.str.trim(), x: tx, y: ty });
          extractedFullText += item.str + '\n';
        }
      });
    }

    if (textItems.length === 0) {
      return {
        success: false,
        rows: [],
        detectedSlots: [],
        uniqueSubjectNames: [],
        warnings: [],
        error: 'Nessun testo selezionabile trovato nel PDF (potrebbe essere un\'immagine scansionata).',
      };
    }

    // Try detecting markdown-style tables or line-by-line grids
    const mdResult = parseMarkdownTimetable(extractedFullText);
    if (mdResult.success && mdResult.detectedSlots.length > 0) {
      return mdResult;
    }

    // Tolerant parser: cluster text by Y coordinates (lines) and X coordinates (columns)
    // Find hour patterns like "08:00", "8:00", "08:00-09:00", "1^ ora", "1a ora"
    const hourPattern = /(\d{1,2}[:.]\d{2}(?:\s*-\s*\d{1,2}[:.]\d{2})?|\d{1,2}\s*ª?\s*ora)/i;

    // Group items by Y coordinate (rounded to 8px)
    const linesMap = new Map<number, { text: string; x: number }[]>();
    textItems.forEach(item => {
      const roundedY = Math.round(item.y / 10) * 10;
      if (!linesMap.has(roundedY)) linesMap.set(roundedY, []);
      linesMap.get(roundedY)!.push({ text: item.text, x: item.x });
    });

    // Sort lines by Y descending (PDF coordinates origin is bottom-left)
    const sortedYs = Array.from(linesMap.keys()).sort((a, b) => b - a);

    const rows: ParsedTimetableRow[] = [];
    const detectedSlots: { giorno: GiornoSettimana; ora: string; materiaNome: string }[] = [];
    const uniqueNames = new Set<string>();

    // Detect header row containing lun, mar, mer, gio, ven
    let dayXCoords: { day: GiornoSettimana; x: number }[] = [];
    for (const y of sortedYs) {
      const line = linesMap.get(y)!;
      const daysFound = line
        .map(it => {
          const cleaned = it.text.toLowerCase().replace(/[^a-zàèéìòù]/g, '');
          for (const [k, d] of Object.entries(DAY_MAP)) {
            if (cleaned.startsWith(k)) return { day: d, x: it.x };
          }
          return null;
        })
        .filter((d): d is { day: GiornoSettimana; x: number } => d !== null);

      if (daysFound.length >= 3) {
        dayXCoords = daysFound.sort((a, b) => a.x - b.x);
        break;
      }
    }

    // Fallback if no day header coordinates found
    if (dayXCoords.length < 3) {
      dayXCoords = [
        { day: 'lun', x: 100 },
        { day: 'mar', x: 200 },
        { day: 'mer', x: 300 },
        { day: 'gio', x: 400 },
        { day: 'ven', x: 500 },
      ];
    }

    let defaultHourIndex = 1;

    for (const y of sortedYs) {
      const line = linesMap.get(y)!.sort((a, b) => a.x - b.x);
      const joinedLine = line.map(i => i.text).join(' ');

      // Check if line looks like a header
      if (joinedLine.toLowerCase().includes('lunedì') || joinedLine.toLowerCase().includes('lunedi')) {
        continue;
      }

      // Check if line contains hour or slot items
      const hourMatch = joinedLine.match(hourPattern);
      const ora = hourMatch ? hourMatch[0] : `${defaultHourIndex + 7}:00-${defaultHourIndex + 8}:00`;

      const rowObj: ParsedTimetableRow = {
        ora,
        lun: '',
        mar: '',
        mer: '',
        gio: '',
        ven: '',
      };

      let hasData = false;

      line.forEach(item => {
        if (item.text === hourMatch?.[0]) return;
        // Match item.x to closest day
        let closestDay = dayXCoords[0].day;
        let minDiff = Infinity;
        dayXCoords.forEach(d => {
          const diff = Math.abs(item.x - d.x);
          if (diff < minDiff) {
            minDiff = diff;
            closestDay = d.day;
          }
        });

        if (item.text.length > 1 && !/^\d+$/.test(item.text) && item.text !== '—') {
          rowObj[closestDay] = rowObj[closestDay] ? `${rowObj[closestDay]} ${item.text}` : item.text;
          hasData = true;
          uniqueNames.add(item.text);
          detectedSlots.push({
            giorno: closestDay,
            ora,
            materiaNome: item.text,
          });
        }
      });

      if (hasData) {
        rows.push(rowObj);
        defaultHourIndex++;
      }
    }

    return {
      success: rows.length > 0,
      rows,
      detectedSlots,
      uniqueSubjectNames: Array.from(uniqueNames),
      warnings:
        rows.length > 0
          ? ['Parsing completato. Controlla l\'anteprima editabile prima di confermare l\'importazione.']
          : ['Riconoscimento parziale: controlla o modifica i dati nella tabella sottostante.'],
    };
  } catch (err: any) {
    console.error('Errore durante il parsing del PDF:', err);
    return {
      success: false,
      rows: [],
      detectedSlots: [],
      uniqueSubjectNames: [],
      warnings: [],
      error: `Impossibile analizzare il file PDF: ${err.message || 'formato non supportato o corrotto'}.`,
    };
  }
}
