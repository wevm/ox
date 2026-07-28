import { wasmBase64 } from './blake3.wasm.js'
import * as internal from './instantiate.js'

const digestSize = 32
const wasm32Size = 0x1_0000_0000

/** Exports supplied by the dedicated portable BLAKE3 artifact. @internal */
export type Exports = {
  blake3_hash(input: number, length: number, out: number): void
  zero(ptr: number, length: number): void
}

const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports>(wasmBase64),
)

/** Returns the one memoized BLAKE3 instance shared by its providers. */
export function load() {
  return instantiate()
}

/** Hashes an input through a loaded BLAKE3 module. @internal */
export function hash(
  module: internal.Module<Exports>,
  input: Uint8Array,
): Uint8Array {
  const inputPtr = module.heapBase
  const end = inputPtr + input.length + digestSize
  if (!Number.isSafeInteger(end) || end > wasm32Size)
    throw new internal.MemoryError({
      bytes: end,
      cause: new RangeError('BLAKE3 workspace exceeds wasm32 memory.'),
    })

  const outPtr = inputPtr + input.length
  const size = end - inputPtr
  module.reserve(size)
  try {
    module.view().set(input, inputPtr)
    module.exports.blake3_hash(inputPtr, input.length, outPtr)
    return module.view().slice(outPtr, outPtr + digestSize)
  } finally {
    module.exports.zero(inputPtr, size)
  }
}
