import { useEffect, useMemo, useRef, useState } from 'react'
import { BestMatch, ResultCard } from '../components/Recommendation'
import { Icon } from '../components/Icon'
import { CinemaLoader, Message } from '../components/States'
import { Button, Chip, LinkButton, Switch } from '../components/ui'
import { MOOD_BY_ID } from '../config/moods'
import { href, navigate } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'
import { isReadyToSearch } from '../services/recommender'
import type { Recommendation } from '../types'

type Sort = 'match' | 'rating' | 'newest' | 'shortest'
const PAGE = 8

const SORTS: Record<Sort, { label: string; fn: (a: Recommendation, b: Recommendation) => number }> = {
  match: { label: 'Best match', fn: (a, b) => b.score - a.score },
  rating: { label: 'Audience rating', fn: (a, b) => (b.movie.voteAverage ?? -1) - (a.movie.voteAverage ?? -1) },
  newest: { label: 'Newest', fn: (a, b) => (b.movie.year ?? 0) - (a.movie.year ?? 0) },
  shortest: { label: 'Shortest', fn: (a, b) => (a.movie.runtime ?? 999) - (b.movie.runtime ?? 999) },
}

export function Results() {
  const { search, prefs, setPrefs, runSearch, dismissed, dismiss, watched, mode, source, setSettings, resetPrefs } = useStore()
  const [sort, setSort] = useState<Sort>('match')
  const [genre, setGenre] = useState<string | null>(null)
  const [shown, setShown] = useState(PAGE)

  // Run a search when arriving with saved preferences (e.g. after a reload).
  const started = useRef(false)
  useEffect(() => {
    if (started.current || !source) return
    started.current = true
    if (search.status === 'idle' && isReadyToSearch(prefs)) void runSearch()
  }, [source, search.status, prefs, runSearch])

  // Re-run when the "skip watched" preference changes, keeping the same wildcard seed.
  const lastExclude = useRef(prefs.excludeWatched)
  useEffect(() => {
    if (lastExclude.current === prefs.excludeWatched) return
    lastExclude.current = prefs.excludeWatched
    void runSearch({ fresh: false })
  }, [prefs.excludeWatched, runSearch])

  // A new data source (e.g. switching to demo after an error) needs a fresh search.
  const lastSource = useRef(source)
  useEffect(() => {
    if (lastSource.current === source) return
    lastSource.current = source
    if (source && isReadyToSearch(prefs)) void runSearch({ fresh: false })
  }, [source, prefs, runSearch])

  const visible = useMemo(() => {
    if (search.status !== 'done') return []
    return search.results.filter((r) => !dismissed.has(r.movie.id) && !(prefs.excludeWatched && watched[r.movie.id]))
  }, [search, dismissed, watched, prefs.excludeWatched])

  const genres = useMemo(() => [...new Set(visible.flatMap((r) => r.movie.genres))].sort(), [visible])
  const filtered = genre ? visible.filter((r) => r.movie.genres.includes(genre)) : visible
  const best = filtered[0] // always the highest-scoring remaining match
  const others = useMemo(() => [...filtered.slice(1)].sort(SORTS[sort].fn), [filtered, sort])

  const newSearch = () => navigate(href.find)

  if (!isReadyToSearch(prefs) && search.status === 'idle') {
    return <Message icon="sparkle" title="Let’s find your movie first" actions={<LinkButton href={href.find} variant="primary">Answer a few questions</LinkButton>}>
      Tell us your mood and who’s watching to get recommendations.
    </Message>
  }
  if (search.status === 'idle' || search.status === 'loading') {
    return <CinemaLoader text={prefs.mood ? `Finding ${MOOD_BY_ID[prefs.mood].label.toLowerCase()} movies for you…` : 'Finding movies…'} />
  }
  if (search.status === 'error') {
    return (
      <Message icon="warn" title="We couldn’t load movies" actions={<>
        <Button variant="primary" icon="refresh" onClick={() => void runSearch()}>Try again</Button>
        {search.canUseDemo && <Button onClick={() => setSettings({ forceDemo: true })}>Use demo catalogue</Button>}
      </>}>
        {search.message}
      </Message>
    )
  }

  const emptyHint = Object.entries(search.excluded).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mood = prefs.mood ? MOOD_BY_ID[prefs.mood] : null

  return (
    <div className="results">
      <header className="results__head">
        <div>
          <h1 className="page-title">{mood ? `${mood.emoji} ${mood.label}` : 'Your'} picks{prefs.secondaryMood ? ` with a touch of ${MOOD_BY_ID[prefs.secondaryMood].label.toLowerCase()}` : ''}</h1>
          <p className="muted">
            {filtered.length} match{filtered.length === 1 ? '' : 'es'} from {search.considered} movies checked
            {mode === 'demo' ? ' · demo catalogue' : ''}
          </p>
        </div>
        <Button icon="refresh" onClick={newSearch}>Change answers</Button>
      </header>

      {filtered.length === 0 ? (
        <Message icon="search" title={visible.length ? 'Nothing left with this genre' : 'No movies matched everything'}
          actions={<>
            {genre && <Button onClick={() => setGenre(null)}>Clear genre filter</Button>}
            <Button variant="primary" onClick={newSearch}>Adjust my answers</Button>
            {search.results.length > 0 && visible.length === 0 && <Button onClick={() => void runSearch({ fresh: true })}>Search again</Button>}
          </>}>
          {search.results.length === 0
            ? `Your requirements were too strict${emptyHint ? ` (most movies were removed by your ${{ watched: 'watched list', age: 'age group', rating: 'rating limit', runtime: 'time limit', period: 'release period', language: 'language' }[emptyHint]})` : ''}. Try relaxing one of them.`
            : 'You have seen or dismissed everything we found. Start again with new answers or search again.'}
        </Message>
      ) : (
        <>
          <BestMatch rec={best} onAnother={() => dismiss(best.movie.id)} onNewSearch={newSearch} />

          {others.length > 0 && (
            <section aria-labelledby="more-title" className="section">
              <div className="toolbar">
                <h2 id="more-title" className="section__title">More for your vibe</h2>
                <label className="field field--inline">
                  <span>Sort by</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                    {(Object.keys(SORTS) as Sort[]).map((s) => <option key={s} value={s}>{SORTS[s].label}</option>)}
                  </select>
                </label>
              </div>
              <div className="chips chips--scroll" aria-label="Filter by genre">
                <Chip selected={genre === null} onClick={() => { setGenre(null); setShown(PAGE) }}>All</Chip>
                {genres.map((g) => <Chip key={g} selected={genre === g} onClick={() => { setGenre(genre === g ? null : g); setShown(PAGE) }}>{g}</Chip>)}
              </div>
              <Switch checked={prefs.excludeWatched} onChange={(v) => setPrefs({ excludeWatched: v })} label="Hide movies I’ve watched" />
              <div className="results__list">
                {others.slice(0, shown).map((r) => <ResultCard key={r.movie.id} rec={r} onAnother={() => dismiss(r.movie.id)} />)}
              </div>
              {others.length > shown && <div className="center"><Button onClick={() => setShown(shown + PAGE)}>Show more</Button></div>}
              {others.length < 2 && filtered.length < 3 && (
                <p className="note"><Icon name="info" size={16} /><span>Only {filtered.length} suitable movie{filtered.length === 1 ? ' was' : 's were'} found for your answers. Loosen a requirement for more.</span></p>
              )}
            </section>
          )}
        </>
      )}
      <p className="disclaimer">Match scores are estimates generated by VibeFlix from movie genres and synopses. Age ratings are US ratings. VibeFlix does not know where a movie is streaming.</p>
      <p className="center"><Button variant="ghost" onClick={() => { resetPrefs(); navigate(href.find) }}>Start a new search</Button></p>
    </div>
  )
}
