import { caches } from './internal/caches.js'

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
