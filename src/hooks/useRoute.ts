import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' } | { name: 'find' } | { name: 'results' } | { name: 'explore' }
  | { name: 'favorites' } | { name: 'settings' } | { name: 'movie'; id: number }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').split('?')[0].replace(/\/+$/, '') || '/'
  const movie = path.match(/^\/movie\/(-?\d+)$/)
  if (movie) return { name: 'movie', id: Number(movie[1]) }
  switch (path) {
    case '/find': return { name: 'find' }
    case '/results': return { name: 'results' }
    case '/explore': return { name: 'explore' }
    case '/favorites': return { name: 'favorites' }
    case '/settings': return { name: 'settings' }
    default: return { name: 'home' }
  }
}

export const href = {
  home: '#/', find: '#/find', results: '#/results', explore: '#/explore',
  favorites: '#/favorites', settings: '#/settings', movie: (id: number) => `#/movie/${id}`,
}

export function navigate(to: string) {
  if (location.hash === to) window.dispatchEvent(new HashChangeEvent('hashchange'))
  else location.hash = to
}

export function goBack(fallback: string = href.home) {
  // history.length > 1 is true for most real sessions; fall back to a sensible page otherwise.
  if (window.history.length > 1) window.history.back()
  else navigate(fallback)
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash))
  useEffect(() => {
    const onChange = () => { setRoute(parseHash(location.hash)); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
