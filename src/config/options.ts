import type { IconName } from '../components/Icon'
import type { AgeGroup, Company } from '../types'

export const COMPANY_OPTIONS: { id: Company; label: string; icon: IconName; hint: string }[] = [
  { id: 'solo', label: 'Just me', icon: 'who-solo', hint: 'Personal pick' },
  { id: 'partner', label: 'With my partner', icon: 'who-partner', hint: 'Date night' },
  { id: 'friends', label: 'With friends', icon: 'who-friends', hint: 'Movie night' },
  { id: 'family', label: 'With family', icon: 'who-family', hint: 'Something for everyone' },
  { id: 'group', label: 'With a group', icon: 'who-group', hint: 'Crowd-pleasers' },
]

export const AGE_OPTIONS: { id: AgeGroup; label: string; icon: IconName; hint: string }[] = [
  { id: 'children', label: 'Children', icon: 'age-children', hint: 'G and PG only' },
  { id: 'teens', label: 'Teenagers', icon: 'age-teens', hint: 'Up to PG-13' },
  { id: 'adults', label: 'Adults', icon: 'age-adults', hint: 'All ratings' },
  { id: 'mixed', label: 'Mixed ages / family', icon: 'age-mixed', hint: 'Up to PG-13, prefers G/PG' },
]

export const GENRE_OPTIONS = [
  'Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Thriller',
  'Science Fiction', 'Fantasy', 'Animation', 'Mystery', 'Adventure', 'Documentary',
]

export const LANGUAGE_OPTIONS: { code: string; label: string }[] = [
  { code: 'any', label: 'Any language' },
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Dutch' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
]

export const METADATA_LANGUAGES: { code: string; label: string }[] = [
  { code: 'en-US', label: 'English' },
  { code: 'nl-NL', label: 'Nederlands' },
  { code: 'fr-FR', label: 'Français' },
  { code: 'de-DE', label: 'Deutsch' },
  { code: 'es-ES', label: 'Español' },
]

/** TMDB genre ids -> canonical names (TMDB's list is stable, so no extra request is needed). */
export const TMDB_GENRES: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime', 99: 'Documentary',
  18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction', 10770: 'TV Movie', 53: 'Thriller',
  10752: 'War', 37: 'Western',
}
export const TMDB_GENRE_IDS: Record<string, number> = Object.fromEntries(
  Object.entries(TMDB_GENRES).map(([id, name]) => [name, Number(id)]),
)
