# 🎬 VibeFlix – Your mood. Your movie.

VibeFlix is a mood-based movie recommendation web app (school project). Instead of scrolling through hundreds of titles, you answer a few quick questions and get a ranked, explained list of movies.

## The problem it solves
People spend too long browsing streaming catalogues without choosing anything. VibeFlix asks for your mood, who is watching, the age group and a few optional preferences, then recommends movies that fit – and tells you *why*.

**Target audience:** anyone choosing a movie alone, with a partner, friends or family (including children – see age handling below).

## Features (all implemented)
- Welcome screen, 3-step questionnaire (mood → setting → taste), loading state, results, movie details, favorites/watched library, explore/search, settings.
- 10 mood cards; one main mood plus an optional second mood ("Surprise me" stands alone).
- Questions: viewing group, age group, genres (multi-select / no preference), runtime, plus optional language, highest US rating, release period, and "skip movies I've watched".
- Results: prominent **Best match**, more picks with sort (match / rating / newest / shortest), genre filter, "Show me another movie", favorite, already watched, new search.
- Favorites and watched list persist in `localStorage` (no account, no tracking).
- Light/dark/system theme; TMDB title language; clear saved data. Responsive: bottom tab bar on phones, top navigation on tablet/desktop.
- **Demo mode** with a built-in 98-film catalogue when TMDB isn't configured.

## How recommendations work
1. **Candidates** – with TMDB, the app asks `discover/movie` using filters TMDB supports (genres, language, dates, runtime, US certification), then loads full details (runtime, US rating, keywords) for the most promising ~36. In demo mode the whole catalogue is the candidate pool.
2. **Hard filters** – explicit requirements remove movies: already watched (if requested), age group / rating limit, runtime, release period, original language. For children, teens and mixed ages, movies with no known official rating are excluded, and horror (plus thriller/crime/war for children) is excluded. The age group is a *preference*; the official rating is always shown.
3. **Scoring** (`src/services/recommender.ts`, weights in `src/config/scoring.ts`) – weighted sum of: main mood (40), secondary mood (14), genre (18), viewing situation (8), age suitability (8), runtime (5), audience rating (5, only with ≥300 votes). Only components that apply to your answers count; the result is normalised to 0–100%.
4. **Mood mapping** (`src/config/moods.ts`, `src/services/moodClassifier.ts`) – TMDB has no mood labels, so each mood has weighted genres, "avoid" genres and synopsis keywords. Mood fit is an **inference by the app**, not TMDB data.
5. **Explanations** – each reason is tagged **Data** (taken directly from the source) or **Inferred** (computed by VibeFlix). The percentage is labelled "estimated match" – it is not a scientifically validated prediction.

## Tech stack
React 18 + TypeScript + Vite, plain CSS design tokens (no UI framework), Vitest, TMDB API, and a small Node proxy (`server/tmdbProxy.mjs`) that keeps the API key on the server.

## Install and run
```bash
npm install
npm run dev          # http://localhost:5173 – demo mode until TMDB is configured
```
Production: `npm run build && npm start` (serves `dist/` and the TMDB proxy on `PORT`, default 8080).

Other scripts: `npm test` (unit tests), `npm run typecheck`.

## Configure TMDB
1. Create a free account at <https://www.themoviedb.org> and request an API key at <https://www.themoviedb.org/settings/api>.
2. `cp .env.example .env` and set **either** `TMDB_API_KEY` (v3 key) **or** `TMDB_READ_ACCESS_TOKEN` (v4 read token).
3. Restart `npm run dev`. The header's "Demo mode" badge disappears and live data is used.

The key is only read by the Node process (dev server or `server/index.mjs`) and is never bundled into browser code. `.env` is git-ignored; only `.env.example` (placeholders) is committed. The proxy forwards a whitelist of read-only movie endpoints and caches responses for 10 minutes; the browser also caches movie details for 7 days. Rate limits (HTTP 429) are retried once, then shown as a friendly error with "Try again" and an option to switch to the demo catalogue.

*This product uses the TMDB API but is not endorsed or certified by TMDB.*

## Demo mode
Used automatically when no TMDB credentials exist (or the app is hosted statically without the server), or when "Use the demo catalogue" is switched on in Settings. It contains 98 real films with real years, runtimes, US ratings, genres and languages; the one-line synopses were written for this app. There are no posters or audience ratings in demo mode, so generated artwork is shown.

## Project structure
```
src/components  reusable UI        src/services  TMDB client, demo source, recommender, mood classifier, cache
src/pages       screens            src/config    moods, scoring weights, options
src/hooks       routing + store    src/utils     storage, formatting, mood selection
src/types       TypeScript types   src/data      demo catalogue
server/         TMDB proxy + production server
```

## Known limitations
- **No streaming availability.** VibeFlix recommends movies but does not know where they can be watched.
- Age ratings use the **US** system (G, PG, PG-13, R, NC-17) only; movies without one are treated as unrated.
- Mood fit is heuristic (genres + synopsis keywords) and can be wrong for individual films.
- The language preference filters on original language. The title/synopsis language setting only applies to TMDB data.
- Demo mode is English-only and has no posters.
- Preferences and favorites are per browser/device; there are no accounts.
- The live TMDB path was verified against a local mock TMDB server, not a real API key (none was available while building).
