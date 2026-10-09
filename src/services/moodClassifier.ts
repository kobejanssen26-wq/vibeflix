import { MOODS, MOOD_BY_ID } from '../config/moods'
import type { Movie, MoodId } from '../types'

export interface MoodFit {
  /** 0..1 – how well the movie fits the mood. This is an app-computed estimate, not TMDB data. */
  score: number
  /** Uncapped sum of supporting genre weights – used to break ties between moods. */
  strength: number
  /** Movie genres that support the mood. */
  genreHits: string[]
  /** Mood keywords found in the synopsis / keywords. */
  keywordHits: string[]
  /** Movie genres that work against the mood. */
  avoidHits: string[]
}

const textOf = (movie: Movie) =>
  `${movie.title} ${movie.overview} ${movie.tagline ?? ''} ${movie.keywords.join(' ')}`.toLowerCase()

function hasWord(text: string, word: string): boolean {
  return new RegExp(`(^|[^a-z])${word.replace(/[-\s]/g, '[-\\s]?')}`, 'i').test(text)
}

/**
 * Maps a movie to a mood using its genres first (strong signal) and its synopsis /
 * keywords second (weak signal). "Surprise me" has no genre profile and returns 0 here;
 * the recommender handles it separately.
 */
export function moodFit(movie: Movie, moodId: MoodId): MoodFit {
  const mood = MOOD_BY_ID[moodId]
  const weights = movie.genres.map((g) => ({ g, w: mood.genreWeights[g] ?? 0 })).filter((x) => x.w > 0)
  weights.sort((a, b) => b.w - a.w)
  const genreScore = weights.length
    ? Math.min(1, weights[0].w + 0.25 * weights.slice(1).reduce((s, x) => s + x.w, 0))
    : 0

  const text = textOf(movie)
  const keywordHits = mood.keywords.filter((k) => hasWord(text, k))
  const keywordScore = Math.min(1, keywordHits.length / 2)

  const avoidHits = movie.genres.filter((g) => mood.avoidGenres.includes(g))
  const penalty = avoidHits.length ? 0.45 : 0

  const score = Math.max(0, Math.min(1, 0.78 * genreScore + 0.22 * keywordScore - penalty * (1 - genreScore * 0.5)))
  return { score, strength: weights.reduce((t, x) => t + x.w, 0), genreHits: weights.map((x) => x.g), keywordHits, avoidHits }
}

/** Moods a movie plausibly suits (inferred), best first. */
export function classifyMoods(movie: Movie, minScore = 0.45): { mood: MoodId; score: number }[] {
  return MOODS.filter((m) => m.id !== 'surprise')
    .map((m) => { const f = moodFit(movie, m.id); return { mood: m.id, score: f.score, strength: f.strength } })
    .filter((x) => x.score >= minScore)
    .sort((a, b) => b.score - a.score || b.strength - a.strength)
    .slice(0, 3)
    .map(({ mood, score }) => ({ mood, score }))
}
