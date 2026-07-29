import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type * as CoreKzg from '../core/Kzg.js'
import type * as kzg from './internal/kzg.js'

export * from '../core/Kzg.js'

const blobSize = 131_072
const cellSize = 2_048
const cellsPerBlob = 128
const commitmentSize = 48
const g1Points = 4_096
const g2Points = 65
const proofSize = 48

/**
 * Trusted setup points accepted by `create`.
 *
 * Point arrays use the established Ethereum trusted-setup field names. Each
 * field may also be supplied as one packed byte array.
 */
export type TrustedSetup = {
  /** 4,096 G1 points in Lagrange form. */
  readonly g1_lagrange: Bytes.Bytes | readonly string[]
  /** 4,096 G1 points in monomial form. */
  readonly g1_monomial: Bytes.Bytes | readonly string[]
  /** 65 G2 points in monomial form. */
  readonly g2_monomial: Bytes.Bytes | readonly string[]
}

/**
 * Creates an independently owned WASM implementation of [`Kzg.Kzg`](/api/Kzg).
 *
 * The factory compiles the c-kzg artifact once per JavaScript realm. Every call
 * instantiates separate WASM memory and trusted-setup state. Call `dispose` when
 * the instance is no longer needed.
 *
 * Operations on an instance are synchronous and run to completion. JavaScript
 * workers do not share an instance, so create one in each worker that needs KZG.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Setups } from 'ox/trusted-setups'
 * import { Kzg } from 'ox/wasm'
 *
 * const kzg = await Kzg.create({
 *   trustedSetup: Setups.mainnet
 * })
 * // Pass `kzg` anywhere that accepts `Kzg.Kzg`.
 *
 * kzg.dispose()
 * ```
 *
 * @param options - Trusted setup and precomputation options.
 * @returns An initialized KZG implementation with explicit disposal.
 */
export async function create(
  options: create.Options,
): Promise<create.ReturnType> {
  const { trustedSetup } = options
  const precompute = options.precompute ?? 0
  if (!Number.isInteger(precompute) || precompute < 0 || precompute > 8)
    throw new InvalidPrecomputeError({ precompute })

  const setup = {
    g1Lagrange: normalizePoints(
      trustedSetup.g1_lagrange,
      g1Points,
      commitmentSize,
      'g1_lagrange',
    ),
    g1Monomial: normalizePoints(
      trustedSetup.g1_monomial,
      g1Points,
      commitmentSize,
      'g1_monomial',
    ),
    g2Monomial: normalizePoints(
      trustedSetup.g2_monomial,
      g2Points,
      96,
      'g2_monomial',
    ),
  }

  const { instantiate } = await import('./internal/kzg.js')
  let module: Awaited<ReturnType<typeof instantiate>> | undefined =
    await instantiate()

  const getModule = () => {
    if (!module) throw new DisposedError()
    return module
  }

  try {
    const initialized = getModule()
    withBuffers(
      initialized,
      [setup.g1Monomial, setup.g1Lagrange, setup.g2Monomial],
      [],
      ([g1Monomial, g1Lagrange, g2Monomial]) => {
        assertReturn(
          initialized.exports.kzg_initialize(
            g1Monomial!,
            g1Lagrange!,
            g2Monomial!,
            precompute,
          ),
          'initialize',
        )
      },
    )
  } catch (error) {
    module?.exports.kzg_dispose()
    module = undefined
    throw error
  }

  const instance: create.ReturnType = {
    blobToKzgCommitment(blob) {
      assertBytes(blob, blobSize, 'blob')
      return withBuffers(
        getModule(),
        [blob],
        [commitmentSize],
        ([blob], [out]) => {
          const module = getModule()
          assertReturn(
            module.exports.kzg_blob_to_kzg_commitment(out!, blob!),
            'blobToKzgCommitment',
          )
        },
      )[0]!
    },
    computeCells(blob) {
      assertBytes(blob, blobSize, 'blob')
      const bytes = withBuffers(
        getModule(),
        [blob],
        [cellsPerBlob * cellSize],
        ([blob], [cells]) => {
          const module = getModule()
          assertReturn(
            module.exports.kzg_compute_cells(cells!, blob!),
            'computeCells',
          )
        },
      )[0]!
      return split(bytes, cellSize)
    },
    computeCellsAndKzgProofs(blob) {
      assertBytes(blob, blobSize, 'blob')
      const [cells, proofs] = withBuffers(
        getModule(),
        [blob],
        [cellsPerBlob * cellSize, cellsPerBlob * proofSize],
        ([blob], [cells, proofs]) => {
          const module = getModule()
          assertReturn(
            module.exports.kzg_compute_cells_and_kzg_proofs(
              cells!,
              proofs!,
              blob!,
            ),
            'computeCellsAndKzgProofs',
          )
        },
      )
      return {
        cells: split(cells!, cellSize),
        proofs: split(proofs!, proofSize),
      }
    },
    dispose() {
      if (!module) return
      const initialized = module
      module = undefined
      initialized.exports.kzg_dispose()
    },
    recoverCellsAndKzgProofs(cellIndices, cells) {
      if (cellIndices.length !== cells.length)
        throw new InvalidInputError({
          message: '`cellIndices` and `cells` must have the same length.',
        })
      if (cells.length < 64 || cells.length > cellsPerBlob)
        throw new InvalidInputError({
          message: '`cells` must contain between 64 and 128 cells.',
        })
      assertCellIndices(cellIndices, true)
      for (const cell of cells) assertBytes(cell, cellSize, 'cell')

      const values = cellIndices
        .map((index, i) => ({ cell: cells[i]!, index }))
        .sort((a, b) => a.index - b.index)
      const indices = values.map(({ index }) => index)
      const sortedCells = values.map(({ cell }) => cell)

      const [recoveredCells, proofs] = withBuffers(
        getModule(),
        [encodeIndices(indices), concat(sortedCells)],
        [cellsPerBlob * cellSize, cellsPerBlob * proofSize],
        ([indices, cells], [recoveredCells, proofs]) => {
          const module = getModule()
          assertReturn(
            module.exports.kzg_recover_cells_and_kzg_proofs(
              recoveredCells!,
              proofs!,
              indices!,
              cells!,
              values.length,
            ),
            'recoverCellsAndKzgProofs',
          )
        },
      )
      return {
        cells: split(recoveredCells!, cellSize),
        proofs: split(proofs!, proofSize),
      }
    },
    verifyCellKzgProofBatch(commitments, cellIndices, cells, proofs) {
      const count = commitments.length
      if (
        count === 0 ||
        cellIndices.length !== count ||
        cells.length !== count ||
        proofs.length !== count
      )
        throw new InvalidInputError({
          message:
            '`commitments`, `cellIndices`, `cells`, and `proofs` must have the same non-zero length.',
        })
      assertCellIndices(cellIndices, false)
      for (const commitment of commitments)
        assertBytes(commitment, commitmentSize, 'commitment')
      for (const cell of cells) assertBytes(cell, cellSize, 'cell')
      for (const proof of proofs) assertBytes(proof, proofSize, 'proof')

      return (
        withBuffers(
          getModule(),
          [
            concat(commitments),
            encodeIndices(cellIndices),
            concat(cells),
            concat(proofs),
          ],
          [4],
          ([commitments, indices, cells, proofs], [verified]) => {
            const module = getModule()
            assertReturn(
              module.exports.kzg_verify_cell_kzg_proof_batch(
                verified!,
                commitments!,
                indices!,
                cells!,
                proofs!,
                count,
              ),
              'verifyCellKzgProofBatch',
            )
          },
        )[0]![0] === 1
      )
    },
  }
  return instance
}

