import { blake3StateSize, wasmBase64 } from './blake3.wasm.js'
import * as hashState from './hashState.js'
import * as internal from './instantiate.js'

const digestSize = 32
const wasm32Size = 0x1_0000_0000

/** Exports supplied by the dedicated portable BLAKE3 artifact. @internal */
export type Exports = {
  blake3_hash(input: number, length: number, out: number): void
  zero(ptr: number, length: number): void
}

/** Exports supplied for incremental BLAKE3 states. @internal */
export type StateExports = {
  blake3_finalize(state: number, out: number): void
  blake3_init(state: number): void
  blake3_update(state: number, input: number, inputLength: number): void
  zero(ptr: number, length: number): void
}

const instantiate = /*#__PURE__*/ internal.memoize(() =>
  internal.instantiate<Exports & StateExports>(wasmBase64),
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

/** Creates an incremental BLAKE3 state. @internal */
export function create(module: internal.Module<Exports & StateExports>) {
  return hashState.create(module, {
    digestSize,
    finalize: (exports, state, out) => exports.blake3_finalize(state, out),
    init: (exports, state) => exports.blake3_init(state),
    stateSize: blake3StateSize,
    update: (exports, state, input, inputLength) =>
      exports.blake3_update(state, input, inputLength),
  })
}
