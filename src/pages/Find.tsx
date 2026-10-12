import { useState } from 'react'
import { MoodCard } from '../components/MoodCard'
import { Icon } from '../components/Icon'
import { Button, Chip, OptionCard, Switch } from '../components/ui'
import { MOODS } from '../config/moods'
import { AGE_OPTIONS, COMPANY_OPTIONS, GENRE_OPTIONS, LANGUAGE_OPTIONS } from '../config/options'
import { CERT_OPTIONS, RELEASE_RANGES, RUNTIME_RANGES } from '../config/scoring'
import { goBack, href, navigate } from '../hooks/useRoute'
import { useStore } from '../hooks/useStore'
import type { Certification, ReleasePeriod, RuntimeChoice } from '../types'
import { toggleMood } from '../utils/mood'

const STEP_TITLES = ['Your vibe', 'Your setting', 'Your taste']

export function Find() {
  const { prefs, setPrefs, resetPrefs, runSearch } = useStore()
  const [step, setStep] = useState(0)
  const [showMore, setShowMore] = useState(
    () => prefs.language !== 'any' || prefs.maxRating !== 'any' || prefs.releasePeriod !== 'any' || !prefs.excludeWatched,
  )

  const canNext = step === 0 ? Boolean(prefs.mood) : step === 1 ? Boolean(prefs.company && prefs.ageGroup) : true
  const last = step === STEP_TITLES.length - 1

  const next = () => {
    if (!last) return setStep(step + 1)
    void runSearch({ fresh: true })
    navigate(href.results)
  }

  return (
    <div className="quiz">
      <div className="quiz__progress" role="group" aria-label={`Step ${step + 1} of ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}>
        <p className="quiz__step">Step {step + 1} of {STEP_TITLES.length} · {STEP_TITLES[step]}</p>
        <div className="progress" aria-hidden="true">
          {STEP_TITLES.map((t, i) => <span key={t} className={i <= step ? 'is-done' : ''} />)}
        </div>
      </div>

      {step === 0 && (
        <section aria-labelledby="q1">
          <h1 id="q1" className="quiz__title">What’s your vibe tonight?</h1>
          <p className="quiz__lead">Pick your main vibe. Want a blend? Tap a second one. Tap again to deselect.</p>
          <div className="moods">
            {MOODS.map((m) => {
              const role = prefs.mood === m.id ? 'primary' : prefs.secondaryMood === m.id ? 'secondary' : null
              const disabled = m.id === 'surprise' && Boolean(prefs.mood) && prefs.mood !== 'surprise' && role === null
              return <MoodCard key={m.id} mood={m} role={role} disabled={disabled} onClick={() => setPrefs(toggleMood(prefs, m.id))} />
            })}
          </div>
        </section>
      )}

      {step === 1 && (
        <>
          <section aria-labelledby="q2">
            <h1 id="q2" className="quiz__title">Who are you watching with?</h1>
            <div className="options">
              {COMPANY_OPTIONS.map((o) => (
                <OptionCard key={o.id} selected={prefs.company === o.id} onClick={() => setPrefs({ company: o.id })} icon={o.icon} label={o.label} hint={o.hint} />
              ))}
            </div>
          </section>
          <section aria-labelledby="q3" className="quiz__block">
            <h2 id="q3" className="quiz__subtitle">Which age group is watching?</h2>
            <div className="options options--2">
              {AGE_OPTIONS.map((o) => (
                <OptionCard key={o.id} selected={prefs.ageGroup === o.id} onClick={() => setPrefs({ ageGroup: o.id })} icon={o.icon} label={o.label} hint={o.hint} />
              ))}
            </div>
            <p className="note"><Icon name="info" size={16} /><span>This is a preference only. Official age ratings are always shown, and movies without a known rating are left out for children, teens and mixed groups.</span></p>
          </section>
        </>
      )}

      {step === 2 && (
        <>
          <section aria-labelledby="q4">
            <h1 id="q4" className="quiz__title">What sounds good?</h1>
            <p className="quiz__lead">Optional – pick as many genres as you like.</p>
            <div className="chips">
              <Chip selected={prefs.genres.length === 0} onClick={() => setPrefs({ genres: [] })}>No preference</Chip>
              {GENRE_OPTIONS.map((g) => (
                <Chip key={g} selected={prefs.genres.includes(g)}
                  onClick={() => setPrefs({ genres: prefs.genres.includes(g) ? prefs.genres.filter((x) => x !== g) : [...prefs.genres, g] })}>
                  {g}
                </Chip>
              ))}
            </div>
          </section>
          <section aria-labelledby="q5" className="quiz__block">
            <h2 id="q5" className="quiz__subtitle">How much time do you have?</h2>
            <div className="chips">
              {(Object.keys(RUNTIME_RANGES) as RuntimeChoice[]).map((r) => (
                <Chip key={r} selected={prefs.runtime === r} onClick={() => setPrefs({ runtime: r })}>{RUNTIME_RANGES[r].label}</Chip>
              ))}
            </div>
          </section>
          <section className="quiz__block">
            <button type="button" className="disclosure" aria-expanded={showMore} onClick={() => setShowMore(!showMore)}>
              More options <span aria-hidden="true">{showMore ? '−' : '+'}</span>
            </button>
            {showMore && (
              <div className="more">
                <label className="field">
                  <span>Original language</span>
                  <select value={prefs.language} onChange={(e) => setPrefs({ language: e.target.value })}>
                    {LANGUAGE_OPTIONS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Highest age rating (US)</span>
                  <select value={prefs.maxRating} onChange={(e) => setPrefs({ maxRating: e.target.value as 'any' | Certification })}>
                    <option value="any">No limit</option>
                    {CERT_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Release period</span>
                  <select value={prefs.releasePeriod} onChange={(e) => setPrefs({ releasePeriod: e.target.value as ReleasePeriod })}>
                    {(Object.keys(RELEASE_RANGES) as ReleasePeriod[]).map((r) => <option key={r} value={r}>{RELEASE_RANGES[r].label}</option>)}
                  </select>
                </label>
                <Switch checked={prefs.excludeWatched} onChange={(v) => setPrefs({ excludeWatched: v })}
                  label="Skip movies I’ve already watched" hint="Mark movies as watched from any result or detail page." />
              </div>
            )}
          </section>
        </>
      )}

      <div className="quiz__nav">
        <Button variant="ghost" icon="back" onClick={() => (step === 0 ? goBack(href.home) : setStep(step - 1))}>Back</Button>
        {step === 0 && (prefs.mood || prefs.secondaryMood) && <Button variant="ghost" onClick={resetPrefs}>Clear</Button>}
        <Button variant="primary" size="lg" disabled={!canNext} onClick={next} icon={last ? 'next' : undefined}>
          {last ? 'Show my movies' : 'Next'}
        </Button>
      </div>
    </div>
  )
}
