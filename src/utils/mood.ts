import type { MoodId } from '../types'

export interface MoodSelection { mood: MoodId | null; secondaryMood: MoodId | null }

/**
 * Click behaviour of the mood grid:
 * - first pick becomes the main mood, a second pick becomes the optional secondary mood
 * - clicking a selected mood deselects it (the secondary mood is promoted if the main one is removed)
 * - "Surprise me" is always a main mood on its own; it can't be combined with another mood
 */
export function toggleMood(sel: MoodSelection, id: MoodId): MoodSelection {
  const { mood, secondaryMood } = sel
  if (id === mood) return { mood: secondaryMood, secondaryMood: null }
  if (id === secondaryMood) return { mood, secondaryMood: null }
  if (id === 'surprise') return { mood: 'surprise', secondaryMood: null }
  if (!mood || mood === 'surprise') return { mood: id, secondaryMood: null }
  return { mood, secondaryMood: id }
}