export declare namespace create {
  /** Options for `create`. */
  type Options = {
    /**
     * Fixed-base MSM window from 0 through 8.
     *
     * `0` performs no fixed-base precomputation and uses the least memory.
     * Larger values improve proof generation at an exponential memory cost.
     *
     * @default 0
     */
    precompute?: number | undefined
    /** Ethereum trusted-setup points. */
    trustedSetup: TrustedSetup
  }

  /** An initialized KZG implementation with explicit lifecycle ownership. */
  type ReturnType = CoreKzg.Kzg & {
    /**
     * Releases the trusted setup and makes every operation throw.
     *
     * Disposal is idempotent.
     */
    dispose(): void
  }

  type ErrorType =
    | DisposedError
    | InvalidInputError
    | InvalidPrecomputeError
    | InvalidTrustedSetupError
    | MemoryError
    | WasmError
    | Errors.GlobalErrorType
}

function assertBytes(value: Bytes.Bytes, size: number, name: string) {
  if (!(value instanceof Uint8Array) || value.length !== size)
    throw new InvalidInputError({
      message: `\`${name}\` must contain exactly ${size} bytes.`,
    })
}

function assertCellIndices(indices: readonly number[], unique: boolean) {
  const seen = new Set<number>()
  for (const index of indices) {
    if (!Number.isInteger(index) || index < 0 || index >= cellsPerBlob)
      throw new InvalidInputError({
        message: '`cellIndices` must contain integers from 0 through 127.',
      })
    if (unique && seen.has(index))
      throw new InvalidInputError({
        message: '`cellIndices` must not contain duplicate indices.',
      })
    seen.add(index)
  }
}

function assertReturn(value: number, operation: string) {
  if (value === 0) return
  if (value === 1)
    throw operation === 'initialize'
      ? new InvalidTrustedSetupError()
      : new InvalidInputError({ message: `c-kzg rejected \`${operation}\`.` })
  if (value === 3) throw new MemoryError()
  throw new WasmError({ operation })
}

function concat(values: readonly Bytes.Bytes[]) {
  const size = values.reduce((size, value) => size + value.length, 0)
  const result = new Uint8Array(size)
  let offset = 0
  for (const value of values) {
    result.set(value, offset)
    offset += value.length
  }
  return result
}

function encodeIndices(indices: readonly number[]) {
  const bytes = new Uint8Array(indices.length * 8)
  const view = new DataView(bytes.buffer)
  for (let i = 0; i < indices.length; i++)
    view.setBigUint64(i * 8, BigInt(indices[i]!), true)
  return bytes
}

