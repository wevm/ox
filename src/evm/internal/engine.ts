import type * as Address from '../../core/Address.js'
import type * as Bytes from '../../core/Bytes.js'
import * as Errors from '../../core/Errors.js'
import * as async from './async.js'
import * as bindings from './bindings.js'
import * as codec from './codec.js'
import type * as Database from './database.js'

/**
 * evm2 engine handle.
 *
 * One handle owns one evm2 `Evm`: its specification, block environment,
 * accepted state overlay, and database. Creation is asynchronous because
 * WebAssembly compilation is; execution is synchronous, as it is in evm2.
 *
 * @internal
 */

/**
 * Identifies a parked transaction.
 *
 * An object rather than a symbol so it can be weakly held everywhere the
 * package runs; reachability through a handle is what keeps it alive.
 */
export type Token = Readonly<Record<never, never>>

/** A created engine. */
export type Engine = {
  /**
   * Executes a transaction for its result and discards its state changes.
   *
   * This is evm2's `call_tx`: the result-only path, with no pending state to
   * resolve.
   */
  callTx(options: codec.encodeCallTx.Options): codec.TxResult
  /** Drops the engine and its accepted state. */
  destroy(): void
  /** Resolves the outstanding transaction by moving its state out. */
  detach(token?: Token): codec.Changes
  /** Reads an account through the accepted overlay and the database. */
  readAccountInfo(address: Address.Address): codec.Account | undefined
  /**
   * Resolves the outstanding transaction, releasing the engine.
   *
   * Every operation reaching the engine fails until this runs, which is how
   * evm2's exclusive borrow shows up across two host calls.
   */
  resolve(resolution: 'commit' | 'discard', token?: Token): void
  /**
   * Resolves the outstanding transaction, streaming its changes to `sink` first.
   *
   * A sink that throws makes evm2 discard rather than commit, and the throw is
   * what surfaces.
   */
  resolveWith(
    resolution: 'commitWith' | 'discardWith',
    sink: (record: codec.Change) => void,
    token?: Token,
  ): void
  /** Replaces the block environment and the selected specification. */
  setBlock(options: codec.encodeCreate.Options): void
  /**
   * Executes a transaction and leaves its state changes pending.
   *
   * This is evm2's `transact`: the engine stays borrowed until the transaction
   * is committed, discarded, or detached.
   */
  transact(options: codec.encodeCallTx.Options): {
    result: codec.TxResult
    /** Identifies the transaction this call parked. */
    token: Token
  }
}

/** Creates an engine over `database`. */
export async function create(options: create.Options): Promise<Engine> {
  const { database, ...config } = options
  const instance = await bindings.instantiateWith(database)
  resolve(instance, codec.encodeCreate(config))

  // Identifies the parked transaction. A handle carries the token it was created
  // with, so a copy of a resolved handle cannot resolve a later transaction.
  // Held weakly: the token is reachable exactly while some handle references it,
  // so token collection means every handle (original or copy) is gone.
  let outstanding: WeakRef<Token> | undefined

  // The last-resort equivalent of the engine's `Drop`. Fires only when no
  // handle can reach the parked transaction's token anymore, so a live copy
  // keeps its transaction alive; dispose remains the deterministic path.
  const reaper = new FinalizationRegistry<WeakRef<Token>>((ref) => {
    if (outstanding !== ref) return
    outstanding = undefined
    resolve(instance, codec.encodeResolve('discard'))
  })

  function claim(token: Token | undefined) {
    if (token && token !== outstanding?.deref()) throw new NotExecutedError()
    if (outstanding) reaper.unregister(outstanding)
    outstanding = undefined
  }

  return {
    callTx(options) {
      return codec.decodeResult(resolve(instance, codec.encodeCallTx(options)))
    },
    destroy() {
      resolve(instance, codec.encodeDestroy())
      instance.reset()
    },
    detach(token) {
      claim(token)
      return codec.decodeChanges(
        resolve(instance, codec.encodeResolve('detach')),
      )
    },
    readAccountInfo(address) {
      return codec.decodeAccount(
        resolve(instance, codec.encodeReadAccount(address)),
      )
    },
    resolve(resolution, token) {
      claim(token)
      resolve(instance, codec.encodeResolve(resolution))
    },
    resolveWith(resolution, sink, token) {
      claim(token)
      instance.withSink(sink, () =>
        resolve(instance, codec.encodeResolve(resolution)),
      )
    },
    setBlock(options) {
      resolve(instance, codec.encodeSetBlock(options))
    },
    transact(options) {
      const payload = resolve(instance, codec.encodeTransact(options))
      const result = (() => {
        try {
          return codec.decodeResult(payload)
        } catch (error) {
          // The adapter already parked the transaction, so a decode failure has
          // to release it or the engine stays borrowed with no handle.
          resolve(instance, codec.encodeResolve('discard'))
          throw error
        }
      })()
      const token: Token = Object.freeze({})
      const ref = new WeakRef(token)
      outstanding = ref
      reaper.register(token, ref, ref)
      return { result, token }
    },
  }
}

export declare namespace create {
  type Options = codec.encodeCreate.Options & {
    /** Synchronous state reads the engine calls back into. */
    database: Database.Database
  }
}

