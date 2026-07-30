import type * as Engine from '../../core/Engine.js'
import type { Module } from './instantiate.js'
import { MemoryError } from './instantiate.js'

/** Exports required by every incremental hash state. @internal */
export type Exports = {
  zero(ptr: number, length: number): void
}

/** Parameters for creating a host-owned incremental hash state. @internal */
export type Options<exports extends Exports> = {
  digestSize: number
  finalize: (exports: exports, state: number, out: number) => void
  init: (
    exports: exports,
    state: number,
    input: number,
    inputLength: number,
  ) => void
  input?: Uint8Array | undefined
  stateSize: number
  update: (
    exports: exports,
    state: number,
    input: number,
    inputLength: number,
  ) => void
}

const alignment = 8
const wasm32Size = 0x1_0000_0000

function align(value: number) {
  return Math.ceil(value / alignment) * alignment
}

function reserve<exports extends Exports>(
  module: Module<exports>,
  end: number,
) {
  if (!Number.isSafeInteger(end) || end > wasm32Size)
    throw new MemoryError({
      bytes: end,
      cause: new RangeError('Hash workspace exceeds wasm32 memory.'),
    })
  module.reserve(end - module.heapBase)
}

/**
 * Creates a hash state whose authoritative bytes live in host memory.
 *
 * The shared WASM instance only holds a state during one synchronous call.
 * Every workspace is cleared before control returns to the caller.
 *
 * @internal
 */
export function create<exports extends Exports>(
  module: Module<exports>,
  options: Options<exports>,
): Engine.HashState {
  const { digestSize, finalize, init, stateSize, update } = options
  const initial = options.input ?? new Uint8Array()
  const inputPtr = module.heapBase
  const statePtr = align(inputPtr + initial.length)
  const end = statePtr + stateSize
  reserve(module, end)

  let state: Uint8Array
  try {
    module.exports.zero(module.heapBase, end - module.heapBase)
    const view = module.view()
    view.set(initial, inputPtr)
    init(module.exports, statePtr, inputPtr, initial.length)
    state = module.view().slice(statePtr, end)
  } finally {
    module.exports.zero(module.heapBase, end - module.heapBase)
  }

  return fromSnapshot(module, state, {
    digestSize,
    finalize,
    stateSize,
    update,
  })
}

type SnapshotOptions<exports extends Exports> = Pick<
  Options<exports>,
  'digestSize' | 'finalize' | 'stateSize' | 'update'
>

function fromSnapshot<exports extends Exports>(
  module: Module<exports>,
  state: Uint8Array,
  options: SnapshotOptions<exports>,
): Engine.HashState {
  const { digestSize, finalize, stateSize, update } = options
  let active = true

  const assertActive = () => {
    if (!active) throw new Error('Hash state has been destroyed.')
  }

  const hashState: Engine.HashState = {
    clone() {
      assertActive()
      return fromSnapshot(module, state.slice(), options)
    },
    destroy() {
      if (!active) return
      active = false
      state.fill(0)
    },
    digestInto(output) {
      assertActive()
      if (output.length < digestSize)
        throw new RangeError(
          `Digest output requires at least ${digestSize} bytes.`,
        )

      const statePtr = align(module.heapBase)
      const outPtr = statePtr + stateSize
      const end = outPtr + digestSize
      reserve(module, end)
      active = false
      try {
        module.view().set(state, statePtr)
        finalize(module.exports, statePtr, outPtr)
        output.set(module.view().subarray(outPtr, end))
      } finally {
        state.fill(0)
        module.exports.zero(module.heapBase, end - module.heapBase)
      }
    },
    update(input) {
      assertActive()
      const inputPtr = module.heapBase
      const statePtr = align(inputPtr + input.length)
      const end = statePtr + stateSize
      reserve(module, end)
      try {
        const view = module.view()
        view.set(input, inputPtr)
        view.set(state, statePtr)
        update(module.exports, statePtr, inputPtr, input.length)
        state.set(module.view().subarray(statePtr, end))
      } finally {
        module.exports.zero(module.heapBase, end - module.heapBase)
      }
    },
  }

  return hashState
}
