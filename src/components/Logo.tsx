/** Brand name lives in one place so it is easy to change. */
export const APP_NAME = 'VibeFlix'
export const TAGLINE = 'Your mood. Your movie.'

/** A ticket stub with a play-triangle punched out of it. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M3 8h34v8.500a3.500 3.500 0 0 0 0 7V32H3v-8.500a3.500 3.500 0 0 0 0-7z" fill="var(--c-primary)" />
      <path d="M16 14v12l10.500-6z" fill="var(--c-bg)" />
    </svg>
  )
}

export function Logo({ size = 30 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo__word">VIBE<b>FLIX</b></span>
    </span>
  )
}
