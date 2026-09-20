import { Materia, SlotOrario, Evento, Compito, NotebookLink, UserProfile } from './models';
import { PALETTE_MATERIE } from '../orario/subjectColors';

export const DEFAULT_MATERIE: Materia[] = [
  { id: 'mat-1', nome: 'Matematica', colore: PALETTE_MATERIE[0] }, // #2563EB
  { id: 'ita-2', nome: 'Italiano', colore: PALETTE_MATERIE[1] },   // #059669
  { id: 'ing-3', nome: 'Inglese', colore: PALETTE_MATERIE[2] },    // #7C3AED
  { id: 'sto-4', nome: 'Storia', colore: PALETTE_MATERIE[3] },     // #0D9488
  { id: 'sci-5', nome: 'Scienze Naturali', colore: PALETTE_MATERIE[4] }, // #D97706
  { id: 'fis-6', nome: 'Fisica', colore: PALETTE_MATERIE[5] },     // #4F46E5
  { id: 'fil-7', nome: 'Filosofia', colore: PALETTE_MATERIE[6] },  // #BE185D
  { id: 'art-8', nome: 'Storia dell\'Arte', colore: PALETTE_MATERIE[7] }, // #0891B2
  { id: 'edf-9', nome: 'Scienze Motorie', colore: PALETTE_MATERIE[8] },  // #65A30D
];

export const DEFAULT_ORARIO: SlotOrario[] = [
  // Lunedì
  { id: 'slot-l1', giorno: 'lun', ora: '08:00-09:00', materiaId: 'mat-1' },
  { id: 'slot-l2', giorno: 'lun', ora: '09:00-10:00', materiaId: 'mat-1' },
  { id: 'slot-l3', giorno: 'lun', ora: '10:00-11:00', materiaId: 'ita-2' },
  { id: 'slot-l4', giorno: 'lun', ora: '11:00-12:00', materiaId: 'ing-3' },
  { id: 'slot-l5', giorno: 'lun', ora: '12:00-13:00', materiaId: 'fis-6' },

  // Martedì
  { id: 'slot-m1', giorno: 'mar', ora: '08:00-09:00', materiaId: 'ita-2' },
  { id: 'slot-m2', giorno: 'mar', ora: '09:00-10:00', materiaId: 'sto-4' },
  { id: 'slot-m3', giorno: 'mar', ora: '10:00-11:00', materiaId: 'fil-7' },
  { id: 'slot-m4', giorno: 'mar', ora: '11:00-12:00', materiaId: 'mat-1' },
  { id: 'slot-m5', giorno: 'mar', ora: '12:00-13:00', materiaId: 'sci-5' },

  // Mercoledì
  { id: 'slot-me1', giorno: 'mer', ora: '08:00-09:00', materiaId: 'sci-5' },
  { id: 'slot-me2', giorno: 'mer', ora: '09:00-10:00', materiaId: 'sci-5' },
  { id: 'slot-me3', giorno: 'mer', ora: '10:00-11:00', materiaId: 'ing-3' },
  { id: 'slot-me4', giorno: 'mer', ora: '11:00-12:00', materiaId: 'art-8' },
  { id: 'slot-me5', giorno: 'mer', ora: '12:00-13:00', materiaId: 'sto-4' },

  // Giovedì
  { id: 'slot-g1', giorno: 'gio', ora: '08:00-09:00', materiaId: 'edf-9' },
  { id: 'slot-g2', giorno: 'gio', ora: '09:00-10:00', materiaId: 'edf-9' },
  { id: 'slot-g3', giorno: 'gio', ora: '10:00-11:00', materiaId: 'mat-1' },
  { id: 'slot-g4', giorno: 'gio', ora: '11:00-12:00', materiaId: 'ita-2' },
  { id: 'slot-g5', giorno: 'gio', ora: '12:00-13:00', materiaId: 'fil-7' },

  // Venerdì
  { id: 'slot-v1', giorno: 'ven', ora: '08:00-09:00', materiaId: 'fis-6' },
  { id: 'slot-v2', giorno: 'ven', ora: '09:00-10:00', materiaId: 'ita-2' },
  { id: 'slot-v3', giorno: 'ven', ora: '10:00-11:00', materiaId: 'ita-2' },
  { id: 'slot-v4', giorno: 'ven', ora: '11:00-12:00', materiaId: 'ing-3' },
  { id: 'slot-v5', giorno: 'ven', ora: '12:00-13:00', materiaId: 'art-8' },
];

// Reference current date is around 2026-09-20
export const DEFAULT_EVENTI: Evento[] = [
  {
    id: 'ev-1',
    materiaId: 'mat-1',
    tipo: 'verifica',
    data: '2026-09-22',
    note: 'Equazioni esponenziali, disequazioni e logaritmi (capitoli 3-4)',
  },
  {
    id: 'ev-2',
    materiaId: 'ita-2',
    tipo: 'interrogazione',
    data: '2026-09-24',
    note: 'Divina Commedia - Purgatorio Canti I-VI',
  },
  {
    id: 'ev-3',
    materiaId: 'sto-4',
    tipo: 'verifica',
    data: '2026-09-29',
    note: 'La rivoluzione industriale e il congresso di Vienna',
  },
  {
    id: 'ev-4',
    materiaId: 'fis-6',
    tipo: 'verifica',
    data: '2026-10-06',
    note: 'Termodinamica e primo principio',
  },
];

export const DEFAULT_COMPITI: Compito[] = [
  {
    id: 'comp-1',
    materiaId: 'mat-1',
    testo: 'Esercizi pag. 142 n. 34, 35, 39 e pag. 144 n. 52',
    scadenza: '2026-09-21',
    fatto: false,
  },
  {
    id: 'comp-2',
    materiaId: 'ita-2',
    testo: 'Leggere e parafrasare Purgatorio Canto III versi 1-60',
    scadenza: '2026-09-22',
    fatto: false,
  },
  {
    id: 'comp-3',
    materiaId: 'ing-3',
    testo: 'Essay writing: Technology in modern education (250 words)',
    scadenza: '2026-09-23',
    fatto: true,
  },
  {
    id: 'comp-4',
    materiaId: 'fil-7',
    testo: 'Mappa concettuale su Cartesio e il dubbio metodico',
    scadenza: '2026-09-25',
    fatto: false,
  },
];

export const DEFAULT_NOTEBOOKS: NotebookLink[] = [
  {
    id: 'nb-1',
    titolo: 'Notebook Fisica - Termodinamica',
    url: 'https://notebooklm.google.com/',
    materiaId: 'fis-6',
    creatoIl: '2026-09-15',
    note: 'Contiene il PDF del libro di testo capitolo 8 e gli appunti delle lezioni in classe.',
  },
  {
    id: 'nb-2',
    titolo: 'Notebook Storia Moderna',
    url: 'https://notebooklm.google.com/',
    materiaId: 'sto-4',
    creatoIl: '2026-09-17',
    note: 'Sintesi e fonti storiche per la preparazione alla verifica del 29 settembre.',
  },
];

export const DEFAULT_USER: UserProfile = {
  id: 'user-local',
  nome: 'Studente',
  scuola: 'Liceo Scientifico',
  classe: '4ª S',
  isGoogleConnected: false,
};
