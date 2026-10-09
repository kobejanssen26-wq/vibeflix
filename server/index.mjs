// Production server: serves the built app from ./dist and proxies TMDB.
// Usage: npm run build && npm start   (reads .env or real environment variables)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTmdbMiddleware } from './tmdbProxy.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

// Minimal .env loader (no extra dependency). Real environment variables win.
try {
  for (const line of fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env – demo mode */ }

const tmdb = createTmdbMiddleware({
  apiKey: process.env.TMDB_API_KEY,
  readToken: process.env.TMDB_READ_ACCESS_TOKEN,
})

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png',
  '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
}

const server = http.createServer((req, res) => {
  tmdb(req, res, () => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = path.join(dist, urlPath === '/' ? 'index.html' : urlPath)
    if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(dist, 'index.html')
    }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
  })
})

const port = Number(process.env.PORT) || 8080
server.listen(port, () => {
  const mode = process.env.TMDB_API_KEY || process.env.TMDB_READ_ACCESS_TOKEN ? 'TMDB live data' : 'demo mode'
  console.log(`VibeFlix running on http://localhost:${port} (${mode})`)
})
