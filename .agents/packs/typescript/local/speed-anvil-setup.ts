/**
 * Vitest setup file for the typescript pack's speed recording. It notes the anvil
 * instances each test file reaches and destroys them after the file: prool names an instance by a
 * pool id that each test file picks, and keeps every instance running until the run ends, so 20
 * files would leave 20 mainnet forks running.
 *
 * @module
 */

import { afterAll } from 'vitest'

/** The port of the anvil instance server the global setup starts (test/prool.ts). */
const anvilPort = '8545'

const g = globalThis as typeof globalThis & {
  __oxSpeedAnvil?: { fetch: typeof fetch; nodes: Set<string> }
}
const anvil = (g.__oxSpeedAnvil ??= install())

afterAll(async () => {
  await Promise.all(
    [...anvil.nodes].map((node) =>
      anvil.fetch(`${node}/destroy`).catch(() => undefined),
    ),
  )
  anvil.nodes.clear()
})

function install() {
  const fetch = globalThis.fetch
  const nodes = new Set<string>()
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input : input.url,
    )
    const id = url.pathname.match(/^\/(\d+)(\/|$)/)?.[1]
    if (
      id &&
      url.port === anvilPort &&
      /^(localhost|127\.0\.0\.1|\[::1\])$/.test(url.hostname)
    )
      nodes.add(`${url.origin}/${id}`)
    return fetch(input, init)
  }) as typeof fetch
  return { fetch, nodes }
}
