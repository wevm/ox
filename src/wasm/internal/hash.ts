import { hmacSha256ScratchSize, hmacSha256StateSize } from './hashes.wasm.js'
import * as hashState from './hashState.js'
import type { Module } from './instantiate.js'

/** WASM exports used by the HMAC-SHA256 loader. @internal */
export type Exports = {
  hmac_sha256(
    key: number,
    keyLength: number,
    message: number,
    messageLength: number,
    out: number,
    scratch: number,
  ): void
  zero(ptr: number, length: number): void
}

/** WASM exports used by incremental HMAC-SHA256 states. @internal */
export type StateExports = {
  hmac_sha256_finalize(state: number, out: number): void
  hmac_sha256_init(state: number, key: number, keyLength: number): void
  hmac_sha256_update(state: number, input: number, inputLength: number): void
  zero(ptr: number, length: number): void
}

/** Calls HMAC-SHA256 and clears its complete linear-memory region. @internal */
export function hmacSha256(
  module: Module<Exports>,
  key: Uint8Array,
  message: Uint8Array,
): Uint8Array {
  const keyLength = key.length
  const messageLength = message.length
  const out = 32
  const messagePtr = module.heapBase
  const keyPtr = messagePtr + messageLength
  const outPtr = keyPtr + keyLength
  const scratchPtr = Math.ceil((outPtr + out) / 4) * 4
  const end = scratchPtr + hmacSha256ScratchSize
  module.reserve(end - messagePtr)
  const view = module.view()
  try {
    view.set(message, messagePtr)
    view.set(key, keyPtr)
    module.exports.hmac_sha256(
      keyPtr,
      keyLength,
      messagePtr,
      messageLength,
      outPtr,
      scratchPtr,
    )
    return module.view().slice(outPtr, outPtr + out)
  } finally {
    // Clear every byte this call owns, including HMAC working state when
    // copying, hashing, or copying the digest back out throws.
    module.exports.zero(messagePtr, end - messagePtr)
  }
}

/** Creates an incremental HMAC-SHA256 state. @internal */
export function createHmacSha256(
  module: Module<Exports & StateExports>,
  key: Uint8Array,
) {
  return hashState.create(module, {
    digestSize: 32,
    finalize: (exports, state, out) => exports.hmac_sha256_finalize(state, out),
    init: (exports, state, input, inputLength) =>
      exports.hmac_sha256_init(state, input, inputLength),
    input: key,
    stateSize: hmacSha256StateSize,
    update: (exports, state, input, inputLength) =>
      exports.hmac_sha256_update(state, input, inputLength),
  })
}
