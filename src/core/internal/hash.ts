import { blake3 as noble_blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { type Complete, engine, type Hash } from './engine.js'

/**
 * ox's default `Hash` implementation, backed by `@noble/hashes`.
 *
 * Every other slot declares its defaults as a single object. This one cannot:
 * `Hash` is the only slot whose consumers use different subsets of it --
 * `BinaryStateTree` wants nothing but blake3 -- and a shared object ties each
 * primitive's `@noble/hashes` import to all the others. Rollup sees through
 * that, but esbuild does not, and measured against a keccak256-only bundle the
 * object form costs it 4.8 kB gzip: 3.8 kB becomes 8.7 kB. So the bindings stay
 * separate, each declared against its slot function so the contract still
 * checks them.
 */

const blake3Default: Complete<Hash>['blake3'] = (input) => noble_blake3(input)

const hmacSha256Default: Complete<Hash>['hmacSha256'] = (key, message) =>
  hmac(noble_sha256, key, message)

const keccak256Default: Complete<Hash>['keccak256'] = (input) =>
  noble_keccak256(input)

const ripemd160Default: Complete<Hash>['ripemd160'] = (input) =>
  noble_ripemd160(input)

const sha256Default: Complete<Hash>['sha256'] = (input) => noble_sha256(input)

/** @internal */
export function blake3(input: Uint8Array): Uint8Array {
  return (engine.Hash?.blake3 ?? blake3Default)(input)
}

/** @internal */
export function hmacSha256(key: Uint8Array, message: Uint8Array): Uint8Array {
  return (engine.Hash?.hmacSha256 ?? hmacSha256Default)(key, message)
}

/** @internal */
export function keccak256(input: Uint8Array): Uint8Array {
  return (engine.Hash?.keccak256 ?? keccak256Default)(input)
}

/** @internal */
export function ripemd160(input: Uint8Array): Uint8Array {
  return (engine.Hash?.ripemd160 ?? ripemd160Default)(input)
}

/** @internal */
export function sha256(input: Uint8Array): Uint8Array {
  return (engine.Hash?.sha256 ?? sha256Default)(input)
}
