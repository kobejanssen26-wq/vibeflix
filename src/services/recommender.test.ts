import { describe, expect, it } from 'vitest'
import { DEMO_MOVIES } from '../data/demoMovies'
import type { Preferences } from '../types'
import { toggleMood } from '../utils/mood'
import { classifyMoods } from './moodClassifier'
import { DEFAULT_PREFERENCES, exclusionReason, recommend } from './recommender'

const prefs = (p: Partial<Preferences>): Preferences => ({ ...DEFAULT_PREFERENCES, company: 'friends', ageGroup: 'adults', ...p })
const ctx = { watched: new Set<number>(), seed: 1 }
const run = (p: Partial<Preferences>, watched = new Set<number>()) => recommend(DEMO_MOVIES, prefs(p), { ...ctx, watched })
const titles = (p: Partial<Preferences>, n = 5) => run(p).results.slice(0, n).map((r) => r.movie.title)

describe('recommendation engine', () => {
  it('responds to the selected mood (different moods → different top picks)', () => {
    const funny = titles({ mood: 'funny' })
    const scary = titles({ mood: 'scary' })
    expect(funny).not.toEqual(scary)
    const top = run({ mood: 'scary' }).results[0].movie
    expect(top.genres).toContain('Horror')
    expect(run({ mood: 'funny' }).results[0].movie.genres).toContain('Comedy')
    expect(run({ mood: 'curious' }).results[0].movie.genres).toContain('Science Fiction')
  })

  it('blends a secondary mood', () => {
    const base = run({ mood: 'funny' }).results.slice(0, 8).map((r) => r.movie.title)
    const blended = run({ mood: 'funny', secondaryMood: 'romantic' }).results.slice(0, 8).map((r) => r.movie.title)
    expect(blended).not.toEqual(base)
    expect(run({ mood: 'funny', secondaryMood: 'romantic' }).results[0].movie.genres).toEqual(expect.arrayContaining(['Comedy', 'Romance']))
  })

  it('never recommends unsuitable ratings for children', () => {
    for (const mood of ['scary', 'thrilling', 'funny', 'adventurous'] as const) {
      const { results } = run({ mood, ageGroup: 'children' })
      expect(results.length).toBeGreaterThan(0)
      for (const r of results) {
        expect(['G', 'PG']).toContain(r.movie.certification)
        expect(r.movie.genres).not.toContain('Horror')
      }
    }
  })

  it('excludes movies with an unknown rating for mixed/teen groups but not for adults', () => {
    const trainToBusan = DEMO_MOVIES.find((m) => m.title === 'Train to Busan')!
    expect(trainToBusan.certification).toBeUndefined()
    expect(exclusionReason(trainToBusan, prefs({ ageGroup: 'teens' }), ctx)).toBe('age')
    expect(exclusionReason(trainToBusan, prefs({ ageGroup: 'adults' }), ctx)).toBeNull()
  })

  it('applies runtime, language, period and rating filters', () => {
    expect(run({ mood: 'funny', runtime: 'short' }).results.every((r) => r.movie.runtime! < 90)).toBe(true)
    expect(run({ mood: 'funny', runtime: 'long' }).results.every((r) => r.movie.runtime! > 120)).toBe(true)
    expect(run({ mood: 'funny', runtime: 'medium' }).results.every((r) => r.movie.runtime! >= 90 && r.movie.runtime! <= 120)).toBe(true)
    expect(run({ mood: 'emotional', language: 'ja' }).results.every((r) => r.movie.originalLanguage === 'ja')).toBe(true)
    expect(run({ mood: 'funny', releasePeriod: 'classic' }).results.every((r) => r.movie.year! < 2000)).toBe(true)
    expect(run({ mood: 'funny', maxRating: 'PG' }).results.every((r) => ['G', 'PG'].includes(r.movie.certification!))).toBe(true)
  })

  it('excludes watched movies only when requested', () => {
    const first = run({ mood: 'funny' }).results[0].movie
    const watched = new Set([first.id])
    expect(run({ mood: 'funny', excludeWatched: true }, watched).results.some((r) => r.movie.id === first.id)).toBe(false)
    expect(run({ mood: 'funny', excludeWatched: false }, watched).results.some((r) => r.movie.id === first.id)).toBe(true)
  })

  it('ranks movies matching the chosen genres higher', () => {
    const top = run({ mood: 'adventurous', genres: ['Animation'] }).results.slice(0, 3)
    expect(top.every((r) => r.movie.genres.includes('Animation'))).toBe(true)
  })

  it('returns sorted scores in 0..1 with explanations based on movie data', () => {
    const { results } = run({ mood: 'mindblowing', genres: ['Science Fiction'] })
    for (let i = 1; i < results.length; i++) expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0)
      expect(r.score).toBeLessThanOrEqual(1)
    }
    expect(results[0].summary).toContain('mind-blowing')
    expect(results[0].reasons.some((x) => x.kind === 'verified')).toBe(true)
  })

  it('surprise mode is deterministic per seed and varies across seeds', () => {
    const a = recommend(DEMO_MOVIES, prefs({ mood: 'surprise' }), { ...ctx, seed: 1 }).results.slice(0, 5).map((r) => r.movie.id)
    const a2 = recommend(DEMO_MOVIES, prefs({ mood: 'surprise' }), { ...ctx, seed: 1 }).results.slice(0, 5).map((r) => r.movie.id)
    const b = recommend(DEMO_MOVIES, prefs({ mood: 'surprise' }), { ...ctx, seed: 999 }).results.slice(0, 5).map((r) => r.movie.id)
    expect(a).toEqual(a2)
    expect(a).not.toEqual(b)
  })

  it('returns an empty list (not an error) when requirements are impossible', () => {
    const out = run({ mood: 'scary', ageGroup: 'children', genres: ['Horror'], language: 'ko' })
    expect(out.results).toEqual([])
    expect(out.excluded.age + out.excluded.language).toBeGreaterThan(0)
  })

  it('classifies inferred moods from genres', () => {
    const shining = DEMO_MOVIES.find((m) => m.title === 'The Shining')!
    expect(classifyMoods(shining)[0].mood).toBe('scary')
  })
})

describe('mood selection', () => {
  it('selects main, then secondary; deselects; promotes secondary', () => {
    let s = toggleMood({ mood: null, secondaryMood: null }, 'funny')
    expect(s).toEqual({ mood: 'funny', secondaryMood: null })
    s = toggleMood(s, 'romantic')
    expect(s).toEqual({ mood: 'funny', secondaryMood: 'romantic' })
    s = toggleMood(s, 'funny')
    expect(s).toEqual({ mood: 'romantic', secondaryMood: null })
    s = toggleMood(s, 'romantic')
    expect(s).toEqual({ mood: null, secondaryMood: null })
  })
  it('surprise replaces everything and is never secondary', () => {
    expect(toggleMood({ mood: 'funny', secondaryMood: 'scary' }, 'surprise')).toEqual({ mood: 'surprise', secondaryMood: null })
    expect(toggleMood({ mood: 'surprise', secondaryMood: null }, 'funny')).toEqual({ mood: 'funny', secondaryMood: null })
  })
})
