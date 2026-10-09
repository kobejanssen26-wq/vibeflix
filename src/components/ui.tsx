import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../utils/format'
import { Icon, type IconName } from './Icon'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'md' | 'lg' | 'sm'
  icon?: IconName
}

export function Button({ variant = 'secondary', size = 'md', icon, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={cx('btn', `btn--${variant}`, `btn--${size}`, className)} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />}
      {children}
    </button>
  )
}

export function LinkButton({ href, variant = 'secondary', size = 'md', icon, children, className }: {
  href: string; variant?: Variant; size?: 'md' | 'lg' | 'sm'; icon?: IconName; children: ReactNode; className?: string
}) {
  return (
    <a href={href} className={cx('btn', `btn--${variant}`, `btn--${size}`, className)}>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 18} />}
      {children}
    </a>
  )
}

export function Chip({ selected, onClick, children, disabled }: { selected: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" className={cx('chip', selected && 'is-selected')} aria-pressed={selected} onClick={onClick} disabled={disabled}>
      {selected && <Icon name="check" size={14} />}
      {children}
    </button>
  )
}

export function OptionCard({ selected, onClick, emoji, label, hint }: {
  selected: boolean; onClick: () => void; emoji: string; label: string; hint?: string
}) {
  return (
    <button type="button" className={cx('option', selected && 'is-selected')} aria-pressed={selected} onClick={onClick}>
      <span className="option__emoji" aria-hidden="true">{emoji}</span>
      <span className="option__text">
        <span className="option__label">{label}</span>
        {hint && <span className="option__hint">{hint}</span>}
      </span>
    </button>
  )
}

export function Badge({ children, tone = 'neutral', title }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'purple' | 'success'; title?: string }) {
  return <span className={cx('badge', `badge--${tone}`)} title={title}>{children}</span>
}

export function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string
}) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id}
          className={cx('segmented__item', value === o.id && 'is-selected')} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="switch">
      <span className="switch__text">
        <span className="switch__label">{label}</span>
        {hint && <span className="switch__hint">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
    </label>
  )
}
