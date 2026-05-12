/**
 * CLI smoke test — mirror /debug page logic.
 * Runs each API endpoint sequentially, prints PASS/FAIL with duration + summary.
 * Use after `npm run seed` to verify the BE is functioning end-to-end.
 */

const BASE_URL = process.env.BE_URL || 'http://localhost:9990'
const TEST_EMAIL = process.env.TEST_EMAIL || 'an@example.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Password@123'
const TEST_PEER_USERNAME = process.env.TEST_PEER_USERNAME || 'binh_designer'

interface TestResult {
  key: string
  label: string
  pass: boolean
  durationMs: number
  detail?: string
}

const results: TestResult[] = []

async function runStep<T>(key: string, label: string, fn: () => Promise<T>): Promise<T | null> {
  const start = Date.now()
  try {
    const value = await fn()
    const durationMs = Date.now() - start
    results.push({ key, label, pass: true, durationMs })
    console.log(`  ${green('PASS')}  ${label.padEnd(40)} ${durationMs}ms`)
    return value
  } catch (err) {
    const durationMs = Date.now() - start
    const detail = err instanceof Error ? err.message : String(err)
    results.push({ key, label, pass: false, durationMs, detail })
    console.log(`  ${red('FAIL')}  ${label.padEnd(40)} ${durationMs}ms`)
    console.log(`        ${dim(detail)}`)
    return null
  }
}

interface ApiOptions {
  method?: string
  body?: unknown
  token?: string
}

async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = opts
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data?.error?.message ?? data?.message ?? data?.error?.details ?? `HTTP ${res.status}`
    throw new Error(`${res.status} — ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`)
  }
  return data as T
}

