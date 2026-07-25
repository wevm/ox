import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import * as load_ from './internal/load.js'

/** Outcome of an execution. */
export type Status =
  | 'success'
  | 'reverted'
  | 'out-of-gas'
  | 'stack-underflow'
  | 'stack-overflow'
  | 'invalid-opcode'
  | 'invalid-jump'
  | 'out-of-memory'
  | 'code-too-large'
  | 'input-too-large'

const statuses = [
  'success',
  'reverted',
  'out-of-gas',
  'stack-underflow',
  'stack-overflow',
  'invalid-opcode',
  'invalid-jump',
  'out-of-memory',
  'code-too-large',
  'input-too-large',
] as const satisfies readonly Status[]

/** Result of an execution. */
export type Result = {
  /** How execution finished. */
  readonly status: Status
  /** Data passed to `RETURN`, or the revert reason for `REVERT`. */
  readonly data: Hex.Hex
  /** Gas consumed. */
  readonly gasUsed: bigint
  /** Gas remaining. */
  readonly gasLeft: bigint
}

/**
 * Prepares the EVM engine.
 *
 * Calling this is optional — {@link ox#evm/Evm.(run:function)} loads the engine
 * on first use. Call it up front to move the one-time WASM instantiation off a
 * latency-sensitive path.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * await Evm.ready()
 * ```
 */
export async function ready(): Promise<void> {
  await load_.load()
}

export declare namespace ready {
  type ErrorType = load_.LoadError | Errors.GlobalErrorType
}

/**
 * Executes bytecode and returns its result.
 *
 * Execution runs in a single frame with no accounts and no storage: the
 * arithmetic, bitwise, comparison, memory, keccak, and control-flow opcodes
 * listed in {@link ox#evm/Opcode.(supported:variable)}. Opcodes that need state
 * throw `Evm.InvalidOpcodeError`.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * // PUSH1 1, PUSH1 2, ADD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
 * const result = await Evm.run({
 *   bytecode: '0x60016002015f5260205ff3',
 * })
 * // @log: {
 * // @log:   status: 'success',
 * // @log:   data: '0x0000000000000000000000000000000000000000000000000000000000000003',
 * // @log:   gasUsed: 22n,
 * // @log:   gasLeft: 29999978n,
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The execution result.
 */
export async function run(options: run.Options): Promise<Result> {
  const { bytecode, data = '0x', gas = 30_000_000n } = options

  const engine = await load_.load()
  const code = typeof bytecode === 'string' ? Hex.toBytes(bytecode) : bytecode
  const input = typeof data === 'string' ? Hex.toBytes(data) : data

  if (!vm) vm = engine.evm_new(0)
  if (!vm) throw new load_.LoadError()

  // Check capacity before writing. The buffers are fixed-size fields inside the
  // engine's VM struct, so an oversized `set` would silently scribble over the
  // fields laid out after them rather than throwing.
  const maxCode = engine.evm_max_code()
  if (code.length > maxCode)
    throw new SizeOverflowError({
      name: 'bytecode',
      givenSize: code.length,
      maxSize: maxCode,
    })
  const maxInput = engine.evm_max_input()
  if (input.length > maxInput)
    throw new SizeOverflowError({
      name: 'data',
      givenSize: input.length,
      maxSize: maxInput,
    })

  // Analysis is a pure function of the bytecode and costs about as much as
  // executing it, so skip both the copy and the analysis when the caller runs
  // the same code again — the common shape for simulation and estimation.
  // Keyed on the caller's `Hex` string, which is cheap to compare; a
  // `Uint8Array` has no comparable identity, so it always re-analyzes.
  const key = typeof bytecode === 'string' ? bytecode : undefined
  if (key === undefined || key !== codeKey) {
    // Re-derive after every engine call: `evm_new` can grow memory, which
    // detaches any view taken before it.
    load_.view(engine).set(code, engine.evm_code_ptr(vm))
    engine.evm_set_code(vm, code.length)
    codeKey = key
  }

  load_.view(engine).set(input, engine.evm_input_ptr(vm))

  const status = engine.evm_run(vm, input.length, gas)
  const gasLeft = engine.evm_gas_left(vm)
  const outputPtr = engine.evm_output_ptr(vm)
  const outputLength = engine.evm_output_len(vm)

  return {
    status: statuses[status] ?? 'invalid-opcode',
    data: Hex.fromBytes(
      load_.view(engine).slice(outputPtr, outputPtr + outputLength),
    ),
    gasUsed: gas - gasLeft,
    gasLeft,
  }
}

