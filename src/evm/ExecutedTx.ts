import * as Errors from '../core/Errors.js'
import * as PendingState from './PendingState.js'
import type * as StateChange from './StateChange.js'
import type * as TxResult from './TxResult.js'
import type * as engine from './internal/engine.js'

/**
 * A transaction that has executed, with its state changes still pending.
 *
 * The EVM is held until this is resolved: committed into its accepted state,
 * discarded, or detached as owned state. Only one may execute at a time, and a
 * handle resolves once.
 *
 * Resolve with {@link ox#ExecutedTx.(commit:function)},
 * {@link ox#ExecutedTx.(discard:function)}, or
 * {@link ox#ExecutedTx.(detach:function)}. A `using` declaration discards on
 * scope exit, which is what dropping does in evm2.
 */
export type ExecutedTx = {
  /** @internal */
  readonly '~engine': engine.Engine
  /** @internal */
  readonly '~result': TxResult.TxResult
  /** @internal */
  '~resolved': boolean
  /**
   * Identifies the transaction this handle was created for.
   *
   * @internal
   */
  readonly '~token': symbol
  /** Discards the transaction unless it was already resolved. */
  [Symbol.dispose](): void
}

/**
 * Creates a handle over an executed transaction.
 *
 * @internal
 */
export function from(options: from.Options): ExecutedTx {
  const executed: ExecutedTx = {
    '~engine': options.engine,
    '~resolved': false,
    '~result': options.result,
    '~token': options.token,
    [Symbol.dispose]() {
      // Idempotent: a scope exit after an explicit resolution must not discard a
      // second time, and evm2's drop is likewise a no-op once state is cleared.
      if (executed['~resolved']) return
      discard(executed)
    },
  }
  return executed
}

export declare namespace from {
  type Options = {
    engine: engine.Engine
    result: TxResult.TxResult
    token: symbol
  }
}

/**
 * Returns the transaction's result without resolving its state.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * using executed = Evm.transact(evm, transaction)
 * ExecutedTx.result(executed).status
 * ```
 *
 * @param executed - Executed transaction.
 * @returns The transaction's result.
 */
export function result(executed: ExecutedTx): TxResult.TxResult {
  return executed['~result']
}

/**
 * Accepts the transaction's state changes into the EVM.
 *
 * Later transactions on the same EVM see them. This resolves the handle and
 * releases the EVM.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * const executed = Evm.transact(evm, transaction)
 * ExecutedTx.commit(executed)
 * ```
 *
 * @param executed - Executed transaction.
 * @returns The transaction's result.
 */
export function commit(executed: ExecutedTx): TxResult.TxResult {
  claim(executed)
  executed['~engine'].resolve('commit', executed['~token'])
  return executed['~result']
}

export declare namespace commit {
  type ErrorType = ResolvedError | Errors.GlobalErrorType
}

/**
 * Drops the transaction's state changes, keeping its result.
 *
 * The EVM's accepted state is untouched, which is what a `using` declaration
 * does on scope exit.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * const executed = Evm.transact(evm, transaction)
 * ExecutedTx.discard(executed)
 * ```
 *
 * @param executed - Executed transaction.
 * @returns The transaction's result.
 */
export function discard(executed: ExecutedTx): TxResult.TxResult {
  claim(executed)
  executed['~engine'].resolve('discard', executed['~token'])
  return executed['~result']
}

export declare namespace discard {
  type ErrorType = ResolvedError | Errors.GlobalErrorType
}

/**
 * Streams the transaction's changes to a sink, then accepts them.
 *
 * The sink decides: if it throws, the transaction is discarded instead of
 * committed and the throw is what surfaces. That is evm2's own rule, so a sink
 * that fails cannot leave state half-applied.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * const executed = Evm.transact(evm, transaction)
 *
 * ExecutedTx.commitWith(executed, {
 *   storage(change) {
 *     persist(change)
 *   }
 * })
 * ```
 *
 * @param executed - Executed transaction.
 * @param sink - Sink to receive the changes.
 * @returns The transaction's result.
 */
export function commitWith(
  executed: ExecutedTx,
  sink: StateChange.Sink,
): TxResult.TxResult {
  claim(executed)
  executed['~engine'].resolveWith(
    'commitWith',
    dispatch(sink),
    executed['~token'],
  )
  return executed['~result']
}

export declare namespace commitWith {
  type ErrorType = ResolvedError | Errors.GlobalErrorType
}

