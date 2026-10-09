import {
  AGE_RULES, CERT_RANK, COMPANY_AFFINITY, MIN_VOTES_FOR_QUALITY, RELEASE_RANGES, RUNTIME_RANGES,
  SCORE_WEIGHTS, type Weights,
} from '../config/scoring'
import { MOOD_BY_ID } from '../config/moods'
import { AGE_OPTIONS, COMPANY_OPTIONS } from '../config/options'
import type { Movie, Preferences, Reason, Recommendation, ScoreComponent } from '../types'
import { formatRuntime, joinList, seededRandom } from '../utils/format'
import { moodFit } from './moodClassifier'

export interface RecommendContext {
  watched: ReadonlySet<number>
  /** Seed for the "Surprise me" wildcard so results are stable within one search. */
  seed: number
  weights?: Weights
}

export type ExclusionReason = 'watched' | 'age' | 'rating' | 'runtime' | 'period' | 'language'

/** Returns why a movie violates an explicit requirement, or null when it passes. */
export function exclusionReason(movie: Movie, prefs: Preferences, ctx: Pick<RecommendContext, 'watched'>): ExclusionReason | null {
  if (prefs.excludeWatched && ctx.watched.has(movie.id)) return 'watched'
  if (movie.adult) return 'age'

  const rank = movie.certification ? CERT_RANK[movie.certification] : undefined
  if (prefs.ageGroup) {
    const rule = AGE_RULES[prefs.ageGroup]
    if (rank === undefined && rule.requireKnownRating) return 'age'
    if (rank !== undefined && rank > rule.maxRank) return 'age'
    if (movie.genres.some((g) => rule.excludeGenres.includes(g))) return 'age'
  }
  if (prefs.maxRating !== 'any') {
    if (rank === undefined || rank > CERT_RANK[prefs.maxRating]) return 'rating'
  }

  if (prefs.runtime !== 'any' && movie.runtime) {
    const r = RUNTIME_RANGES[prefs.runtime]
    if ((r.min !== undefined && movie.runtime < r.min) || (r.max !== undefined && movie.runtime > r.max)) return 'runtime'
  }
  if (prefs.releasePeriod !== 'any' && movie.year) {
    const r = RELEASE_RANGES[prefs.releasePeriod]
    if ((r.from !== undefined && movie.year < r.from) || (r.to !== undefined && movie.year > r.to)) return 'period'
  }
  if (prefs.language !== 'any' && movie.originalLanguage !== prefs.language) return 'language'
  return null
}