export declare namespace run {
  type Options = {
    /** Bytecode to execute. */
    bytecode: Hex.Hex | Uint8Array
    /** Calldata. @default '0x' */
    data?: Hex.Hex | Uint8Array | undefined
    /** Gas limit. @default 30_000_000n */
    gas?: bigint | undefined
  }

  type ErrorType =
    | load_.LoadError
    | SizeOverflowError
    | Hex.toBytes.ErrorType
    | Hex.fromBytes.ErrorType
    | Errors.GlobalErrorType
}

/**
 * Executes bytecode, throwing if it does not complete successfully.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const data = await Evm.call({ bytecode: '0x60016002015f5260205ff3' })
 * // @log: '0x0000000000000000000000000000000000000000000000000000000000000003'
 * ```
 *
 * @param options - Options.
 * @returns The returned data.
 */
export async function call(options: run.Options): Promise<Hex.Hex> {
  const result = await run(options)
  if (result.status === 'success') return result.data
  if (result.status === 'reverted')
    throw new RevertedError({ data: result.data })
  throw new ExecutionError({ status: result.status })
}

export declare namespace call {
  type Options = run.Options
  type ErrorType =
    | run.ErrorType
    | RevertedError
    | ExecutionError
    | Errors.GlobalErrorType
}

// A single reusable VM instance. The engine resets stack, memory, and gas at
// the start of every `evm_run`, and Phase 1 has no state to carry across calls.
let vm = 0

// Bytecode whose analysis is currently loaded into `vm`, if it was supplied as
// a `Hex` string. `undefined` forces a re-analysis.
let codeKey: string | undefined

/**
 * Thrown when execution ends in `REVERT`.
 *
 * @example
 * ```ts twoslash
 * // PUSH0, PUSH0, REVERT
 * await Evm.call({ bytecode: '0x5f5ffd' })
 * // @error: Evm.RevertedError: Execution reverted.
 * ```
 */
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

/**
 * Thrown when bytecode or calldata exceeds the engine's buffer capacity.
 *
 * @example
 * ```ts twoslash
 * await Evm.run({ bytecode: `0x${'00'.repeat(100_000)}` })
 * // @error: Evm.SizeOverflowError: bytecode cannot exceed `49152` bytes.
 * ```
 */
export class SizeOverflowError extends Errors.BaseError {
  override readonly name = 'Evm.SizeOverflowError'

  constructor({
    name,
    givenSize,
    maxSize,
  }: {
    name: string
    givenSize: number
    maxSize: number
  }) {
    super(
      `${name} cannot exceed \`${maxSize}\` bytes. Given size: \`${givenSize}\` bytes.`,
    )
  }
}

/**
 * Thrown when execution halts exceptionally — out of gas, a stack violation, an
 * undefined opcode, or a jump to a non-`JUMPDEST`.
 *
 * @example
 * ```ts twoslash
 * // ADD with an empty stack
 * await Evm.call({ bytecode: '0x01' })
 * // @error: Evm.ExecutionError: Execution halted: stack-underflow.
 * ```
 */
export class ExecutionError extends Errors.BaseError {
  override readonly name = 'Evm.ExecutionError'

  /** The halting status. */
  readonly status: Status

  constructor({ status }: { status: Status }) {
    super(`Execution halted: ${status}.`)
    this.status = status
  }
}
