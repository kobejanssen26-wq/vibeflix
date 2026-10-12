import { href, type Route } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'
import { cx } from '../utils/format'
import { Icon, type IconName } from './Icon'
import { Logo } from './Logo'

const ITEMS: { key: string; label: string; icon: IconName; to: string; match: Route['name'][] }[] = [
  { key: 'home', label: 'Home', icon: 'home', to: href.home, match: ['home'] },
  { key: 'find', label: 'Find', icon: 'ticket', to: href.find, match: ['find', 'results'] },
  { key: 'explore', label: 'Explore', icon: 'film', to: href.explore, match: ['explore'] },
  { key: 'favorites', label: 'Favorites', icon: 'bookmark', to: href.favorites, match: ['favorites'] },
  { key: 'settings', label: 'Settings', icon: 'sliders', to: href.settings, match: ['settings'] },
]

export function TopBar({ route }: { route: Route }) {
  const { favorites, mode } = useStore()
  const count = Object.keys(favorites).length
  return (
    <header className="topbar">
      <a href={href.home} className="topbar__logo" aria-label="VibeFlix home"><Logo /></a>
      <nav className="topbar__nav" aria-label="Main">
        {ITEMS.map((i) => (
          <a key={i.key} href={i.to} className={cx('topbar__link', i.match.includes(route.name) && 'is-active')}
            aria-current={i.match.includes(route.name) ? 'page' : undefined}>
            {i.label}{i.key === 'favorites' && count > 0 && <span className="count">{count}</span>}
          </a>
        ))}
      </nav>
      {mode === 'demo' && <span className="topbar__mode" title="Using the built-in demo catalogue">Demo mode</span>}
    </header>
  )
}

export function BottomBar({ route }: { route: Route }) {
  return (
    <nav className="bottombar" aria-label="Main">
      {ITEMS.map((i) => {
        const active = i.match.includes(route.name)
        return (
          <a key={i.key} href={i.to} className={cx('bottombar__link', active && 'is-active')} aria-current={active ? 'page' : undefined}>
            <Icon name={i.icon} size={22} filled={active && i.key === 'favorites'} />
            <span>{i.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
