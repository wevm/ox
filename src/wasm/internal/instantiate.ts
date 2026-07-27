import * as Errors from '../../core/Errors.js'

/**
 * Shared WASM instantiation and memory plumbing.
 *
 * @internal
 */

/** An instantiated WASM module, with helpers for moving bytes across. */
export type Module<exports extends Record<string, unknown>> = {
  /** The module's exported functions. */
  exports: exports
  /** Address of the first byte we may write to. */
  heapBase: number
  /**
   * Grows linear memory so `bytes` are available above `heapBase`.
   *
   * @throws {@link MemoryError} when the runtime refuses to grow.
   */
  reserve(bytes: number): void
  /**
   * A view over the module's current memory.
   *
   * Must be called after {@link Module.reserve} and again after anything that
   * could grow memory: `WebAssembly.Memory.grow` detaches the previous
   * `ArrayBuffer`, which silently turns any retained view into a zero-length one.
   */
  view(): Uint8Array
}

const pageSize = 65_536

function decode(base64: string): Uint8Array {
  // `Uint8Array.fromBase64` where available, then Node/Bun, then browsers and
  // edge runtimes.
  const fromBase64 = (
    Uint8Array as unknown as {
      fromBase64?: ((value: string) => Uint8Array) | undefined
    }
  ).fromBase64
  if (fromBase64) return fromBase64(base64)
  if (typeof Buffer !== 'undefined')
    return new Uint8Array(Buffer.from(base64, 'base64'))
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Instantiates a base64-encoded WASM module.
 *
 * Always asynchronous: browsers refuse to compile modules larger than a few
 * kilobytes synchronously on the main thread, so there is no synchronous path to
 * fall back to. Callers await this once and then call the module synchronously.
 *
 * @internal
 */
export async function instantiate<exports extends Record<string, unknown>>(
  base64: string,
): Promise<Module<exports>> {
  const { instance } = await WebAssembly.instantiate(decode(base64), {})
  const exports = instance.exports as {
    heap_base(): number
    memory: WebAssembly.Memory
  } & exports

  const { memory } = exports
  const heapBase = exports.heap_base()

  let cached = new Uint8Array(memory.buffer)

  return {
    exports,
    heapBase,
    reserve(bytes) {
      const required = heapBase + bytes
      if (memory.buffer.byteLength >= required) return
      const pages = Math.ceil((required - memory.buffer.byteLength) / pageSize)
      try {
        memory.grow(pages)
      } catch (cause) {
        throw new MemoryError({ bytes: required, cause: cause as Error })
      }
      cached = new Uint8Array(memory.buffer)
    },
    view() {
      // `grow` detaches the old buffer, so compare identity rather than trusting
      // the cached view.
      if (cached.buffer !== memory.buffer)
        cached = new Uint8Array(memory.buffer)
      return cached
    },
  }
}

/**
 * Memoizes a loader so concurrent callers compile the module once.
 *
 * The promise is memoized rather than its result, so a second call made while
 * the first is still compiling awaits the same compilation. A rejected attempt
 * is discarded, so a later call can try again.
 *
 * @internal
 */
export function memoize<value>(
  load: () => Promise<value>,
): () => Promise<value> {
  let cached: Promise<value> | undefined
  return () => {
    // Only success is memoized. Compilation can fail for reasons that pass --
    // a runtime briefly out of memory, say -- and caching the rejection would
    // make one bad moment permanent for the life of the process.
    cached ??= load().catch((error) => {
      cached = undefined
      throw error
    })
    return cached
  }
}

/** Thrown when a WASM module cannot grow its memory to the required size. */
export class MemoryError extends Errors.BaseError<Error> {
  override readonly name = 'Wasm.MemoryError'

  constructor({ bytes, cause }: { bytes: number; cause: Error }) {
    super('WASM memory could not be grown to the required size.', {
      cause,
      metaMessages: [
        `Required: ${bytes} bytes`,
        'The input may be too large for this runtime. Reset the engine slot with `Engine.reset` to fall back to the default implementation.',
      ],
    })
  }
}
