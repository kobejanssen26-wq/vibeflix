import { useState } from 'react'
import type { Movie } from '../types'
import { cx, hueFromString } from '../utils/format'

/** Poster with a generated fallback for demo mode or missing artwork. */
export function Poster({ movie, className, eager }: { movie: Pick<Movie, 'title' | 'year' | 'posterUrl' | 'genres'>; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false)
  if (movie.posterUrl && !failed) {
    return (
      <img className={cx('poster', className)} src={movie.posterUrl} alt={`Poster of ${movie.title}`}
        loading={eager ? 'eager' : 'lazy'} onError={() => setFailed(true)} />
    )
  }
  const hue = hueFromString(movie.title + (movie.genres[0] ?? ''))
  return (
    <div className={cx('poster poster--fallback', className)} role="img" aria-label={`Poster placeholder for ${movie.title}`}
      style={{ ['--h' as string]: hue }}>
      <span className="poster__genre">{movie.genres[0] ?? 'Film'}</span>
      <span className="poster__title">{movie.title}</span>
      <span className="poster__year">{movie.year ?? ''}</span>
    </div>
  )
}

export function Backdrop({ movie }: { movie: Pick<Movie, 'title' | 'backdropUrl' | 'posterUrl' | 'genres'> }) {
  const [failed, setFailed] = useState(false)
  const hue = hueFromString(movie.title + (movie.genres[0] ?? ''))
  if (movie.backdropUrl && !failed) {
    return <img className="backdrop__img" src={movie.backdropUrl} alt="" onError={() => setFailed(true)} />
  }
  return <div className="backdrop__img backdrop__img--fallback" style={{ ['--h' as string]: hue }} />
}
