import * as Errors from '../core/Errors.js'
import * as PendingState from './PendingState.js'
import * as StateChange from './StateChange.js'
import type * as TxResult from './TxResult.js'
import type { ReentrancyError } from './internal/bindings.js'
import type { DecodeError } from './internal/codec.js'
import type * as engine from './internal/engine.js'
import type {
  NoBlockStateError,
  NotExecutedError,
  SinkError,
} from './internal/engine.js'

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
 * scope exit, which is what dropping the handle does natively.
 */
export type ExecutedTx = {
  /** @internal */
  readonly '~engine': engine.Engine
  /** @internal */
  readonly '~result': TxResult.TxResult
  /** @internal */
  '~resolved': boolean
  /**
   * Identifies the transaction this handle was created for. The engine holds it
   * weakly, discarding the transaction once no handle can reach it.
   *
   * @internal
   */
  readonly '~token': engine.Token
  /** Discards the transaction unless it was already resolved. */
  [Symbol.dispose](): void
}

/**
 * `Symbol.dispose`, or the registered fallback engines without it agree on.
 *
 * TypeScript's transpiled `using` helper looks up
 * `Symbol.dispose ?? Symbol.for('Symbol.dispose')`, so keying the method the
 * same way makes disposal work where the symbol has not shipped (WebKit).
 */
const dispose: typeof Symbol.dispose =
  Symbol.dispose ?? (Symbol.for('Symbol.dispose') as typeof Symbol.dispose)

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
    [dispose]() {
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
    token: engine.Token
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
  type ErrorType =
    | NotExecutedError
    | ReentrancyError
    | ResolvedError
    | Errors.GlobalErrorType
}

/**
 * Accepts the transaction's state changes and records them in the block.
 *
 * The same acceptance {@link ox#ExecutedTx.(commit:function)} performs, plus the
 * changes are gathered into the block accumulator started by
 * {@link ox#Evm.(setBlockState:function)}. Resolving this way without one is a
 * failure rather than a silent plain commit.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx } from 'ox/evm'
 *
 * Evm.setBlockState(evm, true)
 *
 * for (const transaction of transactions)
 *   ExecutedTx.commitTo(Evm.transact(evm, transaction))
 *
 * const block = Evm.takeBlockState(evm)
 * ```
 *
 * @param executed - Executed transaction.
 * @returns The transaction's result.
 */
export function commitTo(executed: ExecutedTx): TxResult.TxResult {
  claim(executed)
  try {
    executed['~engine'].resolve('commitTo', executed['~token'])
  } catch (error) {
    // The adapter refuses before the transaction leaves the engine, so the handle
    // is still outstanding and has to stay resolvable.
    executed['~resolved'] = false
    throw error
  }
  return executed['~result']
}

export declare namespace commitTo {
  type ErrorType = commit.ErrorType | NoBlockStateError
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
  type ErrorType =
    | NotExecutedError
    | ReentrancyError
    | ResolvedError
    | Errors.GlobalErrorType
}

/**
 * Streams the transaction's changes to a sink, then accepts them.
 *
 * The sink decides: if it throws, the transaction is discarded instead of
 * committed and the throw is what surfaces. That is the engine's own rule, so a sink
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
  type ErrorType =
    | AsyncSinkError
    | NotExecutedError
    | ReentrancyError
    | ResolvedError
    | SinkError
    | Errors.GlobalErrorType
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
  type ErrorType =
    | AsyncSinkError
    | NotExecutedError
    | ReentrancyError
    | ResolvedError
    | SinkError
    | Errors.GlobalErrorType
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
export function detach(executed: ExecutedTx): TxResult.WithState {
  claim(executed)
  return {
    pendingState: PendingState.from(
      executed['~engine'].detach(executed['~token']),
    ),
    result: executed['~result'],
  }
}

export declare namespace detach {
  type ErrorType =
    | DecodeError
    | NotExecutedError
    | ReentrancyError
    | ResolvedError
    | Errors.GlobalErrorType
}

// Routes one streamed record to the sink method that describes it.
function dispatch(sink: StateChange.Sink) {
  return (
    record: Parameters<Parameters<engine.Engine['resolveWith']>[1]>[0],
  ) => {
    settled(StateChange.route(sink, record))
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
function settled(returned: unknown) {
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
