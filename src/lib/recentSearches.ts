const STORAGE_KEY = "modoo:recentSearches";
const MAX_ITEMS = 10;

type Listener = () => void;
const listeners = new Set<Listener>();
const EMPTY: string[] = [];

function readFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

let cache: string[] = typeof window === "undefined" ? EMPTY : readFromStorage();

function writeToStorage(items: string[]): void {
  cache = items;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 시크릿 모드 등 storage 접근이 막힌 환경에서는 조용히 무시한다.
  }
  for (const listener of listeners) listener();
}

export function subscribeRecentSearches(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRecentSearchesSnapshot(): string[] {
  return cache;
}

export function getRecentSearchesServerSnapshot(): string[] {
  return EMPTY;
}

export function addRecentSearch(term: string): void {
  const trimmed = term.trim();
  if (!trimmed) return;
  const next = [trimmed, ...readFromStorage().filter((v) => v !== trimmed)].slice(0, MAX_ITEMS);
  writeToStorage(next);
}

export function removeRecentSearch(term: string): void {
  writeToStorage(readFromStorage().filter((v) => v !== term));
}

export function clearRecentSearches(): void {
  writeToStorage([]);
}
