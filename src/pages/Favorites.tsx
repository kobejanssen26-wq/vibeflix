import { useState } from 'react'
import { MovieCard } from '../components/MovieCard'
import { Message } from '../components/States'
import { Button, LinkButton, Segmented } from '../components/ui'
import { href } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'

export function Favorites() {
  const { favorites, watched, toggleWatched, toggleFavorite } = useStore()
  const [tab, setTab] = useState<'favorites' | 'watched'>('favorites')
  const list = Object.values(tab === 'favorites' ? favorites : watched).sort((a, b) => b.at - a.at)

  return (
    <div>
      <header className="results__head">
        <h1 className="page-title">Your library</h1>
        <Segmented label="Library section" value={tab} onChange={setTab}
          options={[{ id: 'favorites', label: `Favorites (${Object.keys(favorites).length})` }, { id: 'watched', label: `Watched (${Object.keys(watched).length})` }]} />
      </header>
      {list.length === 0 ? (
        <Message icon={tab === 'favorites' ? 'heart' : 'eye'}
          title={tab === 'favorites' ? 'No favorites yet' : 'Nothing marked as watched'}
          actions={<LinkButton href={href.find} variant="primary" icon="sparkle">Find my movie</LinkButton>}>
          {tab === 'favorites' ? 'Tap the heart on any movie to save it here.' : 'Mark movies as watched and VibeFlix can skip them in future recommendations.'}
        </Message>
      ) : (
        <div className="grid">
          {list.map(({ movie }) => (
            <MovieCard key={movie.id} movie={movie}>
              <div className="card__actions">
                {tab === 'favorites'
                  ? <Button size="sm" variant="ghost" onClick={() => toggleFavorite(movie)}>Remove</Button>
                  : <Button size="sm" variant="ghost" onClick={() => toggleWatched(movie)}>Unmark</Button>}
              </div>
            </MovieCard>
          ))}
        </div>
      )}
      <p className="disclaimer">Saved only in this browser (localStorage). Nothing is sent to a server.</p>
    </div>
  )
}
