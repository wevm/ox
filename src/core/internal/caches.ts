import type * as Address from '../Address.js'
import type * as Hex from '../Hex.js'
import { BoundedMap, WeakCache } from './lru.js'

/**
 * Global caches, cleared together by `Caches.clear` and on every engine change.
 * Only `checksum` is public (`Caches.checksum`).
 */
export const caches = {
  checksum: /*#__PURE__*/ new BoundedMap<Address.Address>(32_768),
  signatureHash: /*#__PURE__*/ new BoundedMap<Hex.Hex>(8_192),
  signatureHashByItem: /*#__PURE__*/ new WeakCache<object, Hex.Hex>(),
}
