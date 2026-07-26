import { blake3 as noble_blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { engine } from './engine.js'

/**
 * Hash resolvers shared by every ox module that hashes.
 *
 * Each primitive gets its own top-level function so that its `@noble/*` import
 * is referenced from exactly one function body. A bundle that retains only
 * `blake3` can then drop the other four import edges -- collapsing these into a
 * single object would defeat that.
 *
 * @internal
 */

/** @internal */
export function blake3(input: Uint8Array): Uint8Array {
  return (engine.Hash?.blake3 ?? noble_blake3)(input)
}

function hmacSha256Default(key: Uint8Array, message: Uint8Array): Uint8Array {
  return hmac(noble_sha256, key, message)
}

/** @internal */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  return (engine.Hash?.hmacSha256 ?? hmacSha256Default)(key, message)
}

/** @internal */
export function keccak256(input: Uint8Array): Uint8Array {
  return (engine.Hash?.keccak256 ?? noble_keccak256)(input)
}

/** @internal */
export function ripemd160(input: Uint8Array): Uint8Array {
  return (engine.Hash?.ripemd160 ?? noble_ripemd160)(input)
}

/** @internal */
export function sha256(input: Uint8Array): Uint8Array {
  return (engine.Hash?.sha256 ?? noble_sha256)(input)
}
