export function formatRuntime(min?: number): string | undefined {
  if (!min || min <= 0) return undefined
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`
}

export function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code
  } catch {
    return code
  }
}

/** Deterministic 0..1 hash for (seed, id) – used for the "Surprise me" wildcard. */
export function seededRandom(seed: number, id: number): number {
  let x = (seed ^ (id * 2654435761)) >>> 0
  x ^= x << 13; x >>>= 0
  x ^= x >>> 17
  x ^= x << 5; x >>>= 0
  return (x % 100000) / 100000
}

export function hueFromString(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360
  return h
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
