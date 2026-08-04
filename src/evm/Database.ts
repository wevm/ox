import type * as Address from '../core/Address.js'
import * as Bytes from '../core/Bytes.js'
import * as Errors from '../core/Errors.js'
import * as Hash from '../core/Hash.js'
import * as Hex from '../core/Hex.js'
import type * as internal from './internal/database.js'

/**
 * State an EVM reads through.
 *
 * A database answers reads and nothing else. Writes accumulate inside the EVM,
 * never reaching back through this boundary, so a source can be a plain object
 * over local state or a view onto a remote node.
 *
 * Reads are synchronous here. Asynchronous sources arrive with a separate type.
 */
export type Database = internal.Database

/** An account, as a database reports it. */
export type Account = internal.Account

/**
 * Creates an in-memory database.
 *
 * Code is supplied inline with each account, so
 * {@link ox#Database.(Database:type)}`.getCodeByHash` is never reached: evm2
 * files inline code under its hash when it loads the account.
 *
 * @example
 * ```ts twoslash
 * import { Database } from 'ox/evm'
 *
 * const database = Database.fromMemory({
 *   accounts: {
 *     '0x0000000000000000000000000000000000000001': {
 *       balance: 1n
 *     },
 *     '0x0000000000000000000000000000000000000002': {
 *       code: '0x5f5ff3'
 *     }
 *   }
 * })
 * ```
 *
 * @param options - Initial state.
 * @returns An in-memory database.
 */
export function fromMemory(options: fromMemory.Options = {}): Database {
  type Entry = {
    balance: bigint
    code: Bytes.Bytes | undefined
    codeHash: Hex.Hex
    nonce: bigint
    storage: Map<bigint, bigint>
  }

  const emptyCodeHash = Hash.keccak256('0x')
  const accounts = new Map<string, Entry>()
  for (const [address, account] of Object.entries(options.accounts ?? {})) {
    // Copied, not referenced: `Bytes.from` hands back a caller's own array, and
    // mutating it later would change the code while `codeHash` stayed stale.
    const code = account.code
      ? Uint8Array.from(Bytes.from(account.code))
      : undefined
    accounts.set(address.toLowerCase(), {
      balance: account.balance ?? 0n,
      code,
      codeHash: code ? Hash.keccak256(Hex.fromBytes(code)) : emptyCodeHash,
      nonce: account.nonce ?? 0n,
      storage: new Map(
        Object.entries(account.storage ?? {}).map(([slot, value]) => [
          BigInt(slot),
          value,
        ]),
      ),
    })
  }

  const blockHashes = new Map(
    Object.entries(options.blockHashes ?? {}).map(([number, value]) => [
      BigInt(number),
      value,
    ]),
  )

  return {
    getAccount(address) {
      const account = accounts.get(address.toLowerCase())
      if (!account) return undefined
      return {
        balance: account.balance,
        // Copied on the way out too: handing back the stored array would let a
        // caller change the executed code while `codeHash` stayed committed.
        code: account.code ? Uint8Array.from(account.code) : undefined,
        codeHash: account.codeHash,
        nonce: account.nonce,
      }
    },
    getBlockHash(number) {
      // evm2 range-checks `BLOCKHASH` before asking, so a number reaching here
      // is one the chain has and this database is missing.
      const blockHash = blockHashes.get(number)
      if (!blockHash) throw new MissingBlockHashError({ number })
      return blockHash
    },
    getCodeByHash(codeHash) {
      for (const account of accounts.values())
        if (
          account.code &&
          account.codeHash.toLowerCase() === codeHash.toLowerCase()
        )
          return Uint8Array.from(account.code)
      return new Uint8Array()
    },
    getStorage(address, key) {
      return accounts.get(address.toLowerCase())?.storage.get(key) ?? 0n
    },
  }
}

export declare namespace fromMemory {
  type Options = {
    /** Accounts to seed, keyed by address. */
    accounts?:
      | Record<
          Address.Address | (string & {}),
          {
            /** Balance in wei. @default 0n */
            balance?: bigint | undefined
            /** Deployed code. @default '0x' */
            code?: Hex.Hex | Bytes.Bytes | undefined
            /** Nonce. @default 0n */
            nonce?: bigint | undefined
            /** Storage slots, keyed by slot. */
            storage?: Record<string, bigint> | undefined
          }
        >
      | undefined
    /**
     * Historical block hashes, keyed by block number. A `BLOCKHASH` for a
     * height inside the window but absent here fails the read.
     */
    blockHashes?: Record<string, Hex.Hex> | undefined
  }
}

/** Thrown when a `BLOCKHASH` the chain retains was never seeded. */
export class MissingBlockHashError extends Errors.BaseError {
  override readonly name = 'Database.MissingBlockHashError'

  constructor({ number }: { number: bigint }) {
    super('The database has no hash for a block the chain retains.', {
      metaMessages: [
        `Block: ${number}`,
        'Seed it through `blockHashes` to execute this transaction.',
      ],
    })
  }
}
