import type * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as TxEnvelope from '../core/TxEnvelope.js'
import * as Database from './Database.js'
import type * as Bal from './Bal.js'
import * as ExecutedTx from './ExecutedTx.js'
import type * as Inspector from './Inspector.js'
import type * as Ethereum from './Ethereum.js'
import * as SpecId from './SpecId.js'
import * as TxResult from './TxResult.js'
import * as driver from './internal/async.js'
import * as codec from './internal/codec.js'
import * as engine from './internal/engine.js'

import type {
  ReentrancyError,
  RequestTooLargeError,
  TrapError,
  VersionError,
} from './internal/bindings.js'
import { EncodeError } from './internal/codec.js'
import type { DecodeError } from './internal/codec.js'
import type {
  AbiError,
  BorrowedError,
  DatabaseError,
  HandlerError,
  NotCoveredError,
} from './internal/engine.js'

export {
  AbiError,
  BorrowedError,
  DatabaseError,
  HandlerError,
  MissingError,
  NotCoveredError,
  NotExecutedError,
} from './internal/engine.js'
export { DecodeError, EncodeError } from './internal/codec.js'
export {
  ReentrancyError,
  RequestTooLargeError,
  TrapError,
  VersionError,
} from './internal/bindings.js'
export { handlerKinds } from './internal/engine.js'

/**
 * An EVM.
 *
 * Owns its specification, block environment, and the state accepted above its
 * database. One EVM is one isolated engine: creating a second does not share
 * state with the first.
 */
export type Evm<asynchronous extends boolean = false> = {
  /** @internal */
  readonly '~async': asynchronous
  /**
   * The engine's current execution config.
   *
   * Held so a setter can replace one half without discarding the other, since
   * the adapter's operation carries both.
   *
   * @internal
   */
  '~config': {
    block: codec.Block
    specId: SpecId.SpecId
    version?: Version | undefined
  }
  /** @internal */
  readonly '~chainId': bigint
  /**
   * Drives the asynchronous source, when there is one.
   *
   * @internal
   */
  readonly '~driver': asynchronous extends true ? driver.Driver : undefined
  /** @internal */
  readonly '~engine': engine.Engine
}

/**
 * A value an operation returns, wrapped in a promise when reads are
 * asynchronous.
 */
export type Awaitable<
  asynchronous extends boolean,
  value,
> = asynchronous extends true ? Promise<value> : value

/**
 * Version values an execution runs under.
 *
 * Mirrors evm2's `Version`, minus the chain id, which `chainId` carries. Every
 * field is optional: what is omitted keeps the value the specification gives it.
 */
export type Version = codec.Version

/** Feature flags a version can turn on or off. */
export type Feature = (typeof codec.features)[number]

/** Gas parameters a version can replace. */
export type GasId = (typeof codec.gasIds)[number]

/** Block values opcodes read. */
export type Block = {
  /** `BASEFEE`. @default 0n */
  basefee?: bigint | undefined
  /** `COINBASE`. @default the zero address */
  beneficiary?: Address.Address | undefined
  /** `BLOBBASEFEE`. @default 1n */
  blobBasefee?: bigint | undefined
  /** `DIFFICULTY`, pre-merge. @default 0n */
  difficulty?: bigint | undefined
  /** `GASLIMIT`. @default 2n ** 64n - 1n, the engine's own default */
  gasLimit?: bigint | undefined
  /** `NUMBER`. @default 0n */
  number?: bigint | undefined
  /** `PREVRANDAO`, post-merge. @default 0n */
  prevrandao?: bigint | undefined
  /** Beacon slot number. @default 0n */
  slotNum?: bigint | undefined
  /** `TIMESTAMP`. @default 1n, the engine's own default */
  timestamp?: bigint | undefined
}

/**
 * Creates an EVM.
 *
 * Asynchronous because the engine is WebAssembly and browsers refuse to compile
 * a module this size synchronously on the main thread. The module is compiled
 * once per JavaScript realm; every call afterwards is synchronous.
 *
 * The specification selects the instruction table, gas schedule, precompiles,
 * and transaction handlers. Choosing among compiled precompile sets or handler
 * registries arrives with the configuration surface; until then the
 * specification determines all of them.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const evm = await Evm.create()
 * ```
 *
 * @example
 * ### Seeding state
 *
 * ```ts twoslash
 * import { Database, Evm } from 'ox/evm'
 *
 * const evm = await Evm.create({
 *   database: Database.fromMemory({
 *     accounts: {
 *       '0x0000000000000000000000000000000000000001': {
 *         balance: 1n
 *       }
 *     }
 *   })
 * })
 * ```
 *
 * @param options - Constructor components.
 * @returns An EVM.
 */
