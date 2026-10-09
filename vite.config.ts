import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
// @ts-expect-error – plain ESM helper shared with the production server
import { createTmdbMiddleware } from './server/tmdbProxy.mjs'

/** Serves /api/config and /api/tmdb/* in `vite dev` and `vite preview`. */
function tmdbProxy(env: Record<string, string>): Plugin {
  const middleware = createTmdbMiddleware({
    apiKey: env.TMDB_API_KEY,
    readToken: env.TMDB_READ_ACCESS_TOKEN,
  })
  return {
    name: 'vibeflix-tmdb-proxy',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tmdbProxy(env)],
    test: { environment: 'node', include: ['src/**/*.test.ts'] },
  }
})
