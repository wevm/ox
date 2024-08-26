import type { Address } from 'abitype'
import { LruMap } from './lru.js'

const caches = {
  checksum: /*#__PURE__*/ new LruMap<Address>(8192),
}

export const Caches_checksum = caches.checksum

/**
 * Clears all global caches.
 *
 * @example
 * ```ts
 * import { Caches } from 'ox'
 * Caches.clear()
 * ```
 */
export function Caches_clear() {
  for (const cache of Object.values(caches)) cache.clear()
}
