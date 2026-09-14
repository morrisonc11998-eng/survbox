export type Waypoint = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  altM: number | null;
  at: number;
};

export type FieldNote = {
  id: string;
  title: string;
  body: string;
  at: number;
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

const WPT = "survbox-wpts-v1";
const NOTES = "survbox-notes-v1";

export function loadWaypoints(): Waypoint[] {
  const rows = load<Waypoint[]>(WPT, []);
  return Array.isArray(rows) ? rows.filter((w) => w && typeof w.lat === "number") : [];
}

export function saveWaypoints(rows: Waypoint[]) {
  save(WPT, rows.slice(0, 100));
}

export function loadNotes(): FieldNote[] {
  const rows = load<FieldNote[]>(NOTES, []);
  return Array.isArray(rows) ? rows.filter((n) => n && typeof n.body === "string") : [];
}

export function saveNotes(rows: FieldNote[]) {
  save(NOTES, rows.slice(0, 80));
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
