import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />
}

export function Message({ icon = 'info', title, children, actions }: { icon?: IconName; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="message" role="status">
      <span className="message__icon"><Icon name={icon} size={28} /></span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
      {actions && <div className="message__actions">{actions}</div>}
    </div>
  )
}

/** Loading state: a film reel that turns while a request is really in flight. */
export function CinemaLoader({ text }: { text: string }) {
  return (
    <div className="cinema" role="status" aria-live="polite">
      <svg className="cinema__reel" width="64" height="64" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10.500" fill="none" stroke="currentColor" strokeWidth="1.500" />
        {[0, 72, 144, 216, 288].map((a) => (
          <circle key={a} cx="12" cy="6.200" r="2.300" fill="none" stroke="currentColor" strokeWidth="1.500" transform={`rotate(${a} 12 12)`} />
        ))}
        <circle cx="12" cy="12" r="1.500" fill="currentColor" />
      </svg>
      <p className="cinema__text">{text}</p>
    </div>
  )
}

export function GridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => <div key={i} className="skeleton skeleton--card" />)}
    </div>
  )
}
