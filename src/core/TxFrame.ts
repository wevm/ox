import * as Address from './Address.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'

/** An EIP-8141 call frame. */
export type TxFrame<bigintType = bigint> = {
  /** Execution context: default, verify, or sender. */
  mode: Mode
  /** Approval scope and atomic batching bits. */
  flags: number
  /** Target address. Omit to target the transaction sender. */
  target?: Address.Address | undefined
  /** Execution gas budget. */
  executionGasLimit: bigintType
  /** State gas budget. */
  stateGasLimit: bigintType
  /** Value transferred by a sender frame, in wei. */
  value: bigintType
  /** Frame calldata. */
  data: Hex.Hex
}

/** Frame execution modes. */
export const modes = { default: 0, verify: 1, sender: 2 } as const

/** A frame execution mode. */
export type Mode = (typeof modes)[keyof typeof modes]

/** Approval and atomic batching flags. */
export const flags = {
  none: 0,
  approvePayment: 1,
  approveExecution: 2,
  approveExecutionAndPayment: 3,
  atomicBatch: 4,
} as const

/** RLP-ready frame tuple. Empty target bytes refer to the transaction sender. */
export type Tuple = readonly [
  mode: Hex.Hex,
  flags: Hex.Hex,
  target: Hex.Hex,
  limits: readonly [execution: Hex.Hex, state: Hex.Hex],
  value: Hex.Hex,
  data: Hex.Hex,
]

/**
 * Asserts frame-local constraints. Sender-dependent approval, batch adjacency,
 * expiry, and transaction-wide gas constraints require the enclosing transaction.
 *
 * @example
 * ```ts twoslash
 * import { TxFrame } from 'ox'
 * TxFrame.assert({
 *   mode: 1,
 *   flags: 3,
 *   executionGasLimit: 50_000n,
 *   stateGasLimit: 0n,
 *   value: 0n,
 *   data: '0x'
 * })
 * ```
 * @param frame - Frame to check.
 */
export function assert(frame: TxFrame): void {
  if (!Number.isInteger(frame.mode) || frame.mode < 0 || frame.mode > 2)
    throw new InvalidError('mode must be 0, 1, or 2.')
  if (!Number.isInteger(frame.flags) || frame.flags < 0 || frame.flags > 7)
    throw new InvalidError('flags must be an integer from 0 to 7.')
  if (frame.flags & flags.atomicBatch) {
    if (frame.mode === modes.verify)
      throw new InvalidError('VERIFY frames cannot belong to an atomic batch.')
    if (frame.flags & flags.approveExecutionAndPayment)
      throw new InvalidError(
        'Atomic batch frames cannot approve execution or payment.',
      )
  }
  if (frame.target !== undefined)
    Address.assert(frame.target, { strict: false })
  for (const field of ['executionGasLimit', 'stateGasLimit'] as const)
    if (
      typeof frame[field] !== 'bigint' ||
      frame[field] < 0n ||
      frame[field] >= 2n ** 64n
    )
      throw new InvalidError(`${field} must be an unsigned 64-bit integer.`)
  if (frame.executionGasLimit + frame.stateGasLimit >= 2n ** 64n)
    throw new InvalidError('Combined frame gas must be less than 2^64.')
  if (
    typeof frame.value !== 'bigint' ||
    frame.value < 0n ||
    frame.value >= 2n ** 256n
  )
    throw new InvalidError('value must be an unsigned 256-bit integer.')
  if (frame.mode !== modes.sender && frame.value !== 0n)
    throw new InvalidError('Only SENDER frames can transfer value.')
  Hex.assert(frame.data, { strict: true })
  if (frame.data.length % 2 !== 0)
    throw new InvalidError('data must contain whole bytes.')
}