export async function create(
  options: create.Options & { database: Database.Async },
): Promise<Evm<true>>

/**
 * Creates an EVM whose reads are synchronous.
 *
 * @example
 * ```ts twoslash
 * import { Evm } from 'ox/evm'
 *
 * const evm = await Evm.create()
 * ```
 *
 * @param options - Constructor components.
 * @returns An EVM.
 */
export async function create(
  options?: create.Options & { database?: Database.Database | undefined },
): Promise<Evm<false>>

/**
 * Creates an EVM whose reads may or may not be synchronous.
 *
 * Reached when the database's own type does not say which, so the result is
 * narrowed before reading through it: awaiting an operation covers both.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * const evm = await Evm.create(options)
 * const result = await Evm.callTx(evm, transaction)
 * ```
 *
 * @param options - Constructor components.
 * @returns An EVM.
 */
export async function create(options: create.Options): Promise<Evm<boolean>>

// eslint-disable-next-line jsdoc-js/require-jsdoc
export async function create(
  options: create.Options = {},
): Promise<Evm<never>> {
  const {
    block,
    chainId,
    database = Database.fromMemory(),
    specId = SpecId.latest,
  } = options

  // Copied before the first await: encoding happens after WebAssembly
  // instantiation, so a caller reusing the options object would otherwise change
  // what this EVM runs under.
  const version = snapshot(options.version)

  // An asynchronous source is driven through synchronous reads: a miss abandons
  // the attempt and the operation repeats once the value is cached.
  const source = driver.isAsync(database) ? driver.driver(database) : undefined

  const resolved = {
    basefee: block?.basefee ?? 0n,
    beneficiary: block?.beneficiary ?? `0x${'00'.repeat(20)}`,
    blobBasefee: block?.blobBasefee ?? 1n,
    difficulty: block?.difficulty ?? 0n,
    gasLimit: block?.gasLimit ?? 0xffffffffffffffffn,
    number: block?.number ?? 0n,
    prevrandao: block?.prevrandao ?? 0n,
    slotNum: block?.slotNum ?? 0n,
    timestamp: block?.timestamp ?? 1n,
  } satisfies Block

  return {
    '~async': (source !== undefined) as never,
    '~chainId': chainId ?? 1n,
    '~config': { block: resolved, specId, ...(version ? { version } : {}) },
    '~driver': source as never,
    '~engine': await engine.create({
      block: resolved,
      chainId: chainId ?? 1n,
      database: source ? source.database : (database as Database.Database),
      specId: SpecId.ids.indexOf(specId),
      ...(version ? { version } : {}),
    }),
  }
}

export declare namespace create {
  type Options = {
    /** Block values opcodes read. */
    block?: Block | undefined
    /**
     * Chain id `CHAINID` reports and transactions are validated against.
     *
     * The transaction-fields form serializes through envelope types whose chain
     * id is a number, so past 2^53 only the `serialized` form executes.
     *
     * @default 1n
     */
    chainId?: bigint | undefined
    /**
     * State the EVM reads through.
     *
     * An empty in-memory database by default, holding no accounts. The engine reads a
     * missing account as balance and nonce zero, so a transaction that costs
     * nothing still executes; anything needing funds fails until state is
     * seeded.
     *
     * @default Database.fromMemory()
     */
    database?: Database.Async | Database.Database | undefined
    /**
     * Specification whose rules apply.
     *
     * @default SpecId.latest
     */
    specId?: SpecId.SpecId | undefined
    /**
     * Overrides applied on top of the specification's own version.
     *
     * Anything omitted keeps the value the specification gives it, so the
     * engine remains the source of every default.
     */
    version?: Version | undefined
  }

  type ErrorType = EncodeError | VersionError | Errors.GlobalErrorType
}