/**
 * Streams the transaction's changes to a sink, then drops them.
 *
 * Observes exactly what {@link ox#ExecutedTx.(commitWith:function)} observes
 * without touching the EVM's accepted state.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * const executed = Evm.transact(evm, transaction)
 *
 * ExecutedTx.discardWith(executed, {
 *   storage(change) {
 *     audit(change)
 *   }
 * })
 * ```
 *
 * @param executed - Executed transaction.
 * @param sink - Sink to receive the changes.
 * @returns The transaction's result.
 */
export function discardWith(
  executed: ExecutedTx,
  sink: StateChange.Sink,
): TxResult.TxResult {
  claim(executed)
  executed['~engine'].resolveWith(
    'discardWith',
    dispatch(sink),
    executed['~token'],
  )
  return executed['~result']
}

export declare namespace discardWith {
  type ErrorType = ResolvedError | Errors.GlobalErrorType
}

/**
 * Moves the transaction's state out of the EVM as owned state.
 *
 * The EVM does not accept the changes: the caller holds them and decides what to
 * do with them.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx, PendingState } from 'ox/evm'
 *
 * const executed = Evm.transact(evm, transaction)
 * const { pendingState } = ExecutedTx.detach(executed)
 * PendingState.isEmpty(pendingState)
 * ```
 *
 * @param executed - Executed transaction.
 * @returns The result with its detached state.
 */
export function detach(executed: ExecutedTx): TxResultWithState {
  claim(executed)
  return {
    pendingState: PendingState.from(
      executed['~engine'].detach(executed['~token']),
    ),
    result: executed['~result'],
  }
}

export declare namespace detach {
  type ErrorType = ResolvedError | Errors.GlobalErrorType
}

/** A transaction's result paired with the state it detached into. */
export type TxResultWithState = {
  /** State the transaction left, owned by the caller. */
  pendingState: PendingState.PendingState
  /** Execution result. */
  result: TxResult.TxResult
}

// Routes one streamed record to the sink method that describes it.
function dispatch(sink: StateChange.Sink) {
  return (
    record: Parameters<Parameters<engine.Engine['resolveWith']>[1]>[0],
  ) => {
    // `kind` is the wire's routing tag, so each callback gets the record without
    // it: the same shape a sink sees visiting a detached pending state.
    if (record.kind === 'bytecode')
      settled(sink.bytecode?.(record.codeHash, record.code))
    else if (record.kind === 'account')
      settled(
        sink.account?.({
          address: record.address,
          created: record.created,
          current: record.current,
          original: record.original,
          selfdestructed: record.selfdestructed,
        }),
      )
    else if (record.kind === 'accountRead')
      settled(
        sink.accountRead?.({
          address: record.address,
          current: record.current,
        }),
      )
    else if (record.kind === 'storage')
      settled(
        sink.storage?.({
          address: record.address,
          current: record.current,
          key: record.key,
          original: record.original,
        }),
      )
    else if (record.kind === 'storageRead')
      settled(
        sink.storageRead?.({
          address: record.address,
          current: record.current,
          key: record.key,
        }),
      )
    else settled(sink.storageWipe?.(record.address))
  }
}

// Refusing a second resolution here, not just in the engine, keeps a reused
// handle from resolving whichever transaction is outstanding by then.
function claim(executed: ExecutedTx) {
  if (executed['~resolved']) throw new ResolvedError()
  executed['~resolved'] = true
}

// evm2 decides whether to commit the moment a sink callback returns, so a promise
// rejecting later could not stop a commit that already happened. Failing now
// discards instead, which is what the sink contract promises.
function settled(returned: void) {
  if (typeof (returned as { then?: unknown } | undefined)?.then === 'function')
    throw new AsyncSinkError()
}

/** Thrown when a sink callback returned a promise. */
export class AsyncSinkError extends Errors.BaseError {
  override readonly name = 'ExecutedTx.AsyncSinkError'

  constructor() {
    super('A state-change sink returned a promise.', {
      metaMessages: [
        'Sinks are synchronous: evm2 decides whether to commit as each record returns.',
        'The transaction was discarded.',
      ],
    })
  }
}

/** Thrown when an executed transaction is resolved twice. */
export class ResolvedError extends Errors.BaseError {
  override readonly name = 'ExecutedTx.ResolvedError'

  constructor() {
    super('This transaction was already resolved.', {
      metaMessages: [
        'It was committed, discarded, or detached, and cannot be resolved again.',
      ],
    })
  }
}
