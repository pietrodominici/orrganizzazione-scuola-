export type GiornoSettimana = 'lun' | 'mar' | 'mer' | 'gio' | 'ven';

export interface Materia {
  id: string;
  nome: string;
  colore: string; // Hex color from accessible subject palette
}

export interface SlotOrario {
  id: string;
  giorno: GiornoSettimana;
  ora: string; // e.g. "08:00-09:00"
  materiaId: string;
}

export type TipoEvento = 'verifica' | 'interrogazione';

export interface Evento {
  id: string;
  materiaId: string;
  tipo: TipoEvento;
  data: string; // YYYY-MM-DD
  note?: string;
}

export interface Compito {
  id: string;
  materiaId: string | null;
  testo: string;
  scadenza: string; // YYYY-MM-DD
  fatto: boolean;
}

export interface NotebookLink {
  id: string;
  titolo: string;
  url: string;
  materiaId: string | null;
  creatoIl: string;
  note?: string;
}

export interface UserProfile {
  id: string;
  nome: string;
  email?: string;
  scuola?: string;
  classe?: string;
  avatarUrl?: string;
  isGoogleConnected?: boolean;
}

export const GIORNI_SETTIMANA: { id: GiornoSettimana; nome: string; nomeBreve: string }[] = [
  { id: 'lun', nome: 'Lunedì', nomeBreve: 'Lun' },
  { id: 'mar', nome: 'Martedì', nomeBreve: 'Mar' },
  { id: 'mer', nome: 'Mercoledì', nomeBreve: 'Mer' },
  { id: 'gio', nome: 'Giovedì', nomeBreve: 'Gio' },
  { id: 'ven', nome: 'Venerdì', nomeBreve: 'Ven' },
];

export const ORE_DEFAULT: string[] = [
  '08:00-09:00',
  '09:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-13:00',
  '13:00-14:00',
];