/**
 * Executes a transaction and discards its state changes.
 *
 * Runs a fully validated transaction whose state changes are
 * discarded. Nonce, chain id, balance, and intrinsic gas are all checked, so it
 * is stricter than an `eth_call`, and it takes an encoded envelope with its
 * signer rather than a loose message. Output, gas, and logs come back, nothing
 * written is kept, and executing the same transaction twice gives the same
 * result.
 *
 * A revert or an exceptional halt is a successful call returning
 * `status: false`. It throws only when the engine refused the transaction, or when the
 * database could not supply state.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Database, Evm, TxResult } from 'ox/evm'
 *
 * const evm = await Evm.create({ database, specId: 'osaka' })
 *
 * const result = Evm.callTx(evm, {
 *   from: '0x0000000000000000000000000000000000000001',
 *   gas: 100_000n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   value: 1n
 * })
 * TxResult.txGasUsed(result)
 * // @log: 21000n
 * ```
 *
 * @param evm - EVM to execute on.
 * @param transaction - Transaction and the account it executes as.
 * @returns The transaction's result.
 */
export function callTx(
  evm: Evm<true>,
  transaction: Ethereum.Tx,
): Promise<TxResult.TxResult>

/**
 * Same operation against an EVM whose reads are synchronous.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.callTx(evm, transaction)
 * ```
 *
 * @param evm - EVM to use.
 * @param transaction - Operand.
 * @returns The operation's result.
 */
export function callTx(
  evm: Evm<false>,
  transaction: Ethereum.Tx,
): TxResult.TxResult

/**
 * Same operation against an EVM whose reads may or may not be synchronous.
 *
 * Awaiting the result covers both.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * const result = await Evm.callTx(evm, transaction)
 * ```
 *
 * @param evm - EVM to use.
 * @param transaction - Operand.
 * @returns The operation's result.
 */
export function callTx(
  evm: Evm<boolean>,
  transaction: Ethereum.Tx,
): Promise<TxResult.TxResult> | TxResult.TxResult

// eslint-disable-next-line jsdoc-js/require-jsdoc
export function callTx(
  evm: Evm<boolean>,
  transaction: Ethereum.Tx,
): Awaitable<boolean, TxResult.TxResult> {
  return attempt(evm, () => {
    const result = evm['~engine'].callTx({
      envelope: envelope(transaction, evm['~chainId']),
      signer: transaction.from,
    })
    return { ...result, stop: stop(result.stop) }
  })
}

export declare namespace callTx {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | NotCoveredError
    | DecodeError
    | EncodeError
    | HandlerError
    | ReentrancyError
    | RequestTooLargeError
    | TrapError
    | UnknownStopError
    | Errors.GlobalErrorType
}

/**
 * Executes a transaction and leaves its state changes pending.
 *
 * The counterpart to {@link ox#Evm.(callTx:function)}: instead of discarding
 * what the transaction wrote, this hands back a handle that decides. The EVM is
 * held until that handle is committed, discarded, or detached, so only one
 * transaction is outstanding at a time.
 *
 * A revert or an exceptional halt is a successful execution returning
 * `status: false`, and still produces a handle to resolve.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * // `using` discards on scope exit, so an early return cannot leave the EVM held.
 * using executed = Evm.transact(evm, {
 *   from: '0x0000000000000000000000000000000000000001',
 *   gas: 100_000n,
 *   to: '0x0000000000000000000000000000000000000002',
 *   value: 1n
 * })
 *
 * if (ExecutedTx.result(executed).status)
 *   ExecutedTx.commit(executed)
 * ```
 *
 * @param evm - EVM to execute on.
 * @param transaction - Transaction and the account it executes as.
 * @returns A handle over the executed transaction.
 */
export function transact(
  evm: Evm<true>,
  transaction: Ethereum.Tx,
): Promise<ExecutedTx.ExecutedTx>

/**
 * Same operation against an EVM whose reads are synchronous.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.transact(evm, transaction)
 * ```
 *
 * @param evm - EVM to use.
 * @param transaction - Operand.
 * @returns The operation's result.
 */
export function transact(
  evm: Evm<false>,
  transaction: Ethereum.Tx,
): ExecutedTx.ExecutedTx

/**
 * Same operation against an EVM whose reads may or may not be synchronous.
 *
 * Awaiting the result covers both.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * const result = await Evm.transact(evm, transaction)
 * ```
 *
 * @param evm - EVM to use.
 * @param transaction - Operand.
 * @returns The operation's result.
 */
