import type { MoodDefinition } from '../config/moods'
import { cx } from '../utils/format'
import { Icon } from './Icon'

export type MoodRole = 'primary' | 'secondary' | null

export function MoodCard({ mood, role, onClick, disabled }: { mood: MoodDefinition; role: MoodRole; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={cx('mood', role && 'is-selected', role === 'secondary' && 'is-secondary')}
      style={{ ['--mood' as string]: mood.color }} onClick={onClick} disabled={disabled} aria-pressed={Boolean(role)}>
      <Icon name={mood.icon} size={40} className="mood__icon" />
      <span className="mood__label">{mood.label}</span>
      <span className="mood__blurb">{mood.blurb}</span>
      {role && <span className="mood__tag">{role === 'primary' ? 'Main vibe' : '+ Second vibe'}</span>}
    </button>
  )
}
