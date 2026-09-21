import * as Address from './Address.js'
import * as Bytes from './Bytes.js'
import * as Errors from './Errors.js'
import * as Hex from './Hex.js'

/** An EIP-8141 call frame. */
export type Frame<bigintType = bigint> = {
  /** Frame calldata. */
  data: Hex.Hex
  /** Execution gas budget. */
  executionGasLimit: bigintType
  /** Approval scope and atomic batching bits. */
  flags: Flags
  /** Execution context: default, verify, or sender. */
  mode: Mode
  /** State gas budget. */
  stateGasLimit: bigintType
  /** Target address. Omit to target the transaction sender. */
  target?: Address.Address | undefined
  /** Value transferred by a sender frame, in wei. */
  value: bigintType
}

/** Frame execution modes. */
export const modes = { default: 0, sender: 2, verify: 1 } as const

/** A numeric or named frame execution mode. */
export type Mode = number | keyof typeof modes

/** Approval and atomic batching flags. */
export const flags = {
  approveExecution: 2,
  approveExecutionAndPayment: 3,
  approvePayment: 1,
  atomicBatch: 4,
  none: 0,
} as const

/** Numeric approval and batching bits, or a named flag value. */
export type Flags = number | keyof typeof flags

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
 * import { Frame } from 'ox'
 * Frame.assert({
 *   data: '0x',
 *   executionGasLimit: 50_000n,
 *   flags: 'approveExecutionAndPayment',
 *   mode: 'verify',
 *   stateGasLimit: 0n,
 *   value: 0n
 * })
 * ```
 * @param frame - Frame to check.
 */
export function assert(frame: Frame): void {
  const mode = typeof frame.mode === 'string' ? modes[frame.mode] : frame.mode
  if (!Number.isInteger(mode) || mode < 0 || mode > 2)
    throw new InvalidError('mode must be a supported name or 0, 1, or 2.')
  const flags_ =
    typeof frame.flags === 'string' ? flags[frame.flags] : frame.flags
  if (!Number.isInteger(flags_) || flags_ < 0 || flags_ > 7)
    throw new InvalidError(
      'flags must be a supported name or an integer from 0 to 7.',
    )
  if (flags_ & flags.atomicBatch) {
    if (mode === modes.verify)
      throw new InvalidError('VERIFY frames cannot belong to an atomic batch.')
    if (flags_ & flags.approveExecutionAndPayment)
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
  if (mode !== modes.sender && frame.value !== 0n)
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
 * import { Frame } from 'ox'
 * const frame = Frame.from({
 *   data: '0x',
 *   executionGasLimit: 50_000n,
 *   flags: 'approveExecutionAndPayment',
 *   mode: 'verify',
 *   stateGasLimit: 0n,
 *   value: 0n
 * })
 * ```
 * @param frame - Frame to construct.
 * @returns A validated copy of the frame.
 */
export function from<const frame extends Frame>(frame: frame | Frame): frame {
  assert(frame)
  return { ...frame } as frame
}

export declare namespace from {
  type ErrorType = assert.ErrorType
}

/**
 * Decodes a frame tuple with numeric mode and flags. Rejects noncanonical integer encodings.
 *
 * @example
 * ```ts twoslash
 * import { Frame } from 'ox'
 * const frame = Frame.fromTuple([
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
export function fromTuple(tuple: Tuple): Frame {
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
    ...(target === '0x' ? {} : { target }),
    data,
    executionGasLimit: execution === '0x' ? 0n : Hex.toBigInt(execution),
    flags: flags === '0x' ? 0 : Hex.toNumber(flags),
    mode: mode === '0x' ? 0 : Hex.toNumber(mode),
    stateGasLimit: state === '0x' ? 0n : Hex.toBigInt(state),
    value: value === '0x' ? 0n : Hex.toBigInt(value),
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
 * import { Frame } from 'ox'
 * const tuple = Frame.toTuple({
 *   data: '0x',
 *   executionGasLimit: 50_000n,
 *   flags: 'approveExecutionAndPayment',
 *   mode: 'verify',
 *   stateGasLimit: 0n,
 *   value: 0n
 * })
 * ```
 * @param frame - Frame to encode.
 * @returns A canonical frame tuple.
 */
export function toTuple(frame: Frame): Tuple {
  assert(frame)
  const mode = typeof frame.mode === 'string' ? modes[frame.mode] : frame.mode
  const flags_ =
    typeof frame.flags === 'string' ? flags[frame.flags] : frame.flags
  return [
    mode ? Hex.fromBytes(Bytes.fromNumber(mode)) : '0x',
    flags_ ? Hex.fromBytes(Bytes.fromNumber(flags_)) : '0x',
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
 * import { Frame } from 'ox'
 * Frame.validate({
 *   data: '0x',
 *   executionGasLimit: 50_000n,
 *   flags: 'approveExecutionAndPayment',
 *   mode: 'verify',
 *   stateGasLimit: 0n,
 *   value: 0n
 * })
 * ```
 * @param frame - Frame to check.
 * @returns Whether the frame is structurally valid.
 */
export function validate(frame: Frame): boolean {
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
  override readonly name = 'Frame.InvalidError'

  constructor(details: string) {
    super('Invalid frame.', { details })
  }
}
