/**
 * Realtime socket smoke test.
 *
 * Simulates the browser flow with two regular users + an admin observer:
 *   1. All three log in (REST) to get access tokens
 *   2. All three connect via socket.io-client (singleton style, like FE does)
 *   3. an joins his conversation room with binh
 *   4. an POSTs a message via REST → BE emits message:new, conversation:bump,
 *      admin:message
 *   5. binh must receive `message:new` in the conversation room (because he is
 *      a personal-room joiner too, AND we'll have him join the conv room)
 *   6. Admin (admin:feed) must receive `admin:message`
 *
 * If any step is silent within 1.5s, this script fails with a clear message.
 * Run with: `npm run socket-test` (after BE is up + seed has run).
 */

import { io as ioClient, type Socket } from 'socket.io-client'

const BASE_URL = process.env.BE_URL || 'http://localhost:9990'
const PASSWORD = 'Password@123'

async function login(email: string): Promise<{ token: string; user_id: string }> {
  const res = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  })
  const json: any = await res.json()
  if (!res.ok) throw new Error(`login ${email}: ${res.status} ${JSON.stringify(json)}`)
  const token = json.data.access_token
  const me = await (
    await fetch(`${BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
  ).json() as any
  return { token, user_id: me.data._id }
}

function connect(token: string): Promise<Socket> {
  const s = ioClient(BASE_URL, {
    transports: ['websocket'],
    auth: { token },
    reconnection: false,
  })
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('socket connect timeout (3s)')), 3000)
    s.on('connect', () => {
      clearTimeout(timeout)
      resolve(s)
    })
    s.on('connect_error', (err) => {
      clearTimeout(timeout)
      reject(err)
    })
  })
}

function waitFor<T>(s: Socket, event: string, ms = 1500): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout waiting for "${event}" (${ms}ms)`)), ms)
    s.once(event, (payload: T) => {
      clearTimeout(timer)
      resolve(payload)
    })
  })
}

function green(s: string) { return `\x1b[32m${s}\x1b[0m` }
function red(s: string) { return `\x1b[31m${s}\x1b[0m` }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m` }

const sockets: Socket[] = []
let pass = 0
let fail = 0

async function step(label: string, fn: () => Promise<void>) {
  try {
    await fn()
    console.log(`  ${green('PASS')}  ${label}`)
    pass++
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.log(`  ${red('FAIL')}  ${label}`)
    console.log(`        ${dim(msg)}`)
    fail++
  }
}

async function main() {
  console.log(`\nSocket realtime test → ${BASE_URL}\n`)

  const an = await login('an@example.com')
  const binh = await login('binh@example.com')
  const admin = await login('admin@example.com')

  const anSocket = await connect(an.token)
  const binhSocket = await connect(binh.token)
  const adminSocket = await connect(admin.token)
  sockets.push(anSocket, binhSocket, adminSocket)
  console.log(`  ${green('PASS')}  3 sockets connected`)

  // Get or create DM
  const convRes = await (
    await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${an.token}` },
      body: JSON.stringify({ peer_id: binh.user_id }),
    })
  ).json() as any
  const convId = convRes.data._id

  // Both users join the conversation room (like FE does when opening chat panel)
  anSocket.emit('conv:join', convId)
  binhSocket.emit('conv:join', convId)
  await new Promise((r) => setTimeout(r, 100))

  await step('binh receives message:new when an sends', async () => {
    const expected = `realtime test ${Date.now()}`
    const wait = waitFor<{ content: string; conversation_id: string }>(binhSocket, 'message:new')
    await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${an.token}` },
      body: JSON.stringify({ content: expected }),
    })
    const payload = await wait
    if (payload.content !== expected) throw new Error(`content mismatch: got ${payload.content}`)
    if (payload.conversation_id !== convId) throw new Error('wrong conversation_id')
  })

  await step('an also receives message:new (own echo via conv room)', async () => {
    const expected = `echo ${Date.now()}`
    const wait = waitFor<{ content: string }>(anSocket, 'message:new')
    await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${an.token}` },
      body: JSON.stringify({ content: expected }),
    })
    const payload = await wait
    if (payload.content !== expected) throw new Error('echo content mismatch')
  })

  await step('binh receives conversation:bump on personal room', async () => {
    // binh leaves the conv room → only user:<binh.id> remains → should still get bump
    binhSocket.emit('conv:leave', convId)
    await new Promise((r) => setTimeout(r, 50))
    const expected = `bump test ${Date.now()}`
    const wait = waitFor<{ content: string }>(binhSocket, 'conversation:bump')
    await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${an.token}` },
      body: JSON.stringify({ content: expected }),
    })
    const payload = await wait
    if (payload.content !== expected) throw new Error('bump content mismatch')
  })

  await step('admin receives admin:message broadcast', async () => {
    const expected = `admin observe ${Date.now()}`
    const wait = waitFor<{ content: string }>(adminSocket, 'admin:message')
    await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${binh.token}` },
      body: JSON.stringify({ content: expected }),
    })
    const payload = await wait
    if (payload.content !== expected) throw new Error('admin observation content mismatch')
  })

  await step('regular user does NOT receive admin:message', async () => {
    // Use a 800ms window — if `an` (non-admin) gets admin:message, fail.
    let leaked = false
    const onLeak = () => { leaked = true }
    anSocket.on('admin:message', onLeak)
    await fetch(`${BASE_URL}/conversations/${convId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${binh.token}` },
      body: JSON.stringify({ content: `priv ${Date.now()}` }),
    })
    await new Promise((r) => setTimeout(r, 800))
    anSocket.off('admin:message', onLeak)
    if (leaked) throw new Error('regular user leaked admin:message event!')
  })

  console.log('')
  console.log(`Summary:  ${green(String(pass))} pass · ${fail > 0 ? red(String(fail)) : '0'} fail`)
  sockets.forEach((s) => s.disconnect())
  process.exit(fail > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('crashed:', err)
  sockets.forEach((s) => s.disconnect())
  process.exit(1)
})
