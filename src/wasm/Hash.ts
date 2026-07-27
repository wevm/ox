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
 * Compilation is memoized; the engine object deliberately is not.
 *
 * Handing every caller the same object means one of them customising a slot
 * for composition silently changes what a later `create` -- or `Engine.load`
 * -- installs.
 *
 * @internal
 */
const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports>(wasmBase64),
)

/**
 * Compiles the WASM implementation of the [`Hash`](/api/Hash) primitives, without
 * installing it.
 *
 * Most callers want {@link ox#Engine.load} instead, which compiles every
 * implementation this entrypoint provides and installs them in one call. Reach
 * for this to take the `Hash` slot on its own, or to hold the implementation
 * without touching the installed engine.
 *
 * :::note
 * Performance varies by primitive, input size, runtime, and processor. Run
 * `pnpm bench:hash` to compare Ox's default, Node, WASM, and Alloy
 * implementations on your target machine.
 * :::
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Engine, Hash } from 'ox'
 * import * as WasmHash from 'ox/wasm/Hash'
 *
 * Engine.set(await WasmHash.create())
 *
 * Hash.keccak256('0xdeadbeef')
 * ```
 *
 * @returns An engine supplying the `Hash` slot.
 */
export async function create(): Promise<create.ReturnType> {
  {
    const module = await instantiate()

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
          try {
            view.set(key, keyPtr)
            view.set(message, messagePtr)
            module.exports.hmac_sha256(
              keyPtr,
              key.length,
              messagePtr,
              message.length,
              outPtr,
            )
            return module.view().slice(outPtr, outPtr + out)
          } finally {
            // The key is secret; do not leave it sitting in linear memory, even
            // when copying, hashing, or copying the digest back out throws.
            module.exports.zero(keyPtr, key.length)
          }
        },
        keccak256: (input) => call('keccak256', input),
        ripemd160: (input) => call('ripemd160', input),
        sha256: (input) => call('sha256', input),
      },
    }
  }
}

export declare namespace create {
  /**
   * The `Hash` slot, carrying every primitive this module implements.
   *
   * {@link ox#Engine.Engine} is optional all the way down so that an engine can
   * fill in as little as it likes. This one always fills the same four, and
   * saying so is what spares callers a non-null assertion per primitive.
   */
  type ReturnType = {
    Hash: {
      [key in
        | 'hmacSha256'
        | 'keccak256'
        | 'ripemd160'
        | 'sha256']-?: NonNullable<Engine.Hash[key]>
    }
  }

  type ErrorType = internal.MemoryError | Errors.GlobalErrorType
}
