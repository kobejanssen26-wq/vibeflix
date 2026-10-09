/** localStorage wrapper that never throws (private mode, quota, blocked storage). */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export function removeKey(key: string): void {
  try { localStorage.removeItem(key) } catch { /* ignore */ }
}

export function removeByPrefix(prefix: string): void {
  try {
    Object.keys(localStorage).filter((k) => k.startsWith(prefix)).forEach((k) => localStorage.removeItem(k))
  } catch { /* ignore */ }
}

export const KEYS = {
  prefs: 'vibeflix:prefs',
  favorites: 'vibeflix:favorites',
  watched: 'vibeflix:watched',
  settings: 'vibeflix:settings',
  cachePrefix: 'vibeflix:cache:',
} as const
