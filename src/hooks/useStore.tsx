import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { DataMode, Movie, Preferences, Recommendation, Settings } from '../types'
import { DEFAULT_PREFERENCES, isReadyToSearch, recommend, type ExclusionReason } from '../services/recommender'
import { createDemoSource, createTmdbSource, type MovieSource } from '../services/movieSource'
import { TmdbError } from '../services/tmdb'
import { cache } from '../services/cache'
import { KEYS, readJSON, removeKey, writeJSON } from '../utils/storage'

type Saved = Record<number, { movie: Movie; at: number }>

const DEFAULT_SETTINGS: Settings = { theme: 'dark', metadataLanguage: 'en-US', forceDemo: false }

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; canUseDemo: boolean }
  | { status: 'done'; results: Recommendation[]; excluded: Record<ExclusionReason, number>; considered: number }

interface Store {
  /** null while the server config is still being checked. */
  mode: DataMode | null
  tmdbAvailable: boolean
  source: MovieSource | null
  prefs: Preferences
  setPrefs: (patch: Partial<Preferences>) => void
  resetPrefs: () => void
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  favorites: Saved
  watched: Saved
  toggleFavorite: (movie: Movie) => void
  toggleWatched: (movie: Movie) => void
  search: SearchState
  runSearch: (opts?: { fresh?: boolean }) => Promise<void>
  /** Ids the user dismissed with "Show me another" in the current search. */
  dismissed: Set<number>
  dismiss: (id: number) => void
  clearAll: (what: 'favorites' | 'watched' | 'prefs' | 'cache') => void
  toast: string | null
  notify: (message: string) => void
}

const Ctx = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(() => ({ ...DEFAULT_PREFERENCES, ...readJSON<Partial<Preferences>>(KEYS.prefs, {}) }))
  const [settings, setSettingsState] = useState<Settings>(() => ({ ...DEFAULT_SETTINGS, ...readJSON<Partial<Settings>>(KEYS.settings, {}) }))
  const [favorites, setFavorites] = useState<Saved>(() => readJSON(KEYS.favorites, {}))
  const [watched, setWatched] = useState<Saved>(() => readJSON(KEYS.watched, {}))
  const [tmdbAvailable, setTmdbAvailable] = useState<boolean | null>(null)
  const [search, setSearch] = useState<SearchState>({ status: 'idle' })
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const seed = useRef(Math.floor(Math.random() * 1e6))
  const requestId = useRef(0)
  const toastTimer = useRef<number | undefined>(undefined)

  // Ask the server whether TMDB credentials exist; a static host without the server → demo mode.
  useEffect(() => {
    fetch('/api/config').then((r) => r.json()).then((c) => setTmdbAvailable(Boolean(c.tmdbConfigured))).catch(() => setTmdbAvailable(false))
  }, [])

  useEffect(() => { writeJSON(KEYS.prefs, prefs) }, [prefs])
  useEffect(() => { writeJSON(KEYS.settings, settings) }, [settings])
  useEffect(() => { writeJSON(KEYS.favorites, favorites) }, [favorites])
  useEffect(() => { writeJSON(KEYS.watched, watched) }, [watched])

  useEffect(() => {
    const apply = () => {
      const dark = settings.theme === 'dark' || (settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    }
    apply()
    if (settings.theme !== 'system') return
    const mq = matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [settings.theme])

  const mode: DataMode | null = tmdbAvailable === null ? null : tmdbAvailable && !settings.forceDemo ? 'tmdb' : 'demo'
  const source = useMemo<MovieSource | null>(() => {
    if (!mode) return null
    return mode === 'tmdb' ? createTmdbSource(settings.metadataLanguage) : createDemoSource()
  }, [mode, settings.metadataLanguage])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  const setPrefs = useCallback((patch: Partial<Preferences>) => setPrefsState((p) => ({ ...p, ...patch })), [])
  const resetPrefs = useCallback(() => setPrefsState({ ...DEFAULT_PREFERENCES }), [])
  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), [])

  const toggleIn = (setter: typeof setFavorites, movie: Movie) =>
    setter((cur) => {
      const next = { ...cur }
      if (next[movie.id]) delete next[movie.id]
      else next[movie.id] = { movie, at: Date.now() }
      return next
    })
  const toggleFavorite = useCallback((movie: Movie) => {
    const adding = !favorites[movie.id]
    toggleIn(setFavorites, movie)
    notify(adding ? `Added “${movie.title}” to favorites` : `Removed “${movie.title}” from favorites`)
  }, [favorites, notify])
  const toggleWatched = useCallback((movie: Movie) => {
    const adding = !watched[movie.id]
    toggleIn(setWatched, movie)
    notify(adding ? `Marked “${movie.title}” as watched` : `“${movie.title}” is no longer marked as watched`)
  }, [watched, notify])

  const runSearch = useCallback(async ({ fresh = true } = {}) => {
    if (!source || !isReadyToSearch(prefs)) return
    const id = ++requestId.current
    if (fresh) seed.current = Math.floor(Math.random() * 1e6)
    setDismissed(new Set())
    setSearch({ status: 'loading' })
    try {
      const candidates = await source.getCandidates(prefs, seed.current)
      const watchedIds = new Set(Object.keys(watched).map(Number))
      const out = recommend(candidates, prefs, { watched: watchedIds, seed: seed.current })
      if (id === requestId.current) setSearch({ status: 'done', ...out })
    } catch (e) {
      if (id !== requestId.current) return
      const message = e instanceof TmdbError ? e.message : 'Something went wrong while finding movies.'
      setSearch({ status: 'error', message, canUseDemo: source.mode === 'tmdb' })
    }
  }, [source, prefs, watched])

  const dismiss = useCallback((id: number) => setDismissed((d) => new Set(d).add(id)), [])

  const clearAll = useCallback((what: 'favorites' | 'watched' | 'prefs' | 'cache') => {
    if (what === 'favorites') { setFavorites({}); removeKey(KEYS.favorites) }
    if (what === 'watched') { setWatched({}); removeKey(KEYS.watched) }
    if (what === 'prefs') { setPrefsState({ ...DEFAULT_PREFERENCES }); setSearch({ status: 'idle' }); removeKey(KEYS.prefs) }
    if (what === 'cache') cache.clear()
  }, [])

  const value: Store = {
    mode, tmdbAvailable: Boolean(tmdbAvailable), source, prefs, setPrefs, resetPrefs, settings, setSettings,
    favorites, watched, toggleFavorite, toggleWatched, search, runSearch, dismissed, dismiss, clearAll, toast, notify,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
