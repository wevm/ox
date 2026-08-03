import * as hash from '../../core/internal/hash.js'

/** An account, as the journal tracks it. */
export type Account = {
  balance: bigint
  nonce: bigint
  /** keccak256 of the account's code, as a word. Lazily derived. */
  codeHash: bigint | undefined
  /** Whether the account has code — with balance and nonce, drives EIP-161
   * emptiness. `undefined` until the code dimension has been fetched. */
  hasCode: boolean | undefined
}

/** State the journal cannot answer from its cache — the driver fetches it. */
export type StateRequest =
  | { kind: 'account'; address: string }
  | { kind: 'blockHash'; number: bigint }
  | { kind: 'code'; address: string }
  | { kind: 'storage'; address: string; slot: bigint }

/** Values a driver seeds in answer to a {@link StateRequest}. */
export type Seed =
  | { kind: 'account'; address: string; account: SeedAccount | undefined }
  | { kind: 'blockHash'; number: bigint; hash: bigint }
  | { kind: 'code'; address: string; code: Uint8Array }
  | { kind: 'storage'; address: string; slot: bigint; value: bigint }

/** An account as a state source reports it. `code` may be omitted and
 * resolved lazily via a `code` request. */
export type SeedAccount = {
  balance: bigint
  nonce: bigint
  code?: Uint8Array | undefined
}

type Entry =
  | { kind: 'balance'; address: string; previous: bigint }
  | { kind: 'nonce'; address: string; previous: bigint }
  | {
      kind: 'code'
      address: string
      previous: Uint8Array
      codeHash: bigint | undefined
      hasCode: boolean | undefined
    }
  | { kind: 'account'; address: string; previous: Account | null | undefined }
  | { kind: 'storage'; address: string; slot: bigint; previous: bigint }
  | {
      kind: 'transient'
      address: string
      slot: bigint
      previous: bigint | undefined
    }
  | { kind: 'warm-address'; address: string }
  | { kind: 'warm-slot'; address: string; slot: bigint }
  | { kind: 'refund'; previous: bigint }
  | { kind: 'log' }
  | { kind: 'selfdestruct'; address: string }
  | { kind: 'created'; address: string }

/** A log as the journal records it. */
export type Log = {
  address: string
  data: Uint8Array
  topics: readonly bigint[]
}

/**
 * The journaled state view: a single current-value cache over a state source,
 * with an undo log for frame-level revert.
 *
 * Cache semantics: an address absent from `accounts` is *unfetched* — reads
 * return `undefined` and the caller surfaces a {@link StateRequest}. A `null`
 * entry is *known-nonexistent*. Fetched pre-state enters beneath the journal
 * via {@link Journal.seed} and is never undone; mutations push undo entries.
 */
export type Journal = {
  accounts: Map<string, Account | null>
  blockHashes: Map<bigint, bigint>
  codes: Map<string, Uint8Array>
  created: Set<string>
  logs: Log[]
  /** Transaction-scoped original storage values (EIP-2200). Never reverted. */
  originals: Map<string, Map<bigint, bigint>>
  refund: bigint
  selfdestructs: Set<string>
  storage: Map<string, Map<bigint, bigint>>
  transient: Map<string, Map<bigint, bigint>>
  undo: Entry[]
  warmAddresses: Set<string>
  warmSlots: Map<string, Set<bigint>>
}

export function create(): Journal {
  return {
    accounts: new Map(),
    blockHashes: new Map(),
    codes: new Map(),
    created: new Set(),
    logs: [],
    originals: new Map(),
    refund: 0n,
    selfdestructs: new Set(),
    storage: new Map(),
    transient: new Map(),
    undo: [],
    warmAddresses: new Set(),
    warmSlots: new Map(),
  }
}

/** Inserts fetched pre-state beneath the journal. */
export function seed(journal: Journal, value: Seed): void {
  switch (value.kind) {
    case 'account': {
      const account = value.account
      if (account === undefined) journal.accounts.set(value.address, null)
      else {
        journal.accounts.set(value.address, {
          balance: account.balance,
          codeHash: undefined,
          hasCode:
            account.code === undefined ? undefined : account.code.length > 0,
          nonce: account.nonce,
        })
        if (account.code !== undefined)
          journal.codes.set(value.address, account.code)
      }
      return
    }
    case 'blockHash':
      journal.blockHashes.set(value.number, value.hash)
      return
    case 'code': {
      journal.codes.set(value.address, value.code)
      const account = journal.accounts.get(value.address)
      if (account) account.hasCode = value.code.length > 0
      return
    }
    case 'storage': {
      storageMap(journal.storage, value.address).set(value.slot, value.value)
      // First sight of the slot is its transaction-original value.
      const originals = storageMap(journal.originals, value.address)
      if (!originals.has(value.slot)) originals.set(value.slot, value.value)
      return
    }
  }
}

