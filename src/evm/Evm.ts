import type * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as Hardfork from './Hardfork.js'
import { analyzed } from './internal/analysis.js'
import { table } from './internal/instructions.js'
import { execute } from './internal/interpreter.js'
import { createFrame, type Machine } from './internal/machine.js'

/** Why execution stopped exceptionally. Exceptional halts consume all gas. */
export type HaltReason =
  | 'call-depth-exceeded'
  | 'code-size-exceeded'
  | 'create-collision'
  | 'initcode-size-exceeded'
  | 'invalid-jump'
  | 'invalid-opcode'
  | 'memory-limit'
  | 'nonce-overflow'
  | 'out-of-gas'
  | 'stack-overflow'
  | 'stack-underflow'
  | 'static-violation'

/** An execution log. Block metadata does not exist at execution time — for
 * the RPC shape, see `Log.Log` in ox core. */
export type Log = Compute<{
  /** Address the log was emitted from. */
  address: Address.Address
  /** Log data. */
  data: Hex.Hex
  /** Log topics. */
  topics: readonly Hex.Hex[]
}>

/** Execution outcome. Halts are data, not exceptions — see
 * {@link ox#evm/Evm.(assertSuccess:function)} for throwing ergonomics. */
export type Result =
  | Compute<{
      status: 'success'
      /** Data passed to `RETURN`. */
      output: Hex.Hex
      /** Gas consumed. */
      gasUsed: bigint
      /** Accumulated gas refund, applied at transaction settlement. */
      gasRefund: bigint
      /** Logs emitted. */
      logs: readonly Log[]
    }>
  | Compute<{
      status: 'reverted'
      /** Revert reason data passed to `REVERT`. */
      output: Hex.Hex
      /** Gas consumed. */
      gasUsed: bigint
    }>
  | Compute<{
      status: 'halted'
      /** Why execution halted. */
      reason: HaltReason
      /** Gas consumed — the full limit, as exceptional halts consume all gas. */
      gasUsed: bigint
    }>

/**
 * Executes bytecode in a single frame over empty state, synchronously.
 *
 * Execution covers the arithmetic, bitwise, comparison, memory, keccak, and
 * control-flow opcodes. Opcodes that need account state (`SLOAD`, `CALL`, …)
 * are not yet part of the dispatch table and halt with `invalid-opcode`.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * // PUSH1 1, PUSH1 2, ADD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
 * const result = Evm.run({
 *   bytecode: '0x60016002015f5260205ff3'
 * })
 * // @log: {
 * // @log:   status: 'success',
 * // @log:   output: '0x0000000000000000000000000000000000000000000000000000000000000003',
 * // @log:   gasUsed: 22n,
 * // @log:   gasRefund: 0n,
 * // @log:   logs: [],
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The execution result.
 */
export function run(options: run.Options): Result {
  const {
    bytecode,
    data = '0x',
    gas = 30_000_000n,
    hardfork = Hardfork.latest,
  } = options

  const instructions = table(hardfork)
  const { analysis, bytes: code } = analyzed(bytecode)
  const input = typeof data === 'string' ? Hex.toBytes(data) : data

  const frame = createFrame({ analysis, code, gas, input })
  const machine: Machine = {
    done: false,
    frames: [frame],
    halt: undefined,
    reverted: false,
    table: instructions,
  }
  execute(machine)

  const gasUsed = gas - frame.gas
  if (machine.halt) return { gasUsed, reason: machine.halt, status: 'halted' }
  const output = frame.output ? Hex.fromBytes(frame.output) : '0x'
  if (machine.reverted) return { gasUsed, output, status: 'reverted' }
  return { gasRefund: 0n, gasUsed, logs: [], output, status: 'success' }
}

export declare namespace run {
  type Options = {
    /** Bytecode to execute. */
    bytecode: Hex.Hex | Uint8Array
    /** Calldata. @default '0x' */
    data?: Hex.Hex | Uint8Array | undefined
    /** Gas limit. @default 30_000_000n */
    gas?: bigint | undefined
    /** Hardfork whose rules to execute under. @default Hardfork.latest */
    hardfork?: Hardfork.Hardfork | undefined
  }

  type ErrorType =
    | Hardfork.UnknownHardforkError
    | Hex.toBytes.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Narrows a {@link ox#evm/Evm.(Result:type)} to its success variant, throwing
 * for the others.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const result = Evm.run({
 *   bytecode: '0x60016002015f5260205ff3'
 * })
 * Evm.assertSuccess(result)
 * result.output
 * //     ^?
 * ```
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * // PUSH0, PUSH0, REVERT
 * const result = Evm.run({ bytecode: '0x5f5ffd' })
 * Evm.assertSuccess(result)
 * // @error: Evm.RevertedError: Execution reverted.
 * ```
 *
 * @param result - Result to narrow.
 */
export function assertSuccess(
  result: Result,
): asserts result is Extract<Result, { status: 'success' }> {
  if (result.status === 'reverted')
    throw new RevertedError({ data: result.output })
  if (result.status === 'halted')
    throw new HaltedError({ reason: result.reason })
}

export declare namespace assertSuccess {
  type ErrorType = RevertedError | HaltedError | Errors.GlobalErrorType
}

/** Thrown when execution ends in `REVERT`. */
export class RevertedError extends Errors.BaseError {
  override readonly name = 'Evm.RevertedError'

  /** Revert data. */
  readonly data: Hex.Hex

  constructor({ data }: { data: Hex.Hex }) {
    // Pass `metaMessages` only when there is data: `BaseError` treats any
    // array as present and would emit a trailing blank line for `[undefined]`.
    super(
      'Execution reverted.',
      data !== '0x' ? { metaMessages: [`Data: ${data}`] } : {},
    )
    this.data = data
  }
}

/** Thrown when execution halts exceptionally — out of gas, a stack violation,
 * an undefined opcode, or a jump to a non-`JUMPDEST`. */
export class HaltedError extends Errors.BaseError {
  override readonly name = 'Evm.HaltedError'

  /** The halting reason. */
  readonly reason: HaltReason

  constructor({ reason }: { reason: HaltReason }) {
    super(`Execution halted: ${reason}.`)
    this.reason = reason
  }
}
