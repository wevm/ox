import * as hash from './hash.js'
import {
  keccak256StateSize,
  ripemd160StateSize,
  sha256StateSize,
  wasmBase64,
} from './hashes.wasm.js'
import * as hashState from './hashState.js'
import * as internal from './instantiate.js'

type Algorithm = 'keccak256' | 'ripemd160' | 'sha256'

type StateExports = {
  [key in `${Algorithm}_init`]: (state: number) => void
} & {
  [key in `${Algorithm}_update`]: (
    state: number,
    input: number,
    inputLength: number,
  ) => void
} & {
  [key in `${Algorithm}_finalize`]: (state: number, out: number) => void
}

/** Exports shared by the Hash and Keystore providers. @internal */
export type Exports = hash.Exports &
  hash.StateExports &
  StateExports & {
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

const digestSize = { keccak256: 32, ripemd160: 20, sha256: 32 }
const stateSize = {
  keccak256: keccak256StateSize,
  ripemd160: ripemd160StateSize,
  sha256: sha256StateSize,
}

const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports>(wasmBase64),
)

/** Returns the one memoized hashes instance shared by its provider modules. */
export function load() {
  return instantiate()
}

/** Creates an incremental state for one of the shared hash primitives. @internal */
export function create(module: internal.Module<Exports>, hash: Algorithm) {
  return hashState.create(module, {
    digestSize: digestSize[hash],
    finalize: (exports, state, out) => exports[`${hash}_finalize`](state, out),
    init: (exports, state) => exports[`${hash}_init`](state),
    stateSize: stateSize[hash],
    update: (exports, state, input, inputLength) =>
      exports[`${hash}_update`](state, input, inputLength),
  })
}