// Reads. `undefined` means unfetched — surface a StateRequest and restart.

export function getAccount(
  journal: Journal,
  address: string,
): Account | null | undefined {
  return journal.accounts.get(address)
}

export function getCode(
  journal: Journal,
  address: string,
): Uint8Array | undefined {
  // A known-nonexistent account has empty code without a fetch.
  if (journal.accounts.get(address) === null) return empty
  return journal.codes.get(address)
}

export function getStorage(
  journal: Journal,
  address: string,
  slot: bigint,
): bigint | undefined {
  return journal.storage.get(address)?.get(slot)
}

export function getOriginal(
  journal: Journal,
  address: string,
  slot: bigint,
): bigint | undefined {
  return journal.originals.get(address)?.get(slot)
}

export function getTransient(
  journal: Journal,
  address: string,
  slot: bigint,
): bigint {
  return journal.transient.get(address)?.get(slot) ?? 0n
}

export function getBlockHash(
  journal: Journal,
  number: bigint,
): bigint | undefined {
  return journal.blockHashes.get(number)
}

/** keccak256 of the account's code, derived once. Requires code present. */
export function getCodeHash(journal: Journal, address: string): bigint {
  const account = journal.accounts.get(address)
  if (!account) return 0n
  if (account.codeHash === undefined) {
    const code = journal.codes.get(address) ?? empty
    let value = 0n
    for (const byte of hash.keccak256(code))
      value = (value << 8n) | BigInt(byte)
    account.codeHash = value
  }
  return account.codeHash
}

/** EIP-161 emptiness: no balance, no nonce, no code. */
export function isEmpty(account: Account | null): boolean {
  if (account === null) return true
  return account.balance === 0n && account.nonce === 0n && !account.hasCode
}

// Warmth (EIP-2929). Marking is journaled so a revert re-cools.

export function isWarmAddress(journal: Journal, address: string): boolean {
  return journal.warmAddresses.has(address)
}

export function warmAddress(journal: Journal, address: string): void {
  if (journal.warmAddresses.has(address)) return
  journal.warmAddresses.add(address)
  journal.undo.push({ address, kind: 'warm-address' })
}

export function isWarmSlot(
  journal: Journal,
  address: string,
  slot: bigint,
): boolean {
  return journal.warmSlots.get(address)?.has(slot) ?? false
}

export function warmSlot(
  journal: Journal,
  address: string,
  slot: bigint,
): void {
  let slots = journal.warmSlots.get(address)
  if (!slots) {
    slots = new Set()
    journal.warmSlots.set(address, slots)
  }
  if (slots.has(slot)) return
  slots.add(slot)
  journal.undo.push({ address, kind: 'warm-slot', slot })
}

// Mutations. Every write pushes its inverse.

/** Materializes an account for writing, creating an empty one if absent.
 * Callers resolve the address first (values from an unfetched account would
 * be wrong); the undo entry still records the exact prior cache state, so a
 * revert restores unfetched-ness rather than inventing knowledge. */
function materialize(journal: Journal, address: string): Account {
  const existing = journal.accounts.get(address)
  if (existing) return existing
  journal.undo.push({ address, kind: 'account', previous: existing })
  const account: Account = {
    balance: 0n,
    codeHash: undefined,
    hasCode: false,
    nonce: 0n,
  }
  journal.accounts.set(address, account)
  journal.codes.set(address, empty)
  return account
}

export function setBalance(
  journal: Journal,
  address: string,
  balance: bigint,
): void {
  const account = materialize(journal, address)
  journal.undo.push({ address, kind: 'balance', previous: account.balance })
  account.balance = balance
}

export function setNonce(
  journal: Journal,
  address: string,
  nonce: bigint,
): void {
  const account = materialize(journal, address)
  journal.undo.push({ address, kind: 'nonce', previous: account.nonce })
  account.nonce = nonce
}

export function setCode(
  journal: Journal,
  address: string,
  code: Uint8Array,
): void {
  const account = materialize(journal, address)
  journal.undo.push({
    address,
    codeHash: account.codeHash,
    hasCode: account.hasCode,
    kind: 'code',
    previous: journal.codes.get(address) ?? empty,
  })
  journal.codes.set(address, code)
  account.codeHash = undefined
  account.hasCode = code.length > 0
}

export function setStorage(
  journal: Journal,
  address: string,
  slot: bigint,
  value: bigint,
): void {
  const map = storageMap(journal.storage, address)
  journal.undo.push({
    address,
    kind: 'storage',
    previous: map.get(slot) as bigint,
    slot,
  })
  map.set(slot, value)
}

