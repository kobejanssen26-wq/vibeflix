import { BottomBar, TopBar } from './components/Nav'
import { CinemaLoader } from './components/States'
import { useRoute } from './hooks/useRoute'
import { StoreProvider, useStore } from './hooks/useStore'
import { Details } from './pages/Details'
import { Explore } from './pages/Explore'
import { Favorites } from './pages/Favorites'
import { Find } from './pages/Find'
import { Home } from './pages/Home'
import { Results } from './pages/Results'
import { Settings } from './pages/Settings'

function Shell() {
  const route = useRoute()
  const { mode, toast } = useStore()
  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <TopBar route={route} />
      <main id="main" className={`page page--${route.name}`}>
        {!mode ? <CinemaLoader text="Starting VibeFlix…" /> : (
          <>
            {route.name === 'home' && <Home />}
            {route.name === 'find' && <Find />}
            {route.name === 'results' && <Results />}
            {route.name === 'movie' && <Details key={route.id} id={route.id} />}
            {route.name === 'explore' && <Explore />}
            {route.name === 'favorites' && <Favorites />}
            {route.name === 'settings' && <Settings />}
          </>
        )}
      </main>
      <BottomBar route={route} />
      <div className="toast" role="status" aria-live="polite">{toast && <span>{toast}</span>}</div>
    </>
  )
}

export default function App() {
  return <StoreProvider><Shell /></StoreProvider>
}
