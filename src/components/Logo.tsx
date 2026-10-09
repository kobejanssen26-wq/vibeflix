/** Brand name lives in one place so it is easy to change. */
export const APP_NAME = 'VibeFlix'
export const TAGLINE = 'Your mood. Your movie.'

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="11" fill="var(--c-card)" stroke="var(--c-border-strong)" />
      <path d="M8 24c3.500-9 6-9 8.500 0s5 9 8.500 0 4-6 7-6" fill="none" stroke="var(--c-secondary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 12.500v15l12.500-7.500z" fill="var(--c-primary)" />
    </svg>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span className="logo">
      <LogoMark size={size} />
      <span className="logo__word">Vibe<b>Flix</b></span>
    </span>
  )
}