export declare namespace assert {
  type ErrorType =
    | InvalidError
    | Address.assert.ErrorType
    | Hex.assert.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Constructs a frame, preserving literal types.
 *
 * @example
 * ```ts twoslash
 * import { TxFrame } from 'ox'
 * const frame = TxFrame.from({
 *   mode: 1,
 *   flags: 3,
 *   executionGasLimit: 50_000n,
 *   stateGasLimit: 0n,
 *   value: 0n,
 *   data: '0x'
 * })
 * ```
 * @param frame - Frame to construct.
 * @returns A validated copy of the frame.
 */
export function from<const frame extends TxFrame>(
  frame: frame | TxFrame,
): frame {
  assert(frame)
  return { ...frame } as frame
}

export declare namespace from {
  type ErrorType = assert.ErrorType
}

/**
 * Decodes a frame tuple. Rejects noncanonical integer encodings.
 *
 * @example
 * ```ts twoslash
 * import { TxFrame } from 'ox'
 * const frame = TxFrame.fromTuple([
 *   '0x01',
 *   '0x03',
 *   '0x',
 *   ['0xc350', '0x'],
 *   '0x',
 *   '0x'
 * ])
 * ```
 * @param tuple - RLP-decoded frame tuple.
 * @returns The decoded frame.
 */
export function fromTuple(tuple: Tuple): TxFrame {
  if (
    !Array.isArray(tuple) ||
    tuple.length !== 6 ||
    !Array.isArray(tuple[3]) ||
    tuple[3].length !== 2
  )
    throw new InvalidError(
      'Expected [mode, flags, target, [execution, state], value, data].',
    )
  const [mode, flags, target, [execution, state], value, data] = tuple
  Hex.assert(target, { strict: true })
  const quantities = [mode, flags, execution, state, value]
  for (const quantity of quantities) {
    Hex.assert(quantity, { strict: true })
    if (quantity.length % 2 !== 0 || quantity.startsWith('0x00'))
      throw new InvalidError(
        'Integers must use minimal whole-byte encodings, with empty bytes for zero.',
      )
  }
  const frame = {
    mode: (mode === '0x' ? 0 : Hex.toNumber(mode)) as Mode,
    flags: flags === '0x' ? 0 : Hex.toNumber(flags),
    ...(target === '0x' ? {} : { target }),
    executionGasLimit: execution === '0x' ? 0n : Hex.toBigInt(execution),
    stateGasLimit: state === '0x' ? 0n : Hex.toBigInt(state),
    value: value === '0x' ? 0n : Hex.toBigInt(value),
    data,
  }
  assert(frame)
  return frame
}

export declare namespace fromTuple {
  type ErrorType =
    | assert.ErrorType
    | Hex.toNumber.ErrorType
    | Hex.toBigInt.ErrorType
}

/**
 * Converts a frame to its RLP-ready tuple.
 *
 * @example
 * ```ts twoslash
 * import { TxFrame } from 'ox'
 * const tuple = TxFrame.toTuple({
 *   mode: 1,
 *   flags: 3,
 *   executionGasLimit: 50_000n,
 *   stateGasLimit: 0n,
 *   value: 0n,
 *   data: '0x'
 * })
 * ```
 * @param frame - Frame to encode.
 * @returns A canonical frame tuple.
 */
export function toTuple(frame: TxFrame): Tuple {
  assert(frame)
  return [
    frame.mode ? Hex.fromBytes(Bytes.fromNumber(frame.mode)) : '0x',
    frame.flags ? Hex.fromBytes(Bytes.fromNumber(frame.flags)) : '0x',
    frame.target ?? '0x',
    [
      frame.executionGasLimit
        ? Hex.fromBytes(Bytes.fromNumber(frame.executionGasLimit))
        : '0x',
      frame.stateGasLimit
        ? Hex.fromBytes(Bytes.fromNumber(frame.stateGasLimit))
        : '0x',
    ],
    frame.value ? Hex.fromBytes(Bytes.fromNumber(frame.value)) : '0x',
    frame.data,
  ]
}

export declare namespace toTuple {
  type ErrorType =
    | assert.ErrorType
    | Bytes.fromNumber.ErrorType
    | Hex.fromBytes.ErrorType
}

/**
 * Returns whether a frame satisfies frame-local constraints.
 *
 * @example
 * ```ts twoslash
 * import { TxFrame } from 'ox'
 * TxFrame.validate({
 *   mode: 1,
 *   flags: 3,
 *   executionGasLimit: 50_000n,
 *   stateGasLimit: 0n,
 *   value: 0n,
 *   data: '0x'
 * })
 * ```
 * @param frame - Frame to check.
 * @returns Whether the frame is structurally valid.
 */
export function validate(frame: TxFrame): boolean {
  try {
    assert(frame)
    return true
  } catch {
    return false
  }
}

export declare namespace validate {
  type ErrorType = Errors.GlobalErrorType
}

/** Thrown when an EIP-8141 frame is structurally invalid. */
export class InvalidError extends Errors.BaseError {
  override readonly name = 'TxFrame.InvalidError'

  constructor(details: string) {
    super('Invalid frame.', { details })
  }
}
