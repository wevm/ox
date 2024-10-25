import type * as Hex from '../../Hex.js'

/** @internal */
export function encodeLabelhash(hash: Hex.Hex): `[${string}]` {
  return `[${hash.slice(2)}]`
}
