// Tiny TMDB proxy. The API key lives only in server environment variables and is
// attached here, so it never reaches the browser bundle.
// TMDB_BASE_URL is only meant for tests (pointing the proxy at a mock server).
const TMDB_BASE = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3'

// Only read-only movie endpoints are forwarded.
const ALLOWED = [
  /^\/discover\/movie$/,
  /^\/search\/movie$/,
  /^\/movie\/\d+$/,
  /^\/movie\/\d+\/(similar|recommendations)$/,
  /^\/genre\/movie\/list$/,
]

const CACHE_TTL_MS = 10 * 60 * 1000
const MAX_CACHE_ENTRIES = 500

export function createTmdbMiddleware({ apiKey, readToken } = {}) {
  const configured = Boolean(apiKey || readToken)
  const cache = new Map()

  const send = (res, status, body, headers = {}) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
    res.end(typeof body === 'string' ? body : JSON.stringify(body))
  }

  return async function tmdbMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://localhost')

    if (url.pathname === '/api/config') {
      return send(res, 200, { tmdbConfigured: configured })
    }
    if (!url.pathname.startsWith('/api/tmdb/')) return next()

    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' })
    if (!configured) return send(res, 503, { error: 'tmdb_not_configured' })

    const path = url.pathname.slice('/api/tmdb'.length)
    if (!ALLOWED.some((re) => re.test(path))) return send(res, 404, { error: 'not_allowed' })

    const params = new URLSearchParams(url.search)
    params.delete('api_key')
    if (!readToken) params.set('api_key', apiKey)
    params.sort()
    const target = `${TMDB_BASE}${path}?${params.toString()}`

    const hit = cache.get(target)
    if (hit && hit.expires > Date.now()) return send(res, 200, hit.body, { 'X-Cache': 'HIT' })

    try {
      const upstream = await fetch(target, {
        headers: {
          Accept: 'application/json',
          ...(readToken ? { Authorization: `Bearer ${readToken}` } : {}),
        },
      })
      const text = await upstream.text()
      if (upstream.status === 429) {
        return send(res, 429, { error: 'rate_limited' }, {
          'Retry-After': upstream.headers.get('retry-after') || '2',
        })
      }
      if (upstream.status === 401) return send(res, 401, { error: 'invalid_credentials' })
      if (!upstream.ok) return send(res, upstream.status, { error: 'upstream_error' })
      if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value)
      cache.set(target, { body: text, expires: Date.now() + CACHE_TTL_MS })
      return send(res, 200, text, { 'X-Cache': 'MISS' })
    } catch {
      return send(res, 502, { error: 'upstream_unreachable' })
    }
  }
}