function green(s: string) { return `\x1b[32m${s}\x1b[0m` }
function red(s: string) { return `\x1b[31m${s}\x1b[0m` }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m` }
function bold(s: string) { return `\x1b[1m${s}\x1b[0m` }

async function main() {
  console.log(bold(`\nSmoke test: ${BASE_URL}`))
  console.log(dim(`Test user: ${TEST_EMAIL}\n`))

  // 1. BE reachable — any HTTP response counts (auth middleware can return 401 or 422)
  await runStep('reachable', 'BE reachable', async () => {
    const res = await fetch(`${BASE_URL}/users/me`)
    if (!res.status) throw new Error('No response')
  })

  // 2. Login
  type LoginResp = { data: { access_token: string; refresh_token: string } }
  const login = await runStep('login', 'POST /users/login', async () => {
    const r = await api<LoginResp>('/users/login', {
      method: 'POST',
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    if (!r.data?.access_token) throw new Error('Missing access_token')
    return r.data
  })
  if (!login) {
    return summary()
  }

  const accessToken = login.access_token
  const refreshToken = login.refresh_token

  // 3. Get me
  type MeResp = { data: { _id: string; username: string; email: string } }
  const me = await runStep('me', 'GET /users/me', async () => {
    const r = await api<MeResp>('/users/me', { token: accessToken })
    if (!r.data?._id) throw new Error('Missing user._id')
    return r.data
  })

  // 4. Timeline
  type TimelineResp = { data: any[]; meta: { page: number; total: number; total_pages: number } }
  await runStep('timeline', 'GET /tweets/timeline', async () => {
    const r = await api<TimelineResp>('/tweets/timeline?page=1&limit=10', { token: accessToken })
    if (!Array.isArray(r.data)) throw new Error('data not array')
    return r
  })

  // 5. Create tweet
  type TweetResp = { data: { _id: string; content: string } }
  const tweet = await runStep('createTweet', 'POST /tweets', async () => {
    const r = await api<TweetResp>('/tweets', {
      method: 'POST',
      token: accessToken,
      body: {
        type: 0,
        audience: 0,
        content: `[smoke] ${new Date().toISOString()}`,
        hashtags: ['smoke'],
        mentions: [],
        medias: [],
      },
    })
    if (!r.data?._id) throw new Error('Missing tweet._id')
    return r.data
  })

  // 6. Get tweet by id
  if (tweet) {
    await runStep('getTweet', 'GET /tweets/:id', async () => {
      const r = await api<TweetResp>(`/tweets/${tweet._id}`, { token: accessToken })
      if (r.data._id !== tweet._id) throw new Error('Tweet id mismatch')
    })
  }

  // 7. Like + Unlike
  if (tweet) {
    await runStep('like', 'POST /likes', () =>
      api('/likes', { method: 'POST', token: accessToken, body: { tweet_id: tweet._id } }),
    )
    await runStep('unlike', 'DELETE /likes/tweets/:id', () =>
      api(`/likes/tweets/${tweet._id}`, { method: 'DELETE', token: accessToken }),
    )
  }

  // 8. Bookmark + Unbookmark
  if (tweet) {
    await runStep('bookmark', 'POST /bookmarks', () =>
      api('/bookmarks', { method: 'POST', token: accessToken, body: { tweet_id: tweet._id } }),
    )
    await runStep('unbookmark', 'DELETE /bookmarks/tweets/:id', () =>
      api(`/bookmarks/tweets/${tweet._id}`, { method: 'DELETE', token: accessToken }),
    )
  }

  // 9. Get profile by username (public)
  await runStep('getProfile', 'GET /users/:username', () =>
    api(`/users/${TEST_PEER_USERNAME}`),
  )

  // 10. Follow + Unfollow
  type PeerResp = { data: { _id: string } }
  const peer = await runStep('getPeerForFollow', 'GET /users/:peer (for follow)', async () => {
    const r = await api<PeerResp>(`/users/${TEST_PEER_USERNAME}`)
    return r.data
  })

  if (peer && me) {
    // an already follows binh from seed → unfollow first to test idempotent
    await runStep('unfollow', 'DELETE /users/follow/:id (cleanup)', () =>
      api(`/users/follow/${peer._id}`, { method: 'DELETE', token: accessToken }),
    )
    await runStep('follow', 'POST /users/follow', () =>
      api('/users/follow', {
        method: 'POST',
        token: accessToken,
        body: { followed_user_id: peer._id },
      }),
    )
  }

  // 11. Refresh token
  type RefreshResp = { data: { access_token: string; refresh_token: string } }
  const refreshed = await runStep('refresh', 'POST /users/refresh-token', async () => {
    const r = await api<RefreshResp>('/users/refresh-token', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    })
    if (!r.data?.access_token) throw new Error('Missing new access_token')
    return r.data
  })

  // 12. Logout (with refreshed token)
  if (refreshed) {
    await runStep('logout', 'POST /users/logout', () =>
      api('/users/logout', {
        method: 'POST',
        token: refreshed.access_token,
        body: { refresh_token: refreshed.refresh_token },
      }),
    )
  }

  // 13. Register new account (cleanup-friendly: timestamp email)
  type RegResp = { data: { access_token: string } }
  await runStep('register', 'POST /users/register', () =>
    api<RegResp>('/users/register', {
      method: 'POST',
      body: {
        name: 'Smoke Test',
        email: `smoke-${Date.now()}@example.com`,
        password: 'Password@123',
        confirm_password: 'Password@123',
        date_of_birth: '1995-01-01T00:00:00.000Z',
      },
    }),
  )

  summary()
}

function summary() {
  const total = results.length
  const passed = results.filter((r) => r.pass).length
  const failed = total - passed

  console.log('')
  console.log(bold('Summary'))
  console.log(`  Total:  ${total}`)
  console.log(`  Pass:   ${green(String(passed))}`)
  console.log(`  Fail:   ${failed > 0 ? red(String(failed)) : '0'}`)
  console.log('')

  if (failed > 0) {
    console.log(bold('Failures:'))
    results.filter((r) => !r.pass).forEach((r) => {
      console.log(`  - ${r.label}`)
      console.log(`    ${dim(r.detail || '')}`)
    })
    process.exit(1)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error('Test runner crashed:', err)
  process.exit(1)
})
