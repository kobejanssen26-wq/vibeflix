import { DEMO_MOVIES } from '../data/demoMovies'
import type { DataMode, Movie, Preferences } from '../types'
import * as tmdb from './tmdb'

/** One interface, two implementations: live TMDB data or the built-in demo catalogue. */
export interface MovieSource {
  mode: DataMode
  getCandidates(prefs: Preferences, seed: number): Promise<Movie[]>
  getDetails(movie: Movie): Promise<Movie>
  getById(id: number): Promise<Movie | undefined>
  getSimilar(movie: Movie): Promise<Movie[]>
  browse(opts: { genre: string | null; query: string }): Promise<Movie[]>
}

export function createDemoSource(): MovieSource {
  return {
    mode: 'demo',
    // The whole catalogue is small, so it is all candidates; the recommender does the filtering.
    getCandidates: async () => DEMO_MOVIES,
    getDetails: async (m) => m,
    getById: async (id) => DEMO_MOVIES.find((m) => m.id === id),
    getSimilar: async (movie) => {
      const overlap = (m: Movie) => m.genres.filter((g) => movie.genres.includes(g)).length
      return DEMO_MOVIES.filter((m) => m.id !== movie.id)
        .map((m) => ({ m, s: overlap(m) + (m.originalLanguage === movie.originalLanguage ? 0.2 : 0) }))
        .filter((x) => x.s >= 1)
        .sort((a, b) => b.s - a.s)
        .slice(0, 8)
        .map((x) => x.m)
    },
    browse: async ({ genre, query }) => {
      const q = query.trim().toLowerCase()
      return DEMO_MOVIES.filter((m) => (!genre || m.genres.includes(genre)) && (!q || m.title.toLowerCase().includes(q)))
    },
  }
}

export function createTmdbSource(language: string): MovieSource {
  return {
    mode: 'tmdb',
    getCandidates: (prefs, seed) => tmdb.getCandidates(prefs, language, seed),
    getDetails: (m) => (m.detailsLoaded ? Promise.resolve(m) : tmdb.getDetails(m.id, language)),
    getById: (id) => tmdb.getDetails(id, language),
    getSimilar: (m) => tmdb.getSimilar(m.id, language),
    browse: ({ genre, query }) => (query.trim() ? tmdb.searchMovies(query.trim(), language) : tmdb.discoverByGenre(genre, language)),
  }
}
