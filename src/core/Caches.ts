import type * as Address from './Address.js'
import { BoundedMap } from './internal/lru.js'

const caches = {
  checksum: /*#__PURE__*/ new BoundedMap<Address.Address>(32_768),
}

export const checksum = caches.checksum

/**
 * Clears all global caches.
 *
 * @example
 * ```ts
 * import { Caches } from 'ox'
 * Caches.clear()
 * ```
 */
export function clear() {
  for (const cache of Object.values(caches)) cache.clear()
}
