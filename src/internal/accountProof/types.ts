import type { Address } from '../address/types.js'
import type { Hex } from '../hex/types.js'

/** An Account Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type AccountProof<bigintType = bigint, numberType = number> = {
  /** The address of the account. */
  address: Address
  /** The balance of the account. */
  balance: bigintType
  /** The code hash of the account. */
  codeHash: Hex
  /** The nonce of the account. */
  nonce: numberType
  /** The storage hash of the account. */
  storageHash: Hex
  /** The account proofs. */
  accountProof: readonly Hex[]
  /** The storage proofs. */
  storageProof: readonly StorageProof<bigintType>[]
}

/** An RPC Account Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type AccountProof_Rpc = AccountProof<Hex, Hex>

/** A Storage Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type StorageProof<bigintType = bigint> = {
  /** The key of the storage. */
  key: Hex
  /** The proofs of the storage. */
  proof: readonly Hex[]
  /** The value of the storage. */
  value: bigintType
}

/** An RPC Storage Proof as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/state.yaml). */
export type StorageProof_Rpc = StorageProof<Hex>
