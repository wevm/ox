import type * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import type * as Hex from '../core/Hex.js'
import type * as PendingState from './PendingState.js'
import type * as codec from './internal/codec.js'

/** An account a transaction touched, with its boundary and present values. */
export type Account = codec.AccountChange

/** A storage slot a transaction touched. */
export type Storage = codec.StorageChange

/**
 * State a transaction changed, as a source streams it.
 *
 * Every method is optional: a sink observes only what it cares about, and an
 * unobserved change is simply ignored.
 */
export type Sink = {
  /** An account whose value changed. */
  account?: ((change: Account) => void) | undefined
  /** An account the transaction loaded but left unchanged. */
  accountRead?: ((change: Account) => void) | undefined
  /** Bytecode, keyed by its hash. */
  bytecode?: ((codeHash: Hex.Hex, code: Bytes.Bytes) => void) | undefined
  /** A storage slot whose value changed. */
  storage?: ((change: Storage) => void) | undefined
  /** A storage slot the transaction loaded but left unchanged. */
  storageRead?: ((change: Storage) => void) | undefined
  /** An account whose storage was wiped, before its slot changes. */
  storageWipe?: ((address: Address.Address) => void) | undefined
}

/** Something that can stream its state changes to a {@link ox#StateChange.Sink}. */
export type Source = PendingState.PendingState

/**
 * Streams a source's changes into a sink.
 *
 * Wipes arrive before the slot changes of the same account, so a sink applies
 * the wipe then the writes.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { ExecutedTx, StateChange } from 'ox/evm'
 *
 * const { pendingState } = ExecutedTx.detach(executed)
 *
 * StateChange.visit(pendingState, {
 *   storage(change) {
 *     console.log(change.address, change.key, change.current)
 *   }
 * })
 * ```
 *
 * @param source - Source of changes.
 * @param sink - Sink to receive them.
 */
export function visit(source: Source, sink: Sink): void {
  // Replays the records exactly as the adapter emitted them, which is evm2's
  // own visit order, so this and a streamed resolution observe one sequence.
  for (const record of source['~changes'].records) route(sink, record)
}

/**
 * Routes one decoded record to the sink method that describes it.
 *
 * `kind` is the wire's routing tag, so each callback receives the record
 * without it: one shape whether the record was streamed or visited. Returns the
 * callback's own return so a streamed resolution can refuse a thenable.
 *
 * @internal
 */
export function route(sink: Sink, record: codec.Change): unknown {
  if (record.kind === 'bytecode')
    return sink.bytecode?.(record.codeHash, record.code)
  if (record.kind === 'account')
    return sink.account?.({
      address: record.address,
      created: record.created,
      current: record.current,
      original: record.original,
      selfdestructed: record.selfdestructed,
    })
  if (record.kind === 'accountRead')
    return sink.accountRead?.({
      address: record.address,
      current: record.current,
    })
  if (record.kind === 'storage')
    return sink.storage?.({
      address: record.address,
      current: record.current,
      key: record.key,
      original: record.original,
    })
  if (record.kind === 'storageRead')
    return sink.storageRead?.({
      address: record.address,
      current: record.current,
      key: record.key,
    })
  return sink.storageWipe?.(record.address)
}

/**
 * Returns a sink forwarding every change to two sinks.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { StateChange } from 'ox/evm'
 *
 * StateChange.visit(
 *   pendingState,
 *   StateChange.tee(persist, audit)
 * )
 * ```
 *
 * @param a - First sink.
 * @param b - Second sink.
 * @returns A sink feeding both.
 */
export function tee(a: Sink, b: Sink): Sink {
  return {
    account(change) {
      a.account?.(change)
      b.account?.(change)
    },
    accountRead(change) {
      a.accountRead?.(change)
      b.accountRead?.(change)
    },
    bytecode(codeHash, code) {
      a.bytecode?.(codeHash, code)
      b.bytecode?.(codeHash, code)
    },
    storage(change) {
      a.storage?.(change)
      b.storage?.(change)
    },
    storageRead(change) {
      a.storageRead?.(change)
      b.storageRead?.(change)
    },
    storageWipe(address) {
      a.storageWipe?.(address)
      b.storageWipe?.(address)
    },
  }
}

/**
 * Returns a sink that ignores every change.
 *
 * @example
 * ```ts twoslash
 * import { StateChange } from 'ox/evm'
 *
 * const sink = StateChange.noop()
 * ```
 *
 * @returns A sink that does nothing.
 */
export function noop(): Sink {
  return {}
}
