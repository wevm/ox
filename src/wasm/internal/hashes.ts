import * as hash from './hash.js'
import { wasmBase64 } from './hashes.wasm.js'
import * as internal from './instantiate.js'

/** Exports shared by the Hash and Keystore providers. @internal */
export type Exports = hash.Exports & {
  keccak256(input: number, length: number, out: number): void
  pbkdf2_sha256(
    password: number,
    passwordLength: number,
    salt: number,
    saltLength: number,
    iterations: number,
    out: number,
    outLength: number,
    scratch: number,
  ): void
  ripemd160(input: number, length: number, out: number): void
  sha256(input: number, length: number, out: number): void
}

const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports>(wasmBase64),
)

/** Returns the one memoized hashes instance shared by its provider modules. */
export function load() {
  return instantiate()
}
