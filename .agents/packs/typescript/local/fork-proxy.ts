/**
 * The mainnet fork proxy that anvil forks from while the typescript pack's speed script
 * records ox's tests. `speed.environment` in config.ts starts it.
 *
 * @module
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

const root = path.resolve(import.meta.dirname, '../../../..')

/**
 * A JSON-RPC server for anvil to fork from, which answers each request from a cache of what
 * mainnet nodes answered, kept in `file` across recordings, and asks upstream only for requests it
 * has not seen. ox's tests fork mainnet at a fixed block, whose state never changes, so the cached
 * answers stay right and recordings repeat. Upstream is `VITE_ANVIL_FORK_URL` or thirdweb, as in
 * test/prool.ts, then other public archive nodes, each tried in turn, with backoff between rounds,
 * when one is rate limited or lacks the state, so a public node's rate limit does not fail the
 * tests that use anvil.
 */
export function forkProxy(file: string) {
  const upstreams = [
    process.env.VITE_ANVIL_FORK_URL ?? 'https://1.rpc.thirdweb.com',
    'https://eth.drpc.org',
    'https://rpc.mevblocker.io',
    'https://eth-mainnet.public.blastapi.io',
  ]
  type Answer = { result?: unknown; error?: { code?: number } | undefined }
  const cache = new Map<string, Answer>(
    fs.existsSync(file)
      ? Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))
      : [],
  )
  const pending = new Map<string, Promise<Answer>>()
  const stats = { cached: 0, fetched: 0, failed: 0 }
  const ask = async (method: string, params: unknown): Promise<Answer> => {
    let last: Answer = { error: { code: -32603 } }
    for (let round = 0; round < 4; round++) {
      if (round) await Bun.sleep(500 * 2 ** round)
      for (const upstream of upstreams) {
        const body = await fetch(upstream, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
          signal: AbortSignal.timeout(10_000),
        })
          .then((response) => (response.ok ? response.json() : undefined))
          .catch(() => undefined)
        if (!body || typeof body !== 'object') continue
        const { result, error } = body as Answer
        if (error === undefined) return { result }
        // "Method not found" is the answer, as when anvil asks whether upstream is anvil. Any
        // other error, such as a rate limit or missing historical state, is one node's.
        last = { error }
        if (error.code === -32601) return last
      }
    }
    return { ...last, failed: true } as Answer
  }
  const answer = (method: string, params: unknown) => {
    const key = `${method}\0${JSON.stringify(params ?? [])}`
    const cached = cache.get(key)
    if (cached) {
      stats.cached++
      return cached
    }
    let promise = pending.get(key)
    if (!promise) {
      promise = ask(method, params).then(
        ({ failed, ...value }: Answer & { failed?: boolean }) => {
          pending.delete(key)
          if (failed) stats.failed++
          else {
            cache.set(key, value)
            stats.fetched++
          }
          return value
        },
      )
      pending.set(key, promise)
    }
    return promise
  }
  type Request = { id?: unknown; method: string; params?: unknown }
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    idleTimeout: 0,
    async fetch(request) {
      const body = (await request.json()) as Request | Request[]
      const requests = Array.isArray(body) ? body : [body]
      const responses = await Promise.all(
        requests.map(async ({ id, method, params }) => ({
          jsonrpc: '2.0',
          id,
          ...(await answer(method, params)),
        })),
      )
      return Response.json(Array.isArray(body) ? responses : responses[0])
    },
  })
  return {
    url: `http://127.0.0.1:${server.port}`,
    stop() {
      server.stop(true)
      process.stdout.write(
        `Anvil's fork: ${stats.cached} requests answered from ${path.relative(root, file)}, ${stats.fetched} from mainnet nodes, ${stats.failed} failed.\n`,
      )
      if (!stats.fetched) return
      fs.writeFileSync(
        `${file}.${process.pid}`,
        JSON.stringify(Object.fromEntries(cache)),
      )
      fs.renameSync(`${file}.${process.pid}`, file)
    },
  }
}
