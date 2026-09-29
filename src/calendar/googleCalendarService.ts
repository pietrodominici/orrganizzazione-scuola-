import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Evento, Materia, UserProfile } from '../data/models';

// Initialize Firebase App instance
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user && cachedAccessToken) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere il token di accesso Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

export interface CalendarEventPayload {
  summary: string;
  description: string;
  start: { date?: string; dateTime?: string; timeZone?: string };
  end: { date?: string; dateTime?: string; timeZone?: string };
  location?: string;
  reminders?: {
    useDefault: boolean;
    overrides?: { method: 'popup' | 'email'; minutes: number }[];
  };
}

/**
 * Creates an event in the user's primary Google Calendar
 */
export const createGoogleCalendarEvent = async (
  token: string,
  eventData: CalendarEventPayload
) => {
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Errore HTTP ${res.status} durante il salvataggio in Google Calendar`);
  }

  return await res.json();
};

/**
 * Transforms an internal school event into a Google Calendar event payload
 */
export const buildGoogleCalendarPayload = (
  evento: Evento,
  materia: Materia | undefined,
  user: UserProfile
): CalendarEventPayload => {
  const tipoLabel = evento.tipo === 'verifica' ? '📝 Verifica' : '🗣️ Interrogazione';
  const summary = `${tipoLabel}: ${materia?.nome || 'Materia'} (${user.classe || 'Scuola'})`;
  const description = [
    `Tipo di prova: ${evento.tipo === 'verifica' ? 'Verifica scritta' : 'Interrogazione orale'}`,
    `Materia: ${materia?.nome || 'Materia'}`,
    `Classe: ${user.classe || ''}`,
    `Scuola: ${user.scuola || ''}`,
    evento.note ? `Note / Argomenti: ${evento.note}` : null,
    `\nSincronizzato tramite app Organizza Scuola.`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    summary,
    description,
    start: {
      date: evento.data, // All-day event on the test day
    },
    end: {
      date: evento.data,
    },
    location: user.scuola || 'Scuola',
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 1 day before
        { method: 'popup', minutes: 120 },  // 2 hours before
      ],
    },
  };
};