export function transact(
  evm: Evm<boolean>,
  transaction: Ethereum.Tx,
): Promise<ExecutedTx.ExecutedTx> | ExecutedTx.ExecutedTx

// eslint-disable-next-line jsdoc-js/require-jsdoc
export function transact(
  evm: Evm<boolean>,
  transaction: Ethereum.Tx,
): Awaitable<boolean, ExecutedTx.ExecutedTx> {
  return attempt(evm, () => {
    // An attempt that stops on an unfetched read parks no handle, so a repeat
    // finds the engine free.
    const { result, token } = evm['~engine'].transact({
      envelope: envelope(transaction, evm['~chainId']),
      signer: transaction.from,
    })
    const normalized = (() => {
      try {
        return { ...result, stop: stop(result.stop) }
      } catch (error) {
        // The engine is already borrowed, so release it before reporting.
        evm['~engine'].resolve('discard', token)
        throw error
      }
    })()
    return ExecutedTx.from({
      engine: evm['~engine'],
      result: normalized,
      token,
    })
  })
}

export declare namespace transact {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | NotCoveredError
    | DecodeError
    | EncodeError
    | HandlerError
    | ReentrancyError
    | RequestTooLargeError
    | TrapError
    | UnknownStopError
    | Errors.GlobalErrorType
}

/**
 * Reads an account through the EVM, including any state it has accepted.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.readAccountInfo(
 *   evm,
 *   '0x0000000000000000000000000000000000000001'
 * )
 * ```
 *
 * @param evm - EVM to read through.
 * @param address - Account to read.
 * @returns The account, or `undefined` when it does not exist.
 */
export function readAccountInfo(
  evm: Evm<true>,
  address: Address.Address,
): Promise<Database.Account | undefined>

/**
 * Same operation against an EVM whose reads are synchronous.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.readAccountInfo(evm, address)
 * ```
 *
 * @param evm - EVM to use.
 * @param address - Operand.
 * @returns The operation's result.
 */
export function readAccountInfo(
  evm: Evm<false>,
  address: Address.Address,
): Database.Account | undefined

/**
 * Same operation against an EVM whose reads may or may not be synchronous.
 *
 * Awaiting the result covers both.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * const result = await Evm.readAccountInfo(evm, address)
 * ```
 *
 * @param evm - EVM to use.
 * @param address - Operand.
 * @returns The operation's result.
 */
export function readAccountInfo(
  evm: Evm<boolean>,
  address: Address.Address,
): Promise<Database.Account | undefined> | Database.Account | undefined

// eslint-disable-next-line jsdoc-js/require-jsdoc
export function readAccountInfo(
  evm: Evm<boolean>,
  address: Address.Address,
): Awaitable<boolean, Database.Account | undefined> {
  return attempt(evm, () => evm['~engine'].readAccountInfo(address))
}

export declare namespace readAccountInfo {
  type ErrorType =
    | AbiError
    | BorrowedError
    | DatabaseError
    | NotCoveredError
    | HandlerError
    | ReentrancyError
    | Errors.GlobalErrorType
}

/**
 * Placeholder signature for a transaction built from fields.
 *
 * EIP-2718 decoding needs a signature to parse, and the engine strips it immediately,
 * so nothing reads this. Callers therefore never sign to simulate.
 */
const placeholder = {
  r: `0x${'01'.repeat(32)}`,
  s: `0x${'01'.repeat(32)}`,
  yParity: 0,
} as const

/**
 * Replaces the block environment.
 *
 * Accepted state is untouched: this changes what block opcodes report, not what
 * the EVM has executed. The specification and version stay as they were.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.setBlock(evm, {
 *   number: 21_000_000n,
 *   timestamp: 1_700_000_000n
 * })
 * ```
 *
 * @param evm - EVM to reconfigure.
 * @param block - Block values to apply.
 */
export function setBlock<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  block: Block,
): Awaitable<asynchronous, void> {
  return attempt(evm, () =>
    apply(evm, {
      ...evm['~config'],
      block: merge(evm['~config'].block, block),
    }),
  )
}

export declare namespace setBlock {
  type ErrorType =
    | AbiError
    | BorrowedError
    | EncodeError
    | ReentrancyError
    | Errors.GlobalErrorType
}

