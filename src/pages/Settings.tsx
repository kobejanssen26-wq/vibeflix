import { useState } from 'react'
import { Switch, Button, Segmented } from '../components/ui'
import { METADATA_LANGUAGES } from '../config/options'
import { useStore } from '../hooks/useStore'
import type { Settings as SettingsT } from '../types'

type Target = 'favorites' | 'watched' | 'prefs' | 'cache'
const ACTIONS: { id: Target; label: string; done: string }[] = [
  { id: 'prefs', label: 'Saved preferences (mood, genres…)', done: 'Preferences cleared' },
  { id: 'favorites', label: 'Favorites', done: 'Favorites cleared' },
  { id: 'watched', label: 'Watched list', done: 'Watched list cleared' },
  { id: 'cache', label: 'Cached movie data', done: 'Cache cleared' },
]

export function Settings() {
  const { settings, setSettings, mode, tmdbAvailable, clearAll, notify } = useStore()
  const [confirm, setConfirm] = useState<Target | null>(null)

  return (
    <div className="settings">
      <h1 className="page-title">Settings</h1>

      <section className="panel">
        <h2 className="section__title">Appearance</h2>
        <Segmented<SettingsT['theme']> label="Theme" value={settings.theme} onChange={(theme) => setSettings({ theme })}
          options={[{ id: 'dark', label: 'Dark' }, { id: 'light', label: 'Light' }, { id: 'system', label: 'System' }]} />
      </section>

      <section className="panel">
        <h2 className="section__title">Movie data</h2>
        <p className="muted">
          Currently using: <strong>{mode === 'tmdb' ? 'TMDB live data' : 'built-in demo catalogue'}</strong>.
          {!tmdbAvailable && ' TMDB is not configured on this server – see the README to add your API key.'}
        </p>
        <label className="field">
          <span>Language of titles and synopses (TMDB only)</span>
          <select value={settings.metadataLanguage} disabled={!tmdbAvailable} onChange={(e) => setSettings({ metadataLanguage: e.target.value })}>
            {METADATA_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </label>
        <Switch checked={settings.forceDemo || !tmdbAvailable} onChange={(forceDemo) => setSettings({ forceDemo })}
          label="Use the demo catalogue" hint={tmdbAvailable ? 'Ignore TMDB and use the built-in films.' : 'Always on while TMDB is not configured.'} />
        {!tmdbAvailable && <span className="sr-only">Locked</span>}
      </section>

      <section className="panel">
        <h2 className="section__title">Your data</h2>
        <p className="muted">Everything is stored only in this browser. No account, no tracking.</p>
        <ul className="danger-list">
          {ACTIONS.map((a) => (
            <li key={a.id}>
              <span>{a.label}</span>
              {confirm === a.id ? (
                <span className="danger-list__confirm">
                  <Button size="sm" variant="danger" onClick={() => { clearAll(a.id); setConfirm(null); notify(a.done) }}>Yes, clear</Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
                </span>
              ) : <Button size="sm" onClick={() => setConfirm(a.id)}>Clear…</Button>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
