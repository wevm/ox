import { blake3 as noble_blake3 } from '@noble/hashes/blake3.js'
import { hmac } from '@noble/hashes/hmac.js'
import { ripemd160 as noble_ripemd160 } from '@noble/hashes/legacy.js'
import { sha256 as noble_sha256 } from '@noble/hashes/sha2.js'
import { keccak_256 as noble_keccak256 } from '@noble/hashes/sha3.js'
import { type Complete, type Hash, overrides } from './engine.js'

/**
 * Resolvers for the `Hash` slot, and ox's defaults for it, backed by
 * `@noble/hashes`.
 *
 * Declaring the defaults against the slot contract is what keeps them honest: a
 * default that goes missing, or whose signature drifts, fails to compile rather
 * than failing at the call site.
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
export const blake3: Complete<Hash>['blake3'] = (input) =>
  (overrides.Hash?.blake3 ?? blake3Default)(input)

/** @internal */
export const hmacSha256: Complete<Hash>['hmacSha256'] = (key, message) =>
  (overrides.Hash?.hmacSha256 ?? hmacSha256Default)(key, message)

/** @internal */
export const keccak256: Complete<Hash>['keccak256'] = (input) =>
  (overrides.Hash?.keccak256 ?? keccak256Default)(input)

/** @internal */
export const ripemd160: Complete<Hash>['ripemd160'] = (input) =>
  (overrides.Hash?.ripemd160 ?? ripemd160Default)(input)

/** @internal */
export const sha256: Complete<Hash>['sha256'] = (input) =>
  (overrides.Hash?.sha256 ?? sha256Default)(input)
