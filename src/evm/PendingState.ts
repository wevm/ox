import type * as Address from '../core/Address.js'
import type * as Bytes from '../core/Bytes.js'
import type * as Hex from '../core/Hex.js'
import type * as codec from './internal/codec.js'

/**
 * A transaction's state changes, moved out of the EVM and owned by the caller.
 *
 * Every account and storage slot the transaction touched, each carrying the
 * value it had at the transaction boundary next to its present value. Accounts
 * it only read are included: the record is what the transaction observed, not
 * just what it wrote.
 *
 * Stream it with {@link ox#StateChange.(visit:function)}.
 */
export type PendingState = {
  /** @internal */
  readonly '~changes': codec.Changes
}

/**
 * Wraps a decoded change stream as owned state.
 *
 * @internal
 */
export function from(changes: codec.Changes): PendingState {
  return { '~changes': changes }
}

/**
 * Unwraps the decoded change stream.
 *
 * @internal
 */
export function changes(state: PendingState): codec.Changes {
  return state['~changes']
}

/**
 * Returns whether the transaction touched no accounts and no storage.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { ExecutedTx, PendingState } from 'ox/evm'
 *
 * const { pendingState } = ExecutedTx.detach(executed)
 * PendingState.isEmpty(pendingState)
 * // @log: false
 * ```
 *
 * @param state - Pending state.
 * @returns Whether it holds nothing.
 */
export function isEmpty(state: PendingState): boolean {
  const changes = state['~changes']
  // evm2 keys emptiness on whether any account or slot was loaded at all, so
  // reads count: a transaction that only read is not empty.
  return (
    changes.accounts.length === 0 &&
    changes.accountReads.length === 0 &&
    changes.storage.length === 0 &&
    changes.storageReads.length === 0
  )
}

/**
 * Returns an account's present value, when the transaction touched it.
 *
 * `undefined` covers both an account the transaction never touched and one it
 * deleted.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { ExecutedTx, PendingState } from 'ox/evm'
 *
 * const { pendingState } = ExecutedTx.detach(executed)
 * PendingState.accountInfo(
 *   pendingState,
 *   '0x0000000000000000000000000000000000000001'
 * )
 * ```
 *
 * @param state - Pending state.
 * @param address - Account to read.
 * @returns The account's present value.
 */
export function accountInfo(
  state: PendingState,
  address: Address.Address,
): AccountInfo | undefined {
  const changes = state['~changes']
  const key = address.toLowerCase()
  for (const account of [...changes.accounts, ...changes.accountReads]) {
    if (account.address.toLowerCase() !== key) continue
    const current = account.current
    if (!current) return undefined
    // The stream carries code once, keyed by hash; joining it back mirrors
    // evm2's account_info, whose AccountInfo includes code when loaded.
    const code = changes.bytecode.find(
      (entry) =>
        entry.codeHash.toLowerCase() === current.codeHash.toLowerCase(),
    )?.code
    return { ...current, ...(code ? { code } : {}) }
  }
  return undefined
}

/** An account's present value inside a pending state. */
export type AccountInfo = {
  /** Balance in wei. */
  balance: bigint
  /** Code, when the transaction loaded it. */
  code?: Bytes.Bytes | undefined
  /** Hash of the account's code. */
  codeHash: Hex.Hex
  /** Nonce. */
  nonce: bigint
}

/**
 * Returns state with an account's values replaced.
 *
 * The state is not modified; the returned copy is what
 * {@link ox#Evm.(commitSource:function)} applies. Use this to adjust what a
 * transaction left before putting it back.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Evm, ExecutedTx, PendingState } from 'ox/evm'
 *
 * const { pendingState } = ExecutedTx.detach(executed)
 *
 * // Put the balance back to what it was, then apply the rest.
 * const edited = PendingState.insertAccount(pendingState, {
 *   address,
 *   current: { balance: 0n, codeHash, nonce: 1n },
 *   original: { balance: 0n, codeHash, nonce: 1n },
 * })
 * Evm.commitSource(evm, edited)
 * ```
 *
 * @param state - Pending state.
 * @param options - Account, and the values to give it.
 * @returns State carrying the account.
 */
export function insertAccount(
  state: PendingState,
  options: insertAccount.Options,
): PendingState {
  const changes = state['~changes']
  const address = options.address.toLowerCase()
  const entry = {
    address: options.address,
    ...(options.current ? { current: options.current } : {}),
    ...(options.original ? { original: options.original } : {}),
  }
  return from({
    ...changes,
    accounts: [
      ...changes.accounts.filter(
        (change) => change.address.toLowerCase() !== address,
      ),
      entry,
    ],
  })
}

export declare namespace insertAccount {
  type Options = {
    /** Account to insert. */
    address: Address.Address
    /** Value after the change. Omit for an account that does not exist. */
    current?: codec.ChangeAccount | undefined
    /** Value at the transaction boundary. Omit for one that did not exist. */
    original?: codec.ChangeAccount | undefined
  }
}

/**
 * Returns state with a storage slot's values replaced.
 *
 * The state is not modified; the returned copy is what
 * {@link ox#Evm.(commitSource:function)} applies.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { PendingState } from 'ox/evm'
 *
 * const edited = PendingState.insertStorage(pendingState, {
 *   address,
 *   current: 1n,
 *   key: 0n,
 *   original: 0n,
 * })
 * ```
 *
 * @param state - Pending state.
 * @param options - Slot, and the values to give it.
 * @returns State carrying the slot.
 */
export function insertStorage(
  state: PendingState,
  options: insertStorage.Options,
): PendingState {
  const changes = state['~changes']
  const address = options.address.toLowerCase()
  return from({
    ...changes,
    storage: [
      ...changes.storage.filter(
        (change) =>
          change.address.toLowerCase() !== address ||
          change.key !== options.key,
      ),
      {
        address: options.address,
        current: options.current,
        key: options.key,
        original: options.original,
      },
    ],
  })
}

export declare namespace insertStorage {
  type Options = {
    /** Account holding the slot. */
    address: Address.Address
    /** Value after the change. */
    current: bigint
    /** Slot to insert. */
    key: bigint
    /** Value at the transaction boundary. */
    original: bigint
  }
}
