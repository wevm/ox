import type * as codec from './internal/codec.js'

/**
 * A block access list, as [EIP-7928](https://eips.ethereum.org/EIPS/eip-7928)
 * defines it.
 *
 * Enumerates every account and storage slot a block touches, with the value each
 * one held after each transaction. Attached to an EVM it replaces the database
 * for covered reads; built from executions it is what a block proposer publishes.
 *
 * Ordering is canonical: accounts sorted by address, entries sorted by key. A
 * list read back carries that order whatever order it was written in.
 */
export type Bal = codec.Bal

/**
 * One account's entries.
 *
 * Every list is keyed by block access index, where index `0` is the pre-execution
 * state and transaction `i` writes at index `i + 1`. A read is an entry with no
 * changes, which is how a list records that a slot was touched without being
 * written.
 */
export type Account = codec.BalAccount

/**
 * Returns the accounts a list covers, in the order it carries them.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bal } from 'ox/evm'
 *
 * Bal.addresses(bal)
 * // @log: ['0x…', '0x…']
 * ```
 *
 * @param bal - List to read.
 * @returns Each covered address.
 */
export function addresses(bal: Bal): readonly `0x${string}`[] {
  return bal.accounts.map((account) => account.address)
}

/**
 * Returns whether a list covers a storage slot.
 *
 * A read that a list does not cover is refused rather than served from the
 * database, so this answers ahead of time what an execution would refuse.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bal } from 'ox/evm'
 *
 * Bal.covers(bal, { address, slot: 0n })
 * // @log: true
 * ```
 *
 * @param bal - List to read.
 * @param options - Account, and the slot to check within it.
 * @returns Whether the list covers it.
 */
export function covers(bal: Bal, options: covers.Options): boolean {
  const address = options.address.toLowerCase()
  const account = bal.accounts.find(
    (entry) => entry.address.toLowerCase() === address,
  )
  if (!account) return false
  if (options.slot === undefined) return true
  return (
    account.storageReads.includes(options.slot) ||
    account.storageChanges.some((entry) => entry.slot === options.slot)
  )
}

export declare namespace covers {
  type Options = {
    /** Account to look for. */
    address: `0x${string}`
    /** Slot to look for within the account. Omit to check the account alone. */
    slot?: bigint | undefined
  }
}

/**
 * Returns the value a list holds for a slot at a block access index.
 *
 * Resolves the same way a covered read does: the most recent write *strictly
 * before* the index. Transaction `i` records its post-state at index `i + 1`, so
 * reading at `i + 1` sees what preceded that transaction, not its own writes.
 * `undefined` when the list carries no applicable write, which is when an
 * execution would read through to the database.
 *
 * @example
 * ```ts twoslash
 * // @noErrors
 * import { Bal } from 'ox/evm'
 *
 * // The value the second transaction saw.
 * Bal.storageAt(bal, { address, index: 2n, slot: 0n })
 * ```
 *
 * @param bal - List to read.
 * @param options - Account, slot, and index to resolve at.
 * @returns The value, or `undefined` when none applies.
 */
export function storageAt(
  bal: Bal,
  options: storageAt.Options,
): bigint | undefined {
  const address = options.address.toLowerCase()
  const account = bal.accounts.find(
    (entry) => entry.address.toLowerCase() === address,
  )
  // A slot listed as a read carries no value even when the list also gives it
  // changes: evm2 folds reads in after changes, so the read wins and an
  // execution reads through to the database.
  if (account?.storageReads.includes(options.slot)) return undefined

  const slot = account?.storageChanges.find(
    (entry) => entry.slot === options.slot,
  )
  if (!slot) return undefined

  // Entries are ordered by index, and the first at or after the requested one
  // is not yet visible, so the value before it is what a read sees.
  let value: bigint | undefined
  for (const change of slot.changes) {
    if (change.index >= options.index) break
    value = change.value
  }
  return value
}

export declare namespace storageAt {
  type Options = {
    /** Account holding the slot. */
    address: `0x${string}`
    /** Block access index to resolve at. */
    index: bigint
    /** Slot to resolve. */
    slot: bigint
  }
}
