import type * as Address from '../Address.js'
import type * as Hex from '../Hex.js'
import { LruMap } from './lru.js'

/**
 * Global caches, cleared together by `Caches.clear`.
 * Only `checksum` is public (`Caches.checksum`).
 */
export const caches = {
  checksum: /*#__PURE__*/ new LruMap<Address.Address>(8192),
  signatureHash: /*#__PURE__*/ new LruMap<Hex.Hex>(8192),
}
