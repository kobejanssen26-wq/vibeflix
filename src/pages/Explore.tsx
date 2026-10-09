import { useEffect, useState } from 'react'
import { MovieCard } from '../components/MovieCard'
import { GridSkeleton, Message } from '../components/States'
import { Button, Chip } from '../components/ui'
import { GENRE_OPTIONS } from '../config/options'
import { useStore } from '../hooks/useStore'
import type { Movie } from '../types'

export function Explore() {
  const { source } = useStore()
  const [genre, setGenre] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [movies, setMovies] = useState<Movie[] | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query), 300)
    return () => window.clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!source) return
    let cancelled = false
    setMovies(null); setError(false)
    source.browse({ genre, query: debounced })
      .then((m) => !cancelled && setMovies(m))
      .catch(() => !cancelled && setError(true))
    return () => { cancelled = true }
  }, [source, genre, debounced, attempt])

  return (
    <div>
      <header className="results__head">
        <h1 className="page-title">Explore movies</h1>
        <label className="field field--search">
          <span className="sr-only">Search movies by title</span>
          <input type="search" placeholder="Search by title…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
      </header>
      {!debounced.trim() && (
        <div className="chips chips--scroll" aria-label="Filter by genre">
          <Chip selected={genre === null} onClick={() => setGenre(null)}>All</Chip>
          {GENRE_OPTIONS.map((g) => <Chip key={g} selected={genre === g} onClick={() => setGenre(genre === g ? null : g)}>{g}</Chip>)}
        </div>
      )}
      {error ? (
        <Message icon="warn" title="Couldn’t load movies" actions={<Button variant="primary" icon="refresh" onClick={() => setAttempt(attempt + 1)}>Try again</Button>}>
          Check your connection and try again.
        </Message>
      ) : movies === null ? <GridSkeleton />
        : movies.length === 0 ? <Message icon="search" title="No movies found" actions={<Button onClick={() => { setQuery(''); setGenre(null) }}>Clear search</Button>}>Try a different title or genre.</Message>
        : <div className="grid">{movies.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
    </div>
  )
}
