import { useEffect, useMemo, useState } from 'react'
import { MovieCard, FavoriteButton } from '../components/MovieCard'
import { Backdrop, Poster } from '../components/Poster'
import { MatchScore, ReasonList, WatchedButton } from '../components/Recommendation'
import { CinemaLoader, Message } from '../components/States'
import { Badge, Button, LinkButton } from '../components/ui'
import { Icon } from '../components/Icon'
import { MOOD_BY_ID } from '../config/moods'
import { goBack, href } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'
import { classifyMoods } from '../services/moodClassifier'
import { exclusionReason, isReadyToSearch, scoreMovie } from '../services/recommender'
import type { Movie } from '../types'
import { formatRuntime, languageName } from '../utils/format'

const WHY_BLOCKED: Record<string, string> = {
  age: 'is not suitable for the age group you selected (or has no verified rating)',
  rating: 'is above your highest age rating',
  runtime: 'does not fit your time preference',
  period: 'is outside your release period',
  language: 'is not in your preferred language',
  watched: 'is on your watched list',
}

export function Details({ id }: { id: number }) {
  const { source, search, favorites, watched, prefs } = useStore()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [similar, setSimilar] = useState<Movie[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!source) return
    let cancelled = false
    setMovie(null); setSimilar(null); setError(null)
    ;(async () => {
      try {
        const known = (search.status === 'done' && search.results.find((r) => r.movie.id === id)?.movie) || favorites[id]?.movie || watched[id]?.movie
        const base = (known && known.source === source.mode ? known : undefined) ?? (await source.getById(id))
        if (!base) { if (!cancelled) setError('We couldn’t find that movie.'); return }
        const full = await source.getDetails(base)
        if (cancelled) return
        setMovie(full)
        source.getSimilar(full).then((s) => !cancelled && setSimilar(s)).catch(() => !cancelled && setSimilar([]))
      } catch {
        if (!cancelled) setError('We couldn’t load this movie. Check your connection and try again.')
      }
    })()
    return () => { cancelled = true }
    // favorites/watched/search are only used as warm caches for the first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, source, attempt])

  const rec = useMemo(() => {
    if (!movie || !prefs.mood || !isReadyToSearch(prefs)) return null
    const seed = 7
    return { rec: scoreMovie(movie, prefs, { seed }), blocked: exclusionReason(movie, prefs, { watched: new Set() }) }
  }, [movie, prefs])
  const moods = useMemo(() => (movie ? classifyMoods(movie) : []), [movie])

  if (error) {
    return <Message icon="warn" title="Movie unavailable" actions={<>
      <Button variant="primary" icon="refresh" onClick={() => setAttempt(attempt + 1)}>Try again</Button>
      <Button onClick={() => goBack(href.explore)}>Go back</Button>
    </>}>{error}</Message>
  }
  if (!movie) return <CinemaLoader text="Loading movie…" />

  return (
    <article className="details">
      <div className="details__hero">
        <div className="details__backdrop" aria-hidden="true"><Backdrop movie={movie} /></div>
        <button type="button" className="details__back" onClick={() => goBack(href.results)}><Icon name="back" size={18} /> Back</button>
      </div>
      <div className="details__main">
        <div className="details__poster"><Poster movie={movie} eager /></div>
        <div className="details__info">
          <h1 className="details__title">{movie.title}</h1>
          {movie.tagline && <p className="details__tagline">“{movie.tagline}”</p>}
          <div className="facts">
            {movie.year && <Badge>{movie.year}</Badge>}
            {movie.runtime && <Badge><Icon name="clock" size={13} /> {formatRuntime(movie.runtime)}</Badge>}
            {movie.certification
              ? <Badge tone="accent" title="Official US rating">Rated {movie.certification}</Badge>
              : <Badge title="No official rating in the data source">Rating unavailable</Badge>}
            {movie.voteAverage !== undefined && <Badge>{movie.voteAverage.toFixed(1)}/10</Badge>}
            <Badge>{languageName(movie.originalLanguage)}</Badge>
          </div>
          <p className="details__genres">{movie.genres.join(' · ')}</p>
          <p className="details__overview">{movie.overview || 'No synopsis available.'}</p>
          <div className="actions">
            <FavoriteButton movie={movie} label />
            <WatchedButton rec={{ movie }} />
            <LinkButton href={href.find} icon="next">Find another movie</LinkButton>
          </div>
        </div>
      </div>

      <section className="panel" aria-labelledby="why">
        <h2 id="why" className="section__title">Why it matches your vibe</h2>
        {rec ? (
          <>
            {rec.blocked ? (
              <p className="note note--warn"><Icon name="warn" size={16} /><span>With your current answers this movie would not be recommended: it {WHY_BLOCKED[rec.blocked]}.</span></p>
            ) : (
              <>
                <MatchScore score={rec.rec.score} />
                <p className="best__why"><span className="label">Why this one</span>{rec.rec.summary}</p>
              </>
            )}
            <ReasonList rec={rec.rec} />
            <div className="bars" aria-label="Score breakdown">
              {rec.rec.components.map((c) => (
                <div key={c.key} className="bars__row">
                  <span>{c.label}</span>
                  <span className="bars__track"><span style={{ width: `${Math.round(c.value * 100)}%` }} /></span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Answer the quick questions to see how well this movie fits your mood.</p>
        )}
        {moods.length > 0 && (
          <p className="moods-inline">
            <span className="muted">Moods it tends to suit (inferred from genres and synopsis):</span>{' '}
            {moods.map((m) => <Badge key={m.mood} tone="purple"><Icon name={MOOD_BY_ID[m.mood].icon} size={13} /> {MOOD_BY_ID[m.mood].label}</Badge>)}
          </p>
        )}
        <p className="disclaimer">
          Facts (year, runtime, genres, US rating, language) come from {movie.source === 'tmdb' ? 'TMDB' : 'the built-in demo catalogue'}.
          Mood fit and the match score are VibeFlix estimates. VibeFlix does not know where this movie can be streamed.
        </p>
      </section>

      <section className="section" aria-labelledby="similar">
        <h2 id="similar" className="section__title">Similar movies</h2>
        {similar === null ? <p className="muted">Loading suggestions…</p>
          : similar.length === 0 ? <p className="muted">No similar movies found.</p>
          : <div className="rail">{similar.map((m) => <MovieCard key={m.id} movie={m} />)}</div>}
      </section>
    </article>
  )
}

