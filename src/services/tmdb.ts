import { AGE_RULES } from '../config/scoring'
import { MOOD_BY_ID } from '../config/moods'
import { RELEASE_RANGES, RUNTIME_RANGES } from '../config/scoring'
import { TMDB_GENRES, TMDB_GENRE_IDS } from '../config/options'
import type { Certification, Movie, MoodId, Preferences } from '../types'
import { DAY, HOUR, cache } from './cache'
import { moodFit } from './moodClassifier'

export type TmdbErrorCode = 'network' | 'rate_limit' | 'auth' | 'not_configured' | 'http'
export class TmdbError extends Error {
  constructor(public code: TmdbErrorCode, message: string) { super(message) }
}

const IMG = 'https://image.tmdb.org/t/p'
const CERTS: Certification[] = ['G', 'PG', 'PG-13', 'R', 'NC-17']
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Params = Record<string, string | number | undefined>

async function tmdbGet<T>(path: string, params: Params = {}, retry = true): Promise<T> {
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') qs.set(k, String(v))
  let res: Response
  try {
    res = await fetch(`/api/tmdb${path}?${qs}`)
  } catch {
    throw new TmdbError('network', 'Could not reach the movie service. Check your connection.')
  }
  if (res.status === 429) {
    if (retry) {
      await sleep(Math.min(3, Number(res.headers.get('Retry-After')) || 1) * 1000)
      return tmdbGet<T>(path, params, false)
    }
    throw new TmdbError('rate_limit', 'The movie service is busy (rate limit). Try again in a moment.')
  }
  if (res.status === 503) throw new TmdbError('not_configured', 'TMDB is not configured on the server.')
  if (res.status === 401) throw new TmdbError('auth', 'The TMDB credentials were rejected.')
  if (!res.ok) throw new TmdbError('http', `The movie service returned an error (${res.status}).`)
  try {
    return (await res.json()) as T
  } catch {
    throw new TmdbError('http', 'The movie service sent an unreadable response.')
  }
}

// ── Mapping ──────────────────────────────────────────────────────────────────

interface RawMovie {
  id: number; title: string; overview?: string; tagline?: string
  poster_path?: string | null; backdrop_path?: string | null; release_date?: string
  genre_ids?: number[]; genres?: { id: number; name: string }[]
  original_language?: string; vote_average?: number; vote_count?: number; adult?: boolean; runtime?: number | null
  release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string; type: number }[] }[] }
  keywords?: { keywords: { name: string }[] }
}

function usCertification(raw: RawMovie): Certification | undefined {
  const us = raw.release_dates?.results.find((r) => r.iso_3166_1 === 'US')
  if (!us) return undefined
  // Prefer theatrical (3), then digital/physical/TV; ignore empty certifications.
  const ordered = [...us.release_dates].sort((a, b) => (a.type === 3 ? -1 : 0) - (b.type === 3 ? -1 : 0))
  const found = ordered.map((d) => d.certification.trim()).find((c) => CERTS.includes(c as Certification))
  return found as Certification | undefined
}

