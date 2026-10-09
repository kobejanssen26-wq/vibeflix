import type { MoodId } from '../types'

export interface MoodDefinition {
  id: MoodId
  label: string
  emoji: string
  blurb: string
  /** CSS colour used for the card glow and accents. */
  color: string
  /** Genre -> how strongly the genre signals this mood (0..1). */
  genreWeights: Record<string, number>
  /** Genres that work against the mood. */
  avoidGenres: string[]
  /** Words that, when found in the synopsis/keywords, hint at the mood. */
  keywords: string[]
  /** Sentence fragment used in explanations: "…because it {phrase}". */
  phrase: string
}

export const MOODS: MoodDefinition[] = [
  {
    id: 'funny', label: 'Funny', emoji: '😂', blurb: 'Something that makes you laugh', color: '#FFB547',
    genreWeights: { Comedy: 1, Family: 0.35, Animation: 0.3, Romance: 0.2 },
    avoidGenres: ['Horror', 'War'],
    keywords: ['hilarious', 'comedy', 'laugh', 'funny', 'prank', 'misadventure', 'chaos', 'awkward', 'absurd', 'quirky', 'wacky'],
    phrase: 'is built around humour and comic situations',
  },
  {
    id: 'romantic', label: 'Romantic', emoji: '❤️', blurb: 'Love stories and rom-coms', color: '#FF5C8A',
    genreWeights: { Romance: 1, Comedy: 0.3, Drama: 0.35, Music: 0.2 },
    avoidGenres: ['Horror', 'War'],
    keywords: ['love', 'romance', 'romantic', 'wedding', 'couple', 'relationship', 'heart', 'passion', 'soulmate', 'dating'],
    phrase: 'centres on love and relationships',
  },
  {
    id: 'thrilling', label: 'Thrilling', emoji: '😱', blurb: 'Suspense, mysteries, tension', color: '#FF6B4A',
    genreWeights: { Thriller: 1, Crime: 0.6, Mystery: 0.55, Action: 0.4, Horror: 0.2 },
    avoidGenres: ['Family', 'Animation', 'Music'],
    keywords: ['murder', 'killer', 'heist', 'conspiracy', 'chase', 'hostage', 'detective', 'investigation', 'suspense', 'danger', 'kidnapped'],
    phrase: 'keeps the tension high with suspense and danger',
  },
  {
    id: 'mindblowing', label: 'Mind-blowing', emoji: '🧠', blurb: 'Plot twists and head-scratchers', color: '#9B5CFF',
    genreWeights: { Mystery: 0.6, 'Science Fiction': 0.6, Thriller: 0.55, Drama: 0.2, Fantasy: 0.2 },
    avoidGenres: ['Family', 'Music', 'Romance'],
    keywords: ['twist', 'reality', 'dream', 'memory', 'psychological', 'identity', 'time', 'secret', 'consciousness', 'paradox', 'illusion', 'mind', 'truth'],
    phrase: 'plays with reality, secrets and twists',
  },
  {
    id: 'emotional', label: 'Emotional', emoji: '🥹', blurb: 'Touching, heartfelt stories', color: '#5CC8FF',
    genreWeights: { Drama: 1, Romance: 0.4, War: 0.3, History: 0.35, Music: 0.3, Family: 0.25 },
    avoidGenres: ['Horror', 'Action'],
    keywords: ['grief', 'loss', 'family', 'friendship', 'struggle', 'journey', 'true story', 'death', 'mother', 'father', 'hope', 'sacrifice', 'survive'],
    phrase: 'tells a moving, character-driven story',
  },
  {
    id: 'adventurous', label: 'Adventurous', emoji: '⚔️', blurb: 'Action, quests and big worlds', color: '#4ADE80',
    genreWeights: { Adventure: 1, Action: 0.8, Fantasy: 0.65, Western: 0.2, 'Science Fiction': 0.25 },
    avoidGenres: ['Documentary', 'Romance'],
    keywords: ['quest', 'journey', 'expedition', 'treasure', 'hero', 'kingdom', 'battle', 'mission', 'explore', 'dragon', 'pirate', 'jungle'],
    phrase: 'combines action, exploration and a larger-than-life quest',
  },
  {
    id: 'relaxed', label: 'Relaxed', emoji: '🌙', blurb: 'Comfortable, easy watching', color: '#7DD3C0',
    genreWeights: { Family: 0.6, Comedy: 0.5, Animation: 0.5, Romance: 0.4, Music: 0.4, Adventure: 0.2, Fantasy: 0.2 },
    avoidGenres: ['Horror', 'Thriller', 'War', 'Crime'],
    keywords: ['charming', 'heartwarming', 'cozy', 'feel-good', 'friendship', 'gentle', 'summer', 'holiday', 'delightful', 'kind'],
    phrase: 'is light, warm and easy to settle into',
  },
  {
    id: 'scary', label: 'Scary', emoji: '👻', blurb: 'Horror and the supernatural', color: '#C0392B',
    genreWeights: { Horror: 1, Thriller: 0.45, Mystery: 0.3 },
    avoidGenres: ['Family', 'Comedy', 'Music', 'Romance'],
    keywords: ['haunted', 'demon', 'ghost', 'evil', 'curse', 'possessed', 'terror', 'nightmare', 'supernatural', 'creature', 'monster'],
    phrase: 'leans on dread, the supernatural and fear',
  },
  {
    id: 'curious', label: 'Curious', emoji: '🚀', blurb: 'Sci-fi and imaginative worlds', color: '#38BDF8',
    genreWeights: { 'Science Fiction': 1, Fantasy: 0.45, Mystery: 0.25, Adventure: 0.3, Documentary: 0.3, Animation: 0.2 },
    avoidGenres: ['Horror', 'Romance'],
    keywords: ['space', 'future', 'alien', 'planet', 'robot', 'artificial', 'universe', 'technology', 'parallel', 'discovery', 'galaxy', 'scientist'],
    phrase: 'explores big ideas and imaginative worlds',
  },
  {
    id: 'surprise', label: 'Surprise me', emoji: '🎲', blurb: 'Something unexpected', color: '#F472B6',
    genreWeights: {}, avoidGenres: [], keywords: [],
    phrase: 'is a well-regarded wildcard pick',
  },
]

export const MOOD_BY_ID = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<MoodId, MoodDefinition>