/** Sends a request and returns its payload, throwing on any failure status. */
function resolve(instance: bindings.Instance, request: Bytes.Bytes) {
  const { payload, status } = instance.call(request)
  if (status === codec.status.ok) return payload
  if (status === codec.status.handler)
    throw new HandlerError(codec.decodeHandler(payload))
  if (status === codec.status.database)
    throw new DatabaseError(codec.decodeMessage(payload))
  if (status === codec.status.abi)
    throw new AbiError(codec.decodeMessage(payload))
  if (status === codec.status.engineMissing) throw new MissingError()
  if (status === codec.status.engineBusy) throw new bindings.ReentrancyError()
  if (status === codec.status.engineBorrowed) throw new BorrowedError()
  if (status === codec.status.notExecuted) throw new NotExecutedError()
  if (status === codec.status.sink) throw new SinkError()
  // Not a failure: the attempt was abandoned before any state was accepted. The
  // asynchronous driver catches this, awaits the source, and repeats.
  if (status === codec.status.pending) throw new async.PendingError()
  throw new codec.DecodeError(`unknown response status ${status}`)
}

/**
 * Transaction-rejection variants, keyed by the discriminant the adapter
 * assigns.
 *
 * Mirrors `wasm/evm2/src/error.rs`; a rejected transaction's
 * {@link ox#Evm.(HandlerError:class)}`.code` names its variant through this map.
 */
export const handlerKinds = {
  fatal: 1,
  external: 2,
  unsupportedTransactionType: 3,
  wrongTransactionType: 4,
  invalidNonce: 5,
  invalidChainId: 6,
  missingChainId: 7,
  intrinsicGasTooLow: 8,
  insufficientFunds: 9,
  rejectCallerWithCode: 10,
  nonceOverflow: 11,
  gasLimitMoreThanBlock: 12,
  txGasLimitGreaterThanCap: 13,
  createInitCodeSizeLimit: 14,
  outOfFunds: 15,
  signerRecoveryFailed: 16,
  feeCapLessThanBaseFee: 17,
  emptyAuthorizationList: 18,
  blobFeeCapLessThanBlobBaseFee: 19,
  emptyBlobs: 20,
  tooManyBlobs: 21,
  blobVersionNotSupported: 22,
  priorityFeeGreaterThanMaxFee: 23,
  unsupportedCaller: 24,
} as const

/** The adapter's handler discriminants, keyed back to their variant names. */
const kindNames = new Map(
  Object.entries(handlerKinds).map(([name, value]) => [
    value as number,
    name as keyof typeof handlerKinds,
  ]),
)

/** Thrown when the engine rejected or aborted the transaction. */
export class HandlerError extends Errors.BaseError {
  /** Variant name, or `undefined` for a discriminant this version predates. */
  readonly code: keyof typeof handlerKinds | undefined
  /** Variant discriminant. Named by {@link ox#Evm.(handlerKinds:variable)}. */
  readonly kind: number
  override readonly name = 'Evm.HandlerError'
  /** The variant's numeric fields, in evm2's declaration order. */
  readonly words: readonly bigint[]

  constructor({ kind, message, words }: codec.Handler) {
    super(message, { metaMessages: [`evm2 handler error ${kind}`] })
    this.code = kindNames.get(kind)
    this.kind = kind
    this.words = words
  }
}

/**
 * Thrown when a state-change sink refused a record.
 *
 * evm2 discards the transaction in that case rather than committing it, so this
 * only surfaces when the sink failed without throwing an error of its own.
 */
export class SinkError extends Errors.BaseError {
  override readonly name = 'Evm.SinkError'

  constructor() {
    super('A state-change sink refused a record.', {
      metaMessages: ['The transaction was discarded rather than committed.'],
    })
  }
}

/** Thrown when an unresolved executed transaction still holds the engine. */
export class BorrowedError extends Errors.BaseError {
  override readonly name = 'Evm.BorrowedError'

  constructor() {
    super('An executed transaction has not been resolved.', {
      metaMessages: [
        'Commit, discard, or detach it before using the EVM again.',
      ],
    })
  }
}

/** Thrown when a resolution named no outstanding executed transaction. */
export class NotExecutedError extends Errors.BaseError {
  override readonly name = 'Evm.NotExecutedError'

  constructor() {
    super('There is no executed transaction to resolve.', {
      metaMessages: ['It was already committed, discarded, or detached.'],
    })
  }
}

/** Thrown when a state read failed. Carries the source's own message. */
export class DatabaseError extends Errors.BaseError {
  override readonly name = 'Evm.DatabaseError'

  constructor(message: string) {
    super('A state read the engine needed could not be served.', {
      metaMessages: [message],
    })
  }
}

/** Thrown when the adapter rejected a request this codec produced. */
export class AbiError extends Errors.BaseError {
  override readonly name = 'Evm.AbiError'

  constructor(reason: string) {
    super('The evm2 adapter rejected the request.', { metaMessages: [reason] })
  }
}

/** Thrown when an operation runs against a destroyed engine. */
export class MissingError extends Errors.BaseError {
  override readonly name = 'Evm.MissingError'

  constructor() {
    super('The evm2 engine was destroyed.', {
      metaMessages: ['Create a new engine to execute another transaction.'],
    })
  }
}
