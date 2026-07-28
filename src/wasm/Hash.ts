import type * as Engine from '../core/Engine.js'
import type * as Errors from '../core/Errors.js'
import * as blake3 from './internal/blake3.js'
import * as hash from './internal/hash.js'
import * as hashes from './internal/hashes.js'
import * as internal from './internal/instantiate.js'

export * from '../core/Hash.js'
export { MemoryError } from './internal/instantiate.js'

/** Digest sizes, in bytes. */
const digestSize = { keccak256: 32, ripemd160: 20, sha256: 32 }

/**
 * Compiles the WASM implementation of the [`Hash`](/api/Hash) primitives,
 * without installing it.
 *
 * Most callers want
 * [`Engine.install`](/wasm/crypto/Engine/install) instead, which compiles every
 * implementation this entrypoint provides and installs them in one call. Reach
 * for this to take the `Hash` slot on its own, or to hold the implementation
 * without touching the installed engine.
 *
 * :::note
 * Performance varies by primitive, input size, runtime, and processor. Run
 * `pnpm bench:engines` to compare Ox's default, Node, WASM, and Alloy
 * implementations on your target machine.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine } from 'ox'
 * import { Hash } from 'ox/wasm'
 *
 * await Engine.install({ Hash: Hash.engine() })
 *
 * Hash.blake3('0xdeadbeef')
 * ```
 *
 * @returns The WASM implementation of the `Hash` slot.
 */
export async function engine(): Promise<engine.ReturnType> {
  {
    const [blake3Module, module] = await Promise.all([
      blake3.load(),
      hashes.load(),
    ])

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
      blake3: (input) => blake3.hash(blake3Module, input),
      hmacSha256: (key, message) => hash.hmacSha256(module, key, message),
      keccak256: (input) => call('keccak256', input),
      ripemd160: (input) => call('ripemd160', input),
      sha256: (input) => call('sha256', input),
    }
  }
}

export declare namespace engine {
  /** Every `Hash` primitive this module implements. */
  type ReturnType = {
    [key in
      | 'blake3'
      | 'hmacSha256'
      | 'keccak256'
      | 'ripemd160'
      | 'sha256']-?: NonNullable<Engine.Hash[key]>
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
