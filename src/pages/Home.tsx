import { MOODS } from '../config/moods'
import { DEMO_MOVIES } from '../data/demoMovies'
import { Icon } from '../components/Icon'
import { LinkButton } from '../components/ui'
import { href } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'

const STEPS = [
  { n: 1, title: 'Pick your vibe', text: 'Choose a mood, plus an optional second one.' },
  { n: 2, title: 'Tell us the setting', text: 'Who is watching, their age group, genres and time.' },
  { n: 3, title: 'Get matched', text: 'We rank real movies and explain every pick.' },
]

export function Home() {
  const { mode } = useStore()
  return (
    <div className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="eyebrow">Movie picks by mood</p>
          <h1 className="hero__title"><span>Your mood.</span> <span>Your movie.</span></h1>
          <p className="hero__lead">Pick a mood, say who is watching, and get a short list of films that fit. No more scrolling for an hour.</p>
          <div className="hero__actions">
            <LinkButton href={href.find} variant="primary" size="lg" icon="next">Find my movie</LinkButton>
            <LinkButton href={href.explore} variant="secondary" size="lg">Explore movies</LinkButton>
          </div>
        </div>
        <ul className="strip" aria-label="Available moods">
          {MOODS.map((m) => (
            <li key={m.id} className="strip__frame" style={{ ['--mood' as string]: m.color }}>
              <Icon name={m.icon} size={34} />
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="section" aria-labelledby="how">
        <h2 id="how" className="section__title">How it works</h2>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n} className="steps__item">
              <span className="steps__n">Step {s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        <p className="note">
          <Icon name="info" size={16} />
          <span>
            {mode === 'demo'
              ? `Demo mode: recommendations come from a built-in catalogue of ${DEMO_MOVIES.length} well-known films. `
              : 'Movie data comes from TMDB. '}
            VibeFlix recommends movies but does not know where they are streaming.
          </span>
        </p>
      </section>
    </div>
  )
}