export function setTransient(
  journal: Journal,
  address: string,
  slot: bigint,
  value: bigint,
): void {
  const map = storageMap(journal.transient, address)
  journal.undo.push({
    address,
    kind: 'transient',
    previous: map.get(slot),
    slot,
  })
  map.set(slot, value)
}

export function addRefund(journal: Journal, delta: bigint): void {
  journal.undo.push({ kind: 'refund', previous: journal.refund })
  journal.refund += delta
}

export function addLog(journal: Journal, log: Log): void {
  journal.undo.push({ kind: 'log' })
  journal.logs.push(log)
}

export function markSelfdestructed(journal: Journal, address: string): void {
  if (journal.selfdestructs.has(address)) return
  journal.selfdestructs.add(address)
  journal.undo.push({ address, kind: 'selfdestruct' })
}

export function markCreated(journal: Journal, address: string): void {
  if (journal.created.has(address)) return
  journal.created.add(address)
  journal.undo.push({ address, kind: 'created' })
}

export function isCreated(journal: Journal, address: string): boolean {
  return journal.created.has(address)
}

/** Returns accounts changed by mutations that survived frame reverts. */
export function dirtyAccounts(journal: Journal): Set<string> {
  const accounts = new Set<string>()
  for (const entry of journal.undo)
    if (
      entry.kind === 'account' ||
      entry.kind === 'balance' ||
      entry.kind === 'code' ||
      entry.kind === 'nonce' ||
      entry.kind === 'selfdestruct'
    )
      accounts.add(entry.address)
  return accounts
}

/** Returns storage slots changed by mutations that survived frame reverts. */
export function dirtyStorage(journal: Journal): Map<string, Set<bigint>> {
  const storage = new Map<string, Set<bigint>>()
  for (const entry of journal.undo) {
    if (entry.kind !== 'storage') continue
    let slots = storage.get(entry.address)
    if (!slots) {
      slots = new Set()
      storage.set(entry.address, slots)
    }
    slots.add(entry.slot)
  }
  return storage
}

// Checkpoints.

export function checkpoint(journal: Journal): number {
  return journal.undo.length
}

export function commit(journal: Journal, checkpoint: number): void {
  // Entries stay — only the rollback boundary moves. Nothing to do: commit
  // semantics are simply "do not revert past this point".
  void journal
  void checkpoint
}

export function revert(journal: Journal, checkpoint: number): void {
  const undo = journal.undo
  while (undo.length > checkpoint) {
    const entry = undo.pop() as Entry
    switch (entry.kind) {
      case 'account':
        if (entry.previous === undefined) {
          journal.accounts.delete(entry.address)
          journal.codes.delete(entry.address)
        } else if (entry.previous === null) {
          journal.accounts.set(entry.address, null)
          journal.codes.delete(entry.address)
        } else journal.accounts.set(entry.address, entry.previous)
        break
      case 'balance': {
        const account = journal.accounts.get(entry.address) as Account
        account.balance = entry.previous
        break
      }
      case 'nonce': {
        const account = journal.accounts.get(entry.address) as Account
        account.nonce = entry.previous
        break
      }
      case 'code': {
        const account = journal.accounts.get(entry.address) as Account
        journal.codes.set(entry.address, entry.previous)
        account.codeHash = entry.codeHash
        account.hasCode = entry.hasCode
        break
      }
      case 'created':
        journal.created.delete(entry.address)
        break
      case 'log':
        journal.logs.pop()
        break
      case 'refund':
        journal.refund = entry.previous
        break
      case 'selfdestruct':
        journal.selfdestructs.delete(entry.address)
        break
      case 'storage':
        storageMap(journal.storage, entry.address).set(
          entry.slot,
          entry.previous,
        )
        break
      case 'transient': {
        // Restore absence as absence — a phantom explicit zero would read
        // identically but pollute structural comparisons.
        const map = storageMap(journal.transient, entry.address)
        if (entry.previous === undefined) {
          map.delete(entry.slot)
          if (map.size === 0) journal.transient.delete(entry.address)
        } else map.set(entry.slot, entry.previous)
        break
      }
      case 'warm-address':
        journal.warmAddresses.delete(entry.address)
        break
      case 'warm-slot': {
        const slots = journal.warmSlots.get(entry.address)
        slots?.delete(entry.slot)
        if (slots?.size === 0) journal.warmSlots.delete(entry.address)
        break
      }
    }
  }
}

const empty = new Uint8Array(0)

function storageMap(
  maps: Map<string, Map<bigint, bigint>>,
  address: string,
): Map<bigint, bigint> {
  let map = maps.get(address)
  if (!map) {
    map = new Map()
    maps.set(address, map)
  }
  return map
}
