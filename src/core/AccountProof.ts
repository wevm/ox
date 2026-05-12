import type * as Address from './Address.js'
import type * as Errors from './Errors.js'
import * as Hex from './Hex.js'
import * as Quantity from './internal/quantity.js'

/** An Account Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type AccountProof<bigintType = bigint, numberType = number> = {
  /** The address of the account. */
  address: Address.Address
  /** The balance of the account. */
  balance: bigintType
  /** The code hash of the account. */
  codeHash: Hex.Hex
  /** The nonce of the account. */
  nonce: numberType
  /** The storage hash of the account. */
  storageHash: Hex.Hex
  /** The account proofs. */
  accountProof: readonly Hex.Hex[]
  /** The storage proofs. */
  storageProof: readonly StorageProof<bigintType>[]
}

/** An RPC Account Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type Rpc = AccountProof<Hex.Hex, Hex.Hex>

/** A Storage Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type StorageProof<bigintType = bigint> = {
  /** The key of the storage. */
  key: Hex.Hex
  /** The proofs of the storage. */
  proof: readonly Hex.Hex[]
  /** The value of the storage. */
  value: bigintType
}

/** An RPC Storage Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type StorageProofRpc = StorageProof<Hex.Hex>

/**
 * Converts an {@link ox#AccountProof.Rpc} to an {@link ox#AccountProof.AccountProof}.
 *
 * @example
 * ```ts twoslash
 * import { AccountProof } from 'ox'
 *
 * const proof = AccountProof.fromRpc({
 *   address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   balance: '0x1',
 *   codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 *   nonce: '0x2',
 *   storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
 *   accountProof: [],
 *   storageProof: [
 *     {
 *       key: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *       proof: [],
 *       value: '0x3',
 *     },
 *   ],
 * })
 * // @log: {
 * // @log:   address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 * // @log:   balance: 1n,
 * // @log:   codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 * // @log:   nonce: 2,
 * // @log:   storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
 * // @log:   accountProof: [],
 * // @log:   storageProof: [
 * // @log:     {
 * // @log:       key: '0x0000000000000000000000000000000000000000000000000000000000000000',
 * // @log:       proof: [],
 * // @log:       value: 3n,
 * // @log:     },
 * // @log:   ],
 * // @log: }
 * ```
 *
 * @param proof - The RPC account proof.
 * @returns An instantiated {@link ox#AccountProof.AccountProof}.
 */
export function fromRpc(proof: Rpc): AccountProof {
  return {
    address: proof.address,
    balance: BigInt(proof.balance),
    codeHash: proof.codeHash,
    nonce: Number(proof.nonce),
    storageHash: proof.storageHash,
    accountProof: proof.accountProof,
    storageProof: proof.storageProof.map((slot) => ({
      key: slot.key,
      proof: slot.proof,
      value: BigInt(slot.value),
    })),
  }
}

export declare namespace fromRpc {
  type ErrorType = Errors.GlobalErrorType
}

/**
 * Converts an {@link ox#AccountProof.AccountProof} to an {@link ox#AccountProof.Rpc}.
 *
 * @example
 * ```ts twoslash
 * import { AccountProof } from 'ox'
 *
 * const proof = AccountProof.toRpc({
 *   address: '0xb9CAB4F0E46F7F6b1024b5A7463734fa68E633f9',
 *   balance: 1n,
 *   codeHash: '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
 *   nonce: 2,
 *   storageHash: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
 *   accountProof: [],
 *   storageProof: [
 *     {
 *       key: '0x0000000000000000000000000000000000000000000000000000000000000000',
 *       proof: [],
 *       value: 3n,
 *     },
 *   ],
 * })
 * ```
 *
 * @param proof - The account proof to convert.
 * @returns An RPC account proof.
 */
export function toRpc(proof: AccountProof): Rpc {
  return {
    address: proof.address,
    balance: Hex.fromNumber(proof.balance),
    codeHash: proof.codeHash,
    nonce: Hex.fromNumber(proof.nonce),
    storageHash: proof.storageHash,
    accountProof: proof.accountProof,
    storageProof: proof.storageProof.map((slot) => ({
      key: slot.key,
      proof: slot.proof,
      value: Quantity.bigIntToQuantity(slot.value)!,
    })),
  }
}

export declare namespace toRpc {
  type ErrorType = Errors.GlobalErrorType
}
