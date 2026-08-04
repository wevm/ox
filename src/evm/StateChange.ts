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
 * Every method is optional: a sink observes only what it cares about. This
 * mirrors evm2's `StateChangeSink`, whose methods all default to ignoring the
 * change.
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
  const changes = source['~changes']
  for (const { code, codeHash } of changes.bytecode)
    sink.bytecode?.(codeHash, code)
  for (const change of changes.accounts) sink.account?.(change)
  for (const address of changes.storageWipes) sink.storageWipe?.(address)
  for (const change of changes.storage) sink.storage?.(change)
  for (const change of changes.accountReads) sink.accountRead?.(change)
  for (const change of changes.storageReads) sink.storageRead?.(change)
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
