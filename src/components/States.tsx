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

/** Cinematic loading state. Only rendered while a request is actually in flight. */
export function CinemaLoader({ text }: { text: string }) {
  return (
    <div className="cinema" role="status" aria-live="polite">
      <div className="cinema__reel" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => <span key={i} style={{ animationDelay: `${i * 0.15}s` }} />)}
      </div>
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
