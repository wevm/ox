import * as Address from '../core/Address.js'
import * as Errors from '../core/Errors.js'
import * as Hex from '../core/Hex.js'
import type { Compute } from '../core/internal/types.js'
import * as State from './State.js'
import * as Hardfork from './Hardfork.js'
import { analyzed } from './internal/analysis.js'
import { table } from './internal/instructions.js'
import { execute } from './internal/interpreter.js'
import * as journal_ from './internal/journal.js'
import { addressToWord, createFrame, type Machine } from './internal/machine.js'

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

/** Block environment the block opcodes read. */
export type BlockEnv = Compute<{
  /** `BASEFEE`. */
  baseFeePerGas: bigint
  /** `BLOBBASEFEE`. */
  blobBaseFee: bigint
  /** `COINBASE`. */
  coinbase: Address.Address
  /** `GASLIMIT`. */
  gasLimit: bigint
  /** `NUMBER`. */
  number: bigint
  /** `PREVRANDAO`, as a 32-byte hex value. */
  prevRandao: Hex.Hex
  /** `TIMESTAMP`. */
  timestamp: bigint
}>

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
 * Executes bytecode in a single frame, synchronously.
 *
 * The frame reads and writes journaled state when a `state` source is given —
 * successful runs commit their changes to the source; reverts and halts
 * discard them — and reads empty state otherwise. Call frames (`CALL`,
 * `CREATE`, …) are not yet part of the dispatch table and halt with
 * `invalid-opcode`.
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
 * @example
 * ### Journaled state
 *
 * ```ts twoslash
 * import { Evm, State } from 'ox/evm'
 *
 * const address = '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
 * const state = State.fromMemory({
 *   accounts: { [address]: { storage: { '0x01': '0x2a' } } }
 * })
 *
 * // PUSH1 1, SLOAD, PUSH0, MSTORE, PUSH1 32, PUSH0, RETURN
 * const result = Evm.run({
 *   address,
 *   bytecode: '0x6001545f5260205ff3',
 *   state
 * })
 * // @log: {
 * // @log:   status: 'success',
 * // @log:   output: '0x000000000000000000000000000000000000000000000000000000000000002a',
 * // @log:   ...
 * // @log: }
 * ```
 *
 * @param options - Options.
 * @returns The execution result.
 */
export function run(options: run.Options): Result {
  const {
    address = zeroAddress,
    blobHashes = [],
    block,
    bytecode,
    caller = zeroAddress,
    chainId = 1n,
    data = '0x',
    gas = 30_000_000n,
    gasPrice = 0n,
    hardfork = Hardfork.latest,
    origin = caller,
    state,
    static: static_ = false,
    value = 0n,
  } = options

  const instructions = table(hardfork)
  const { analysis, bytes: code } = analyzed(bytecode)
  const input = typeof data === 'string' ? Hex.toBytes(data) : data

  const journal = journal_.create()
  const frame = createFrame({
    address: address.toLowerCase(),
    analysis,
    caller: addressToWord(caller.toLowerCase()),
    code,
    gas,
    input,
    static: static_,
    value,
  })
  const machine: Machine = {
    blobHashes: blobHashes.map((hash) => Hex.toBigInt(hash)),
    block: {
      baseFee: block?.baseFeePerGas ?? 0n,
      blobBaseFee: block?.blobBaseFee ?? 1n,
      chainId,
      coinbase: addressToWord((block?.coinbase ?? zeroAddress).toLowerCase()),
      gasLimit: block?.gasLimit ?? 30_000_000n,
      number: block?.number ?? 0n,
      prevRandao: block?.prevRandao ? Hex.toBigInt(block.prevRandao) : 0n,
      timestamp: block?.timestamp ?? 0n,
    },
    done: false,
    frames: [frame],
    gasPrice,
    halt: undefined,
    journal,
    origin: addressToWord(origin.toLowerCase()),
    request: undefined,
    reverted: false,
    table: instructions,
  }

  // EIP-2929 warm preamble for a bare frame: the executing account, the
  // origin, and the caller. (The transaction layer adds coinbase, target,
  // access lists, and precompiles when it lands.)
  journal_.warmAddress(journal, frame.address)
  journal_.warmAddress(journal, origin.toLowerCase())
  journal_.warmAddress(journal, caller.toLowerCase())

  let request = execute(machine)
  while (request !== undefined) {
    journal_.seed(journal, resolveSync(state, request))
    request = execute(machine)
  }

  const gasUsed = gas - frame.gas
  if (machine.halt) return { gasUsed, reason: machine.halt, status: 'halted' }
  const output = frame.output ? Hex.fromBytes(frame.output) : '0x'
  if (machine.reverted) return { gasUsed, output, status: 'reverted' }

  if (state) commit(journal, state)
  return {
    gasRefund: journal.refund,
    gasUsed,
    logs: journal.logs.map((log) => ({
      address: Address.checksum(log.address),
      data: Hex.fromBytes(log.data),
      topics: log.topics.map((topic) => Hex.fromNumber(topic, { size: 32 })),
    })),
    output,
    status: 'success',
  }
}

