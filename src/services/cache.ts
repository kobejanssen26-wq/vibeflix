import { KEYS, readJSON, removeByPrefix, writeJSON } from '../utils/storage'

interface Entry<T> { v: T; exp: number }

const memory = new Map<string, Entry<unknown>>()

/** Two-level cache (memory + localStorage) with a TTL. Failures are silent. */
export const cache = {
  get<T>(key: string): T | undefined {
    const now = Date.now()
    const m = memory.get(key) as Entry<T> | undefined
    if (m && m.exp > now) return m.v
    const stored = readJSON<Entry<T> | null>(KEYS.cachePrefix + key, null)
    if (stored && stored.exp > now) {
      memory.set(key, stored)
      return stored.v
    }
    return undefined
  },
  set<T>(key: string, value: T, ttlMs: number): void {
    const entry = { v: value, exp: Date.now() + ttlMs }
    memory.set(key, entry)
    if (!writeJSON(KEYS.cachePrefix + key, entry)) {
      // Storage is full: drop old cache entries and try once more.
      removeByPrefix(KEYS.cachePrefix)
      writeJSON(KEYS.cachePrefix + key, entry)
    }
  },
  clear(): void {
    memory.clear()
    removeByPrefix(KEYS.cachePrefix)
  },
}

export const HOUR = 60 * 60 * 1000
export const DAY = 24 * HOUR