/**
 * Replaces the specification and its version overrides.
 *
 * The block environment stays as it was. Overrides are applied whole rather than
 * merged, so what the new set omits returns to the specification's own value.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * // Simulate without charging fees or checking balances.
 * Evm.setExecutionConfig(evm, {
 *   version: {
 *     features: { balanceCheck: false, feeCharge: false }
 *   }
 * })
 * ```
 *
 * @param evm - EVM to reconfigure.
 * @param options - Specification and version to apply.
 */
export function setExecutionConfig<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  options: setExecutionConfig.Options,
): Awaitable<asynchronous, void> {
  const specId = options.specId ?? evm['~config'].specId
  const version = snapshot(options.version)
  return attempt(evm, () =>
    apply(evm, {
      block: evm['~config'].block,
      specId,
      ...(version ? { version } : {}),
    }),
  )
}

export declare namespace setExecutionConfig {
  type Options = {
    /** Specification whose rules apply. Unchanged when omitted. */
    specId?: SpecId.SpecId | undefined
    /** Overrides applied on top of that specification. */
    version?: Version | undefined
  }

  type ErrorType = setBlock.ErrorType
}

/**
 * Replaces the block environment, the specification, and its version together.
 *
 * The one call for a caller advancing to a block that also changes the rules, so
 * neither half is briefly applied without the other.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.setBlockAndExecutionConfig(evm, {
 *   block: { number: 21_000_000n },
 *   specId: 'osaka'
 * })
 * ```
 *
 * @param evm - EVM to reconfigure.
 * @param options - Block, specification, and version to apply.
 */
export function setBlockAndExecutionConfig<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  options: setBlockAndExecutionConfig.Options,
): Awaitable<asynchronous, void> {
  const version = snapshot(options.version)
  return attempt(evm, () =>
    apply(evm, {
      block: merge(evm['~config'].block, options.block),
      specId: options.specId ?? evm['~config'].specId,
      ...(version ? { version } : {}),
    }),
  )
}

export declare namespace setBlockAndExecutionConfig {
  type Options = setExecutionConfig.Options & {
    /** Block values to apply. */
    block?: Block | undefined
  }

  type ErrorType = setBlock.ErrorType
}

// Copies version overrides, so a caller mutating theirs afterwards cannot change
// what an EVM already runs under. The groups are flat records of primitives, so
// one level is deep enough.
function snapshot(version: Version | undefined): Version | undefined {
  if (!version) return undefined
  return {
    ...version,
    ...(version.features ? { features: { ...version.features } } : {}),
    ...(version.gas ? { gas: { ...version.gas } } : {}),
  }
}

/**
 * Installs an inspector, so executions record what they did.
 *
 * A trace comes back on the result of each execution afterwards. Recording
 * cannot change what executes: the same transaction produces the same result
 * traced or not.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, Inspector } from 'ox/evm'
 *
 * // Calls, creates, logs, and self-destructs. Cheap enough to leave on.
 * Evm.setInspector(evm, {})
 *
 * const result = Evm.callTx(evm, transaction)
 * Inspector.tree(result.trace)
 * ```
 *
 * @example
 * ### Recording instructions
 *
 * ```ts twoslash
 * // @noErrors
 * import { Evm, Inspector } from 'ox/evm'
 *
 * // Millions of events for a busy transaction, so bound it and expect
 * // `truncated`.
 * Evm.setInspector(evm, {
 *   limit: 4_000_000,
 *   stack: true,
 *   steps: true
 * })
 *
 * const result = Evm.callTx(evm, transaction)
 * Inspector.steps(result.trace)
 * ```
 *
 * @param evm - EVM to inspect.
 * @param options - What to record.
 */
export function setInspector<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  options: Inspector.Options = {},
): Awaitable<asynchronous, void> {
  // Queued like the other setters: an asynchronous execution can be parked
  // mid-retry, and changing the recording under it would trace one execution
  // with two sets of settings.
  return attempt(evm, () =>
    evm['~engine'].setInspector({
      enabled: true,
      limit: options.limit ?? 1_048_576,
      memory: options.memory ?? false,
      stack: options.stack ?? false,
      steps: options.steps ?? false,
    }),
  )
}

export declare namespace setInspector {
  type ErrorType = AbiError | BorrowedError | Errors.GlobalErrorType
}

/**
 * Removes the inspector.
 *
 * The engine then holds none, which is what makes an untraced execution free:
 * an inspector that is present costs work on every instruction whatever it
 * records.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.clearInspector(evm)
 * ```
 *
 * @param evm - EVM to stop inspecting.
 */
