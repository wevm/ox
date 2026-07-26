import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import { wasmBase64 } from './internal/hashes.wasm.js'
import * as internal from './internal/instantiate.js'

export { MemoryError } from './internal/instantiate.js'

type Exports = {
  hmac_sha256(
    key: number,
    keyLength: number,
    message: number,
    messageLength: number,
    out: number,
  ): void
  keccak256(input: number, length: number, out: number): void
  ripemd160(input: number, length: number, out: number): void
  sha256(input: number, length: number, out: number): void
  zero(ptr: number, length: number): void
}

/** Digest sizes, in bytes. */
const digestSize = { hmac_sha256: 32, keccak256: 32, ripemd160: 20, sha256: 32 }

/**
 * Loads the WASM implementation of the {@link ox#Hash} primitives.
 *
 * The returned value is an engine, ready to hand to {@link ox#Engine.set}. WASM
 * must be compiled asynchronously, so this is where the `await` lives —
 * everything afterwards is synchronous.
 *
 * :::note
 * WASM wins on throughput, not on latency. The call boundary costs roughly as
 * much as hashing a short input, so a 32-byte `keccak256` is no faster than the
 * default implementation and may be slower; the gains start at a few hundred
 * bytes and grow from there. Load this when you hash large payloads.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import * as WasmHash from 'ox/wasm/Hash'
 *
 * Engine.set(await WasmHash.load())
 *
 * Hash.keccak256('0xdeadbeef')
 * ```
 *
 * @returns An engine supplying the `Hash` slot.
 */
export const load: () => Promise<Engine.Engine> = internal.memoize(async () => {
  const module = await internal.instantiate<Exports>(wasmBase64)

  // Copies `input` in, runs `hash`, and copies the digest back out.
  function call(
    hash: 'keccak256' | 'ripemd160' | 'sha256',
    input: Uint8Array,
  ): Uint8Array {
    const out = digestSize[hash]
    module.reserve(input.length + out)
    const inputPtr = module.heapBase
    const outPtr = inputPtr + input.length
    module.view().set(input, inputPtr)
    module.exports[hash](inputPtr, input.length, outPtr)
    // `slice`, not `subarray`: the result must not alias WASM memory, which the
    // next call overwrites and a `grow` detaches entirely.
    return module.view().slice(outPtr, outPtr + out)
  }

  return {
    Hash: {
      hmacSha256(key, message) {
        const out = digestSize.hmac_sha256
        module.reserve(key.length + message.length + out)
        const keyPtr = module.heapBase
        const messagePtr = keyPtr + key.length
        const outPtr = messagePtr + message.length
        const view = module.view()
        view.set(key, keyPtr)
        view.set(message, messagePtr)
        module.exports.hmac_sha256(
          keyPtr,
          key.length,
          messagePtr,
          message.length,
          outPtr,
        )
        const digest = module.view().slice(outPtr, outPtr + out)
        // The key is secret; do not leave it sitting in linear memory.
        module.exports.zero(keyPtr, key.length)
        return digest
      },
      keccak256: (input) => call('keccak256', input),
      ripemd160: (input) => call('ripemd160', input),
      sha256: (input) => call('sha256', input),
    },
  }
})

export declare namespace load {
  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