export function scoreMovie(movie: Movie, prefs: Preferences, ctx: Pick<RecommendContext, 'seed' | 'weights'>): Recommendation {
  const W = ctx.weights ?? SCORE_WEIGHTS
  const components: ScoreComponent[] = []
  const reasons: Reason[] = []
  const add = (key: string, label: string, value: number, weight: number) =>
    components.push({ key, label, value: Math.max(0, Math.min(1, value)), weight })

  const mood = prefs.mood ? MOOD_BY_ID[prefs.mood] : null
  const quality = movie.voteAverage !== undefined && (movie.voteCount ?? 0) >= MIN_VOTES_FOR_QUALITY
    ? Math.max(0, Math.min(1, (movie.voteAverage - 5.5) / 3))
    : undefined

  // ── Main mood ────────────────────────────────────────────────────────────────
  let summary = ''
  if (mood && mood.id !== 'surprise') {
    const fit = moodFit(movie, mood.id)
    add('mood', `${mood.label} mood`, fit.score, W.mood)
    const bits: string[] = []
    const shown = fit.genreHits.slice(0, 3)
    if (shown.length) bits.push(`genres ${joinList(shown)}`)
    if (fit.keywordHits.length) bits.push(`synopsis themes like “${fit.keywordHits.slice(0, 3).join('”, “')}”`)
    reasons.push({
      kind: 'inferred',
      text: bits.length
        ? `Fits your ${mood.label.toLowerCase()} mood based on its ${bits.join(' and ')}.`
        : `Only a weak ${mood.label.toLowerCase()} signal in the available data.`,
    })
    summary = `This movie matches your ${mood.label.toLowerCase()} mood because it ${mood.phrase}`
      + (shown.length ? ` – its genres are ${joinList(movie.genres.slice(0, 3))}.` : '.')
  } else if (mood?.id === 'surprise') {
    const jitter = seededRandom(ctx.seed, movie.id)
    add('mood', 'Surprise factor', 0.6 * (quality ?? 0.5) + 0.4 * jitter, W.mood)
    reasons.push({
      kind: 'inferred',
      text: quality !== undefined
        ? 'A wildcard: well-rated by viewers and picked with a random twist for this search.'
        : 'A wildcard picked with a random twist for this search.',
    })
    summary = `A surprise pick: ${movie.genres.length ? joinList(movie.genres.slice(0, 3)) + ' – ' : ''}not chosen for any single mood, but for variety.`
  }

  // ── Secondary mood ───────────────────────────────────────────────────────────
  if (prefs.secondaryMood && prefs.secondaryMood !== 'surprise' && mood?.id !== 'surprise') {
    const m2 = MOOD_BY_ID[prefs.secondaryMood]
    const fit = moodFit(movie, m2.id)
    add('secondaryMood', `${m2.label} (second mood)`, fit.score, W.secondaryMood)
    if (fit.score >= 0.35) {
      reasons.push({ kind: 'inferred', text: `Also has a ${m2.label.toLowerCase()} side${fit.genreHits.length ? ` (${joinList(fit.genreHits.slice(0, 2))})` : ''}.` })
      summary += ` It also adds a touch of ${m2.label.toLowerCase()}.`
    }
  }

  // ── Genres ───────────────────────────────────────────────────────────────────
  if (prefs.genres.length) {
    const matched = movie.genres.filter((g) => prefs.genres.includes(g))
    add('genre', 'Genre preference', matched.length ? 0.6 + 0.4 * (matched.length / prefs.genres.length) : 0, W.genre)
    if (matched.length) reasons.push({ kind: 'verified', text: `Genre match: ${joinList(matched)}.` })
  }

  // ── Viewing situation ────────────────────────────────────────────────────────
  if (prefs.company) {
    const aff = COMPANY_AFFINITY[prefs.company]
    const best = movie.genres.map((g) => ({ g, v: aff[g] ?? 0 })).sort((a, b) => b.v - a.v)[0]
    add('company', 'Viewing situation', best?.v ?? 0.15, W.company)
    if (best && best.v >= 0.7) {
      const label = COMPANY_OPTIONS.find((c) => c.id === prefs.company)!.label.toLowerCase()
      reasons.push({ kind: 'inferred', text: `${best.g} tends to work well when watching ${label === 'just me' ? 'on your own' : label}.` })
    }
  }

  // ── Age suitability ──────────────────────────────────────────────────────────
  if (prefs.ageGroup) {
    const rule = AGE_RULES[prefs.ageGroup]
    const value = movie.certification ? rule.suitability[movie.certification] ?? 0.3 : 0.4
    add('age', 'Age suitability', value, W.age)
    const ageLabel = AGE_OPTIONS.find((a) => a.id === prefs.ageGroup)!.label.toLowerCase()
    reasons.push({
      kind: 'verified',
      text: movie.certification
        ? `Officially rated ${movie.certification} (US) – within your ${ageLabel} preference.`
        : 'No official rating available for this movie.',
    })
  }

  // ── Runtime ──────────────────────────────────────────────────────────────────
  if (prefs.runtime !== 'any') {
    add('runtime', 'Runtime', movie.runtime ? 1 : 0.5, W.runtime)
    if (movie.runtime) reasons.push({ kind: 'verified', text: `Runs ${formatRuntime(movie.runtime)} – fits “${RUNTIME_RANGES[prefs.runtime].label.toLowerCase()}”.` })
  }

  // ── Quality (tie-breaker, only with enough votes) ────────────────────────────
  if (quality !== undefined) {
    add('quality', 'Audience rating', quality, W.quality)
    reasons.push({ kind: 'verified', text: `Audience rating ${movie.voteAverage!.toFixed(1)}/10 from ${movie.voteCount!.toLocaleString()} votes.` })
  }

  const totalWeight = components.reduce((s, c) => s + c.weight, 0)
  const score = totalWeight ? components.reduce((s, c) => s + c.value * c.weight, 0) / totalWeight : 0
  return { movie, score, components, summary: summary || 'Selected from the available catalogue.', reasons }
}

export interface RecommendOutcome {
  results: Recommendation[]
  excluded: Record<ExclusionReason, number>
  considered: number
}

/** Filters out movies that break explicit requirements, scores the rest, and ranks them. */
export function recommend(movies: Movie[], prefs: Preferences, ctx: RecommendContext): RecommendOutcome {
  const excluded: Record<ExclusionReason, number> = { watched: 0, age: 0, rating: 0, runtime: 0, period: 0, language: 0 }
  const seen = new Set<number>()
  const results: Recommendation[] = []
  for (const movie of movies) {
    if (seen.has(movie.id)) continue
    seen.add(movie.id)
    const why = exclusionReason(movie, prefs, ctx)
    if (why) { excluded[why]++; continue }
    results.push(scoreMovie(movie, prefs, ctx))
  }
  results.sort((a, b) => b.score - a.score || (b.movie.voteAverage ?? 0) - (a.movie.voteAverage ?? 0))
  return { results, excluded, considered: seen.size }
}

export const DEFAULT_PREFERENCES: Preferences = {
  mood: null, secondaryMood: null, company: null, ageGroup: null, genres: [],
  runtime: 'any', language: 'any', maxRating: 'any', releasePeriod: 'any', excludeWatched: true,
}

export function isReadyToSearch(prefs: Preferences): boolean {
  return Boolean(prefs.mood && prefs.company && prefs.ageGroup)
}