export function mapMovie(raw: RawMovie, detailed = false): Movie {
  const genres = raw.genres?.map((g) => g.name) ?? (raw.genre_ids ?? []).map((id) => TMDB_GENRES[id]).filter(Boolean)
  return {
    id: raw.id,
    title: raw.title,
    year: raw.release_date ? Number(raw.release_date.slice(0, 4)) || undefined : undefined,
    genres,
    runtime: raw.runtime || undefined,
    certification: detailed ? usCertification(raw) : undefined,
    overview: raw.overview ?? '',
    tagline: raw.tagline || undefined,
    posterUrl: raw.poster_path ? `${IMG}/w500${raw.poster_path}` : undefined,
    backdropUrl: raw.backdrop_path ? `${IMG}/w1280${raw.backdrop_path}` : undefined,
    originalLanguage: raw.original_language ?? 'en',
    voteAverage: raw.vote_count ? raw.vote_average : undefined,
    voteCount: raw.vote_count,
    keywords: raw.keywords?.keywords.map((k) => k.name) ?? [],
    adult: raw.adult,
    source: 'tmdb',
    detailsLoaded: detailed,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getDetails(id: number, language: string): Promise<Movie> {
  const key = `tmdb:details:${language}:${id}`
  const hit = cache.get<Movie>(key)
  if (hit) return hit
  const raw = await tmdbGet<RawMovie>(`/movie/${id}`, { language, append_to_response: 'release_dates,keywords' })
  const movie = mapMovie(raw, true)
  cache.set(key, movie, 7 * DAY)
  return movie
}

export async function getSimilar(id: number, language: string): Promise<Movie[]> {
  const key = `tmdb:similar:${language}:${id}`
  const hit = cache.get<Movie[]>(key)
  if (hit) return hit
  const data = await tmdbGet<{ results: RawMovie[] }>(`/movie/${id}/recommendations`, { language })
  const movies = data.results.filter((m) => m.poster_path && !m.adult).slice(0, 12).map((m) => mapMovie(m))
  cache.set(key, movies, DAY)
  return movies
}

export async function searchMovies(query: string, language: string): Promise<Movie[]> {
  const data = await tmdbGet<{ results: RawMovie[] }>('/search/movie', { query, language, include_adult: 'false' })
  return data.results.filter((m) => !m.adult).slice(0, 24).map((m) => mapMovie(m))
}

export async function discoverByGenre(genre: string | null, language: string, page = 1): Promise<Movie[]> {
  const data = await tmdbGet<{ results: RawMovie[] }>('/discover/movie', {
    language, page, include_adult: 'false', sort_by: 'popularity.desc', 'vote_count.gte': 500,
    with_genres: genre ? TMDB_GENRE_IDS[genre] : undefined,
  })
  return data.results.filter((m) => m.poster_path).map((m) => mapMovie(m))
}

/** Genres whose weight for a mood is high enough to be worth querying TMDB for. */
function moodGenreIds(mood: MoodId | null, minWeight = 0.5): number[] {
  if (!mood || mood === 'surprise') return []
  return Object.entries(MOOD_BY_ID[mood].genreWeights)
    .filter(([, w]) => w >= minWeight)
    .map(([g]) => TMDB_GENRE_IDS[g])
    .filter(Boolean)
}

const CANDIDATE_LIMIT = 36
const SURPRISE_GENRES = [28, 12, 35, 18, 14, 27, 9648, 10749, 878, 53, 16]

/**
 * Step 1 of the pipeline: ask TMDB for a diverse candidate pool using the filters it supports
 * (genres, language, dates, runtime, certification), pre-rank cheaply by mood fit, then load full
 * details (runtime, rating, keywords) for the best candidates. The final scoring happens in
 * recommender.ts.
 */
export async function getCandidates(prefs: Preferences, language: string, seed: number): Promise<Movie[]> {
  const base: Params = {
    language, include_adult: 'false', 'vote_count.gte': 400, 'vote_average.gte': 6.2,
    with_original_language: prefs.language !== 'any' ? prefs.language : undefined,
  }
  const rt = RUNTIME_RANGES[prefs.runtime]
  if (rt.min) base['with_runtime.gte'] = rt.min
  if (rt.max) base['with_runtime.lte'] = rt.max
  const rel = RELEASE_RANGES[prefs.releasePeriod]
  if (rel.from) base['primary_release_date.gte'] = `${rel.from}-01-01`
  if (rel.to) base['primary_release_date.lte'] = `${rel.to}-12-31`
  if (prefs.ageGroup) {
    const maxRank = Math.min(AGE_RULES[prefs.ageGroup].maxRank, prefs.maxRating === 'any' ? 4 : CERTS.indexOf(prefs.maxRating))
    if (maxRank < 4) {
      base.certification_country = 'US'
      base['certification.lte'] = CERTS[maxRank]
    }
  } else if (prefs.maxRating !== 'any') {
    base.certification_country = 'US'
    base['certification.lte'] = prefs.maxRating
  }
  const avoid = prefs.ageGroup ? AGE_RULES[prefs.ageGroup].excludeGenres.map((g) => TMDB_GENRE_IDS[g]) : []
  if (avoid.length) base.without_genres = avoid.join(',')

  const primary = moodGenreIds(prefs.mood)
  const secondary = moodGenreIds(prefs.secondaryMood)
  const chosen = prefs.genres.map((g) => TMDB_GENRE_IDS[g]).filter(Boolean)
  const surprise = prefs.mood === 'surprise'
    ? [SURPRISE_GENRES[seed % SURPRISE_GENRES.length], SURPRISE_GENRES[(seed >> 3) % SURPRISE_GENRES.length]]
    : []

  type Query = { genres: number[]; sort: string; page: number }
  const queries: Query[] = []
  const push = (genres: number[], sort: string, page = 1) => genres.length && queries.push({ genres, sort, page })
  push(primary, 'popularity.desc'); push(primary, 'popularity.desc', 2); push(primary, 'vote_average.desc')
  push(secondary, 'popularity.desc')
  push(chosen, 'popularity.desc'); push(chosen, 'vote_average.desc')
  push(surprise, 'vote_average.desc', 1 + (seed % 3)); push(surprise, 'popularity.desc', 1 + (seed % 3))
  if (!queries.length) {
    queries.push({ genres: [], sort: 'popularity.desc', page: 1 }, { genres: [], sort: 'vote_average.desc', page: 1 })
  }
  const cacheKey = `tmdb:cand:${JSON.stringify([base, queries])}`
  let pool = cache.get<Movie[]>(cacheKey)
  if (!pool) {
    const settled = await Promise.allSettled(queries.map((q) =>
      tmdbGet<{ results: RawMovie[] }>('/discover/movie', {
        ...base, sort_by: q.sort, page: q.page, with_genres: q.genres.length ? q.genres.join('|') : undefined,
      })))
    const ok = settled.filter((s): s is PromiseFulfilledResult<{ results: RawMovie[] }> => s.status === 'fulfilled')
    if (!ok.length) {
      const failure = settled.find((s): s is PromiseRejectedResult => s.status === 'rejected')
      throw failure?.reason ?? new TmdbError('http', 'No response from the movie service.')
    }
    const byId = new Map<number, Movie>()
    for (const s of ok) for (const raw of s.value.results) if (!raw.adult && !byId.has(raw.id)) byId.set(raw.id, mapMovie(raw))
    pool = [...byId.values()]
    cache.set(cacheKey, pool, HOUR)
  }

  // Cheap pre-ranking by mood fit, then fetch details only for the best candidates.
  const pre = pool
    .map((m) => {
      const a = prefs.mood && prefs.mood !== 'surprise' ? moodFit(m, prefs.mood).score : 0.5
      const b = prefs.secondaryMood ? moodFit(m, prefs.secondaryMood).score * 0.4 : 0
      const g = prefs.genres.some((x) => m.genres.includes(x)) ? 0.3 : 0
      return { m, s: a + b + g + (prefs.mood === 'surprise' ? Math.sin(seed + m.id) * 0.3 : 0) }
    })
    .sort((x, y) => y.s - x.s)
    .slice(0, CANDIDATE_LIMIT)
    .map((x) => x.m)

  const detailed: Movie[] = []
  const queue = [...pre]
  const worker = async () => {
    for (let m = queue.shift(); m; m = queue.shift()) {
      try { detailed.push(await getDetails(m.id, language)) } catch (e) {
        if (e instanceof TmdbError && (e.code === 'auth' || e.code === 'not_configured')) throw e
        // A single failed lookup should not break the whole search.
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker))
  return detailed
}