function normalizePoints(
  value: Bytes.Bytes | readonly string[],
  count: number,
  size: number,
  name: keyof TrustedSetup,
) {
  const expected = count * size
  if (value instanceof Uint8Array) {
    if (value.length !== expected)
      throw new InvalidTrustedSetupError({
        message: `\`${name}\` must contain exactly ${expected} bytes.`,
      })
    return Uint8Array.from(value)
  }
  if (!Array.isArray(value) || value.length !== count)
    throw new InvalidTrustedSetupError({
      message: `\`${name}\` must contain exactly ${count} points.`,
    })

  const result = new Uint8Array(expected)
  for (let i = 0; i < value.length; i++) {
    const point = value[i]!
    try {
      const bytes = Hex.toBytes(point as Hex.Hex)
      if (bytes.length !== size) throw new Error()
      result.set(bytes, i * size)
    } catch {
      throw new InvalidTrustedSetupError({
        message: `\`${name}[${i}]\` must be a ${size}-byte hex value.`,
      })
    }
  }
  return result
}

function split(value: Bytes.Bytes, size: number) {
  const result: Bytes.Bytes[] = []
  for (let offset = 0; offset < value.length; offset += size)
    result.push(value.slice(offset, offset + size))
  return result
}

function withBuffers(
  module: Awaited<ReturnType<typeof kzg.instantiate>>,
  inputs: readonly Bytes.Bytes[],
  outputs: readonly number[],
  call: (inputs: readonly number[], outputs: readonly number[]) => void,
) {
  const inputPointers: number[] = []
  const outputPointers: number[] = []

  try {
    for (const input of inputs)
      inputPointers.push(allocate(module, input.length))
    for (const size of outputs) outputPointers.push(allocate(module, size))

    const view = module.view()
    for (let i = 0; i < inputs.length; i++)
      view.set(inputs[i]!, inputPointers[i]!)

    call(inputPointers, outputPointers)

    return outputs.map((size, i) =>
      module.view().slice(outputPointers[i]!, outputPointers[i]! + size),
    )
  } catch (cause) {
    if (cause instanceof Errors.BaseError) throw cause
    throw new WasmError({ cause: cause as Error })
  } finally {
    for (let i = 0; i < inputs.length; i++) {
      const pointer = inputPointers[i]
      if (!pointer) continue
      module.exports.zero(pointer, inputs[i]!.length)
      module.exports.dealloc(pointer)
    }
    for (let i = 0; i < outputs.length; i++) {
      const pointer = outputPointers[i]
      if (!pointer) continue
      module.exports.zero(pointer, outputs[i]!)
      module.exports.dealloc(pointer)
    }
  }
}

function allocate(
  module: Awaited<ReturnType<typeof kzg.instantiate>>,
  size: number,
) {
  const pointer = module.exports.alloc(size)
  if (!pointer) throw new MemoryError()
  return pointer
}

/** Thrown when an operation is called after its KZG instance was disposed. */
export class DisposedError extends Errors.BaseError {
  override readonly name = 'Kzg.DisposedError'

  constructor() {
    super('KZG instance has been disposed.')
  }
}

/** Thrown when a KZG operation receives malformed input. */
export class InvalidInputError extends Errors.BaseError {
  override readonly name = 'Kzg.InvalidInputError'

  constructor({ message }: { message: string }) {
    super(message)
  }
}

/** Thrown when `precompute` is outside the supported memory bound. */
export class InvalidPrecomputeError extends Errors.BaseError {
  override readonly name = 'Kzg.InvalidPrecomputeError'

  constructor({ precompute }: { precompute: number }) {
    super(
      `\`precompute\` must be an integer from 0 through 8. Got ${precompute}.`,
    )
  }
}

/** Thrown when c-kzg rejects the trusted setup. */
export class InvalidTrustedSetupError extends Errors.BaseError {
  override readonly name = 'Kzg.InvalidTrustedSetupError'

  constructor(options: { message?: string | undefined } = {}) {
    super(options.message ?? 'c-kzg rejected the trusted setup.')
  }
}

/** Thrown when the KZG artifact reaches its 128 MiB memory limit. */
export class MemoryError extends Errors.BaseError {
  override readonly name = 'Kzg.MemoryError'

  constructor() {
    super('KZG WASM memory limit was exceeded.', {
      metaMessages: [
        'The artifact grows memory on demand up to 128 MiB.',
        'Use a smaller `precompute` value or batch fewer proofs.',
      ],
    })
  }
}

/** Thrown when the KZG artifact traps or reports an internal error. */
export class WasmError extends Errors.BaseError<Error | undefined> {
  override readonly name = 'Kzg.WasmError'

  constructor(
    options: { cause?: Error | undefined; operation?: string | undefined } = {},
  ) {
    super('KZG WASM operation failed.', {
      cause: options.cause,
      metaMessages: options.operation
        ? [`Operation: ${options.operation}`]
        : undefined,
    })
  }
}