export function clearInspector<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
): Awaitable<asynchronous, void> {
  return attempt(evm, () =>
    evm['~engine'].setInspector({ enabled: false, limit: 0 }),
  )
}

export declare namespace clearInspector {
  type ErrorType = setInspector.ErrorType
}

/**
 * Attaches a block access list, which covered reads are served from.
 *
 * The list is a coverage gate and an overlay, not a replacement: a read it does
 * not cover is refused unless `fallback` is set, because during block validation
 * an access outside the list means the list is wrong. A covered read is served
 * from the list only where the list holds a write for it, and otherwise reads
 * through to the database.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * // Validating a block: an uncovered read is a failure, not a database lookup.
 * Evm.setBal(evm, bal)
 *
 * // Executing something the block does not contain, positioned on its state.
 * Evm.setBal(evm, bal, { fallback: true })
 * ```
 *
 * @param evm - EVM to attach to.
 * @param bal - List to consult on reads.
 * @param options - Whether uncovered reads may fall back to the database.
 */
export function setBal<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  bal: Bal.Bal,
  options: setBal.Options = {},
): Awaitable<asynchronous, void> {
  return attempt(evm, () =>
    evm['~engine'].setBal({ bal, fallback: options.fallback ?? false }),
  )
}

export declare namespace setBal {
  type Options = {
    /**
     * Whether a read the list does not cover falls back to the database.
     *
     * @default false
     */
    fallback?: boolean | undefined
  }

  type ErrorType = AbiError | BorrowedError | Errors.GlobalErrorType
}

/**
 * Removes the attached block access list, so reads go to the database again.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.clearBal(evm)
 * ```
 *
 * @param evm - EVM to detach from.
 */
export function clearBal<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
): Awaitable<asynchronous, void> {
  // evm2 has no way to detach one, so this attaches an empty list with fallback
  // on: every lookup misses and reads through, which is what no list does.
  return attempt(evm, () =>
    evm['~engine'].setBal({ bal: { accounts: [] }, fallback: true }),
  )
}

export declare namespace clearBal {
  type ErrorType = setBal.ErrorType
}

/**
 * Starts building a block access list from what executions touch.
 *
 * Each committed transaction folds its post-state in at the current index, so
 * {@link ox#Evm.(setBalIndex:function)} is advanced once per transaction. Read the
 * result with {@link ox#Evm.(takeBal:function)}, or abandon it with
 * {@link ox#Evm.(clearBalBuilder:function)}.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.enableBalBuilder(evm)
 *
 * // Transaction `i` records at index `i + 1`.
 * Evm.setBalIndex(evm, 1n)
 * Evm.transact(evm, transaction)
 *
 * const bal = Evm.takeBal(evm)
 * ```
 *
 * @param evm - EVM to build from.
 */
export function enableBalBuilder<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
): Awaitable<asynchronous, void> {
  return attempt(evm, () => evm['~engine'].setBalBuilder(true))
}

export declare namespace enableBalBuilder {
  type ErrorType = setBal.ErrorType
}

/**
 * Discards the block access list being built, without reading it.
 *
 * {@link ox#Evm.(takeBal:function)} also ends the build; this is for abandoning
 * one whose result is not wanted.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.clearBalBuilder(evm)
 * ```
 *
 * @param evm - EVM to stop building from.
 */
export function clearBalBuilder<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
): Awaitable<asynchronous, void> {
  return attempt(evm, () => evm['~engine'].setBalBuilder(false))
}

export declare namespace clearBalBuilder {
  type ErrorType = setBal.ErrorType
}

/**
 * Takes the built block access list, resetting the index.
 *
 * `undefined` when no builder was started. Taking it ends the build, so a further
 * block starts with {@link ox#Evm.(enableBalBuilder:function)} again.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * const bal = Evm.takeBal(evm)
 * ```
 *
 * @param evm - EVM to take from.
 * @returns The list, or `undefined` when none was being built.
 */
export function takeBal<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
): Awaitable<asynchronous, Bal.Bal | undefined> {
  return attempt(evm, () => evm['~engine'].takeBal())
}

export declare namespace takeBal {
  type ErrorType = setBal.ErrorType
}