const zeroAddress = '0x0000000000000000000000000000000000000000' as const

// Answers a state request from a synchronous source; absent state reads as
// empty (no accounts, zero storage, zero block hashes).
function resolveSync(
  state: State.Sync | undefined,
  request: journal_.StateRequest,
): journal_.Seed {
  switch (request.kind) {
    case 'account': {
      const account = state?.getAccount(request.address as Address.Address)
      return {
        account: account
          ? {
              balance: account.balance,
              code:
                account.code === undefined
                  ? undefined
                  : Hex.toBytes(account.code),
              nonce: account.nonce,
            }
          : undefined,
        address: request.address,
        kind: 'account',
      }
    }
    case 'blockHash':
      return {
        hash: state ? Hex.toBigInt(state.getBlockHash(request.number)) : 0n,
        kind: 'blockHash',
        number: request.number,
      }
    case 'code':
      return {
        address: request.address,
        code: state
          ? Hex.toBytes(state.getCode(request.address as Address.Address))
          : new Uint8Array(0),
        kind: 'code',
      }
    case 'storage':
      return {
        address: request.address,
        kind: 'storage',
        slot: request.slot,
        value: state
          ? state.getStorage(request.address as Address.Address, request.slot)
          : 0n,
      }
  }
}

// Applies a successful run's state changes to the source's overlay.
function commit(journal: journal_.Journal, state: State.Sync): void {
  for (const [address, account] of journal.accounts) {
    if (journal.selfdestructs.has(address)) {
      state.putAccount(address as Address.Address, undefined)
      continue
    }
    if (account === null) continue
    const code = journal.codes.get(address)
    state.putAccount(address as Address.Address, {
      balance: account.balance,
      code: code === undefined ? undefined : Hex.fromBytes(code),
      nonce: account.nonce,
    })
  }
  for (const [address, slots] of journal.storage) {
    if (journal.selfdestructs.has(address)) continue
    for (const [slot, value] of slots)
      state.putStorage(address as Address.Address, slot, value)
  }
}

export declare namespace run {
  type Options = {
    /** Account the code executes as (`ADDRESS`, storage owner). @default zero address */
    address?: Address.Address | undefined
    /** Versioned blob hashes for `BLOBHASH`. */
    blobHashes?: readonly Hex.Hex[] | undefined
    /** Block environment. Omitted fields default to zero-like values. */
    block?: Partial<BlockEnv> | undefined
    /** Bytecode to execute. */
    bytecode: Hex.Hex | Uint8Array
    /** `CALLER`. @default zero address */
    caller?: Address.Address | undefined
    /** `CHAINID`. @default 1n */
    chainId?: bigint | undefined
    /** Calldata. @default '0x' */
    data?: Hex.Hex | Uint8Array | undefined
    /** Gas limit. @default 30_000_000n */
    gas?: bigint | undefined
    /** `GASPRICE`. @default 0n */
    gasPrice?: bigint | undefined
    /** Hardfork whose rules to execute under. @default Hardfork.latest */
    hardfork?: Hardfork.Hardfork | undefined
    /** `ORIGIN`. @default `caller` */
    origin?: Address.Address | undefined
    /** State the frame reads and writes. Successful runs commit their
     * changes to the source; reverts and halts discard them. Absent state
     * reads as empty. */
    state?: State.Sync | undefined
    /** Executes in a static context: `SSTORE`, `TSTORE`, `LOG*`, and
     * `SELFDESTRUCT` halt with `static-violation`. @default false */
    static?: boolean | undefined
    /** `CALLVALUE`. @default 0n */
    value?: bigint | undefined
  }

  type ErrorType =
    | Hardfork.UnknownHardforkError
    | Hex.toBytes.ErrorType
    | Hex.toBigInt.ErrorType
    | Hex.fromBytes.ErrorType
    | Hex.fromNumber.ErrorType
    | Address.checksum.ErrorType
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
