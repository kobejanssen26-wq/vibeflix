import type { AgeGroup, Company, Certification, ReleasePeriod, RuntimeChoice } from '../types'

/**
 * Relative importance of each scoring component. Only the weights of components that
 * apply to a search are used (unanswered optional questions don't penalise movies),
 * and the result is normalised to 0..1. Tweak freely.
 */
export const SCORE_WEIGHTS = {
  mood: 40,
  secondaryMood: 14,
  genre: 18,
  company: 8,
  age: 8,
  runtime: 5,
  quality: 5,
} as const

export type WeightKey = keyof typeof SCORE_WEIGHTS
export type Weights = Record<WeightKey, number>

export const CERT_RANK: Record<Certification, number> = { G: 0, PG: 1, 'PG-13': 2, R: 3, 'NC-17': 4 }

export const CERT_OPTIONS: Certification[] = ['G', 'PG', 'PG-13', 'R']

/** Age group -> rating limits. This is a *preference*, always shown next to the official rating. */
export const AGE_RULES: Record<AgeGroup, {
  maxRank: number
  /** Movies without a known rating are excluded (we can't verify they're suitable). */
  requireKnownRating: boolean
  excludeGenres: string[]
  /** Rating -> suitability score (0..1). */
  suitability: Partial<Record<Certification, number>>
}> = {
  children: { maxRank: 1, requireKnownRating: true, excludeGenres: ['Horror', 'Thriller', 'Crime', 'War'], suitability: { G: 1, PG: 0.8 } },
  teens: { maxRank: 2, requireKnownRating: true, excludeGenres: [], suitability: { G: 0.5, PG: 0.85, 'PG-13': 1 } },
  adults: { maxRank: 4, requireKnownRating: false, excludeGenres: [], suitability: { G: 0.5, PG: 0.75, 'PG-13': 0.9, R: 1, 'NC-17': 0.9 } },
  mixed: { maxRank: 2, requireKnownRating: true, excludeGenres: ['Horror'], suitability: { G: 1, PG: 1, 'PG-13': 0.65 } },
}

/** Viewing situation -> genres that tend to work well in that setting. */
export const COMPANY_AFFINITY: Record<Company, Record<string, number>> = {
  solo: { Thriller: 1, Mystery: 1, Drama: 0.9, 'Science Fiction': 0.9, Horror: 0.8, Documentary: 0.8, Crime: 0.8 },
  partner: { Romance: 1, Comedy: 0.8, Drama: 0.7, Thriller: 0.6, Adventure: 0.5, Mystery: 0.6 },
  friends: { Comedy: 1, Action: 0.9, Horror: 0.9, Adventure: 0.8, 'Science Fiction': 0.6, Thriller: 0.6 },
  family: { Family: 1, Animation: 1, Adventure: 0.8, Fantasy: 0.8, Comedy: 0.7, Music: 0.5 },
  group: { Comedy: 1, Action: 0.9, Adventure: 0.9, Animation: 0.6, Horror: 0.6, Music: 0.5 },
}

export const RUNTIME_RANGES: Record<RuntimeChoice, { min?: number; max?: number; label: string }> = {
  any: { label: 'No preference' },
  short: { max: 89, label: 'Under 90 minutes' },
  medium: { min: 90, max: 120, label: '90–120 minutes' },
  long: { min: 121, label: 'More than 120 minutes' },
}

export const RELEASE_RANGES: Record<ReleasePeriod, { from?: number; to?: number; label: string }> = {
  any: { label: 'Any time' },
  recent: { from: new Date().getFullYear() - 5, label: 'Last 5 years' },
  '2010s': { from: 2010, to: 2019, label: '2010s' },
  '2000s': { from: 2000, to: 2009, label: '2000s' },
  classic: { to: 1999, label: 'Before 2000' },
}

/** Below this many votes a rating is considered too unreliable to use. */
export const MIN_VOTES_FOR_QUALITY = 300