/**
 * Sets the block access index reads resolve at and writes record under.
 *
 * Index `0` is the pre-execution state, and transaction `i` uses index `i + 1`.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm } from 'ox/evm'
 *
 * Evm.setBalIndex(evm, 1n)
 * ```
 *
 * @param evm - EVM to position.
 * @param index - Index to use.
 */
export function setBalIndex<asynchronous extends boolean>(
  evm: Evm<asynchronous>,
  index: bigint,
): Awaitable<asynchronous, void> {
  return attempt(evm, () => evm['~engine'].setBalIndex(index))
}

export declare namespace setBalIndex {
  type ErrorType = setBal.ErrorType
}

// Merges block values over the current ones, field by field rather than with a
// spread: an omitted field is `undefined` in the partial, and spreading it would
// erase the value it should keep.
function merge(current: codec.Block, block: Block | undefined): codec.Block {
  return {
    basefee: block?.basefee ?? current.basefee,
    beneficiary: block?.beneficiary ?? current.beneficiary,
    blobBasefee: block?.blobBasefee ?? current.blobBasefee,
    difficulty: block?.difficulty ?? current.difficulty,
    gasLimit: block?.gasLimit ?? current.gasLimit,
    number: block?.number ?? current.number,
    prevrandao: block?.prevrandao ?? current.prevrandao,
    slotNum: block?.slotNum ?? current.slotNum,
    timestamp: block?.timestamp ?? current.timestamp,
  }
}

// Sends a resolved config and records it as the EVM's current one.
function apply(evm: Evm<boolean>, config: Evm<boolean>['~config']) {
  evm['~engine'].setBlock({
    block: config.block,
    chainId: evm['~chainId'],
    specId: SpecId.ids.indexOf(config.specId),
    ...(config.version ? { version: config.version } : {}),
  })
  evm['~config'] = config
}

// Runs an engine operation, repeating it while reads are outstanding. A
// synchronous database returns the value directly. An asynchronous one cannot
// answer inside the engine's synchronous read, so the attempt is abandoned, the
// source is awaited, and the operation repeats until nothing is outstanding.
function attempt<asynchronous extends boolean, value>(
  evm: Evm<asynchronous>,
  run: () => value,
): Awaitable<asynchronous, value> {
  const source = evm['~driver']
  if (!source) return run() as never
  // Queued: awaiting a source yields control, and the engine is exclusive.
  return source.serialize(() => driver.until(source, run)) as never
}

// Resolves either input shape to the encoded envelope the ABI carries.
function envelope(tx: Ethereum.Tx, chainId: bigint): Bytes.Bytes {
  // Fields carry an index signature, so `in` alone cannot narrow the union; the
  // value's own shape is what distinguishes an already-encoded transaction.
  const serialized = (tx as Ethereum.Tx.Serialized).serialized
  if (typeof serialized === 'string' || serialized instanceof Uint8Array)
    return Bytes.from(serialized)

  const { from: _, ...fields } = tx
  // Envelope types carry `chainId` as a number, so the fields form cannot
  // express a chain id past 2^53. The serialized form still can.
  if (chainId > BigInt(Number.MAX_SAFE_INTEGER))
    throw new EncodeError({
      max: String(Number.MAX_SAFE_INTEGER),
      value: `chainId ${chainId}`,
    })
  // Fields with no fee fields infer EIP-1559, whose serialization needs a chain
  // id, so the EVM's own is the default rather than a required argument.
  return Bytes.from(
    TxEnvelope.serialize(
      TxEnvelope.from({ chainId: Number(chainId), ...fields }),
      { signature: placeholder },
    ),
  )
}

/** The engine's stop discriminants, keyed by the name they map to. */
const names = /*#__PURE__*/ new Map(
  Object.entries(TxResult.stops).map(([name, value]) => [
    value as number,
    name as TxResult.Stop,
  ]),
)

function stop(discriminant: number): TxResult.Stop {
  const name = names.get(discriminant)
  if (!name) throw new UnknownStopError({ discriminant })
  return name
}

/** Thrown when the engine reports a stop reason this version does not know. */
export class UnknownStopError extends Errors.BaseError {
  override readonly name = 'Evm.UnknownStopError'

  constructor({ discriminant }: { discriminant: number }) {
    super('The engine reported an unknown stop reason.', {
      metaMessages: [
        `Received: ${discriminant}`,
        'The engine and this package may be out of sync.',
      ],
    })
  }
}
