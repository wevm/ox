import type { Address } from '../address/types.js'
import type { Hex } from '../hex/types.js'
import type { Compute } from '../types.js'

export type Transaction_Base<
  type extends string = string,
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = Compute<{
  /** Hash of the block that contains this transaction, or `null` if pending. */
  blockHash: pending extends true ? null : Hex
  /** Number of block containing this transaction or `null` if pending */
  blockNumber: pending extends true ? null : bigintType
  /** Chain ID that this transaction is valid on. */
  chainId: numberType
  /** @alias `input` Added for TransactionEnvelope - Transaction compatibility. */
  data: Hex
  /** Hash of this transaction */
  hash: Hex
  /** Contract code or a hashed method call with encoded args */
  input: Hex
  /** Gas provided for transaction execution */
  gas: bigintType
  /** Unique number identifying this transaction */
  nonce: bigintType
  /** Transaction recipient. `null` if the transaction is a contract creation. */
  to: Address | null
  /** Index of this transaction in the block or `null` if pending */
  transactionIndex: pending extends true ? null : numberType
  /** Transaction type */
  type: type
  /** Value in wei sent with this transaction */
  value: bigintType
  /** ECDSA signature r. */
  r: bigintType
  /** ECDSA signature s. */
  s: bigintType
  /** ECDSA signature yParity. */
  yParity: numberType
  /** @deprecated ECDSA signature v (for backwards compatibility). */
  v: numberType
}>

export type Transaction_BaseRpc<
  type extends string = string,
  pending extends boolean = boolean,
> = Transaction_Base<type, pending, Hex, Hex>
