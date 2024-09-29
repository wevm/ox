import type { AccessList } from '../AccessList/types.js'
import type { Address } from '../Address/types.js'
import type { Authorization_ListSigned } from '../Authorization/types.js'
import type { Hex } from '../Hex/types.js'
import type { TransactionEnvelope_Type } from '../TransactionEnvelope/isomorphic/types.js'
import type { Compute } from '../types.js'

/** A Transaction Request that is generic to all transaction types, as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/4aca1d7a3e5aab24c8f6437131289ad386944eaa/src/schemas/transaction.yaml#L358-L423). */
export type TransactionRequest<
  bigintType = bigint,
  numberType = number,
  type extends string = TransactionEnvelope_Type,
> = Compute<{
  /** EIP-2930 Access List. */
  accessList?: AccessList | undefined
  /** EIP-7702 Authorization List. */
  authorizationList?:
    | Authorization_ListSigned<bigintType, numberType>
    | undefined
  /** Versioned hashes of blobs to be included in the transaction. */
  blobVersionedHashes?: readonly Hex[]
  /** Raw blob data. */
  blobs?: readonly Hex[] | undefined
  /** EIP-155 Chain ID. */
  chainId?: numberType | undefined
  /** Contract code or a hashed method call with encoded args */
  data?: Hex | undefined
  /** @alias `data` – added for TransactionEnvelope - Transaction compatibility. */
  input?: Hex | undefined
  /** Sender of the transaction. */
  from?: Address | undefined
  /** Gas provided for transaction execution */
  gas?: bigintType | undefined
  /** Base fee per gas. */
  gasPrice?: bigintType | undefined
  /** Maximum total fee per gas sender is willing to pay for blob gas (in wei). */
  maxFeePerBlobGas?: bigintType | undefined
  /** Total fee per gas in wei (gasPrice/baseFeePerGas + maxPriorityFeePerGas). */
  maxFeePerGas?: bigintType | undefined
  /** Max priority fee per gas (in wei). */
  maxPriorityFeePerGas?: bigintType | undefined
  /** Unique number identifying this transaction */
  nonce?: bigintType | undefined
  /** Transaction recipient */
  to?: Address | null | undefined
  /** Transaction type */
  type?: type | undefined
  /** Value in wei sent with this transaction */
  value?: bigintType | undefined
}>

/** RPC representation of a {@link ox#TransactionRequest.TransactionRequest}. */
export type TransactionRequest_Rpc = TransactionRequest<Hex, Hex, string>
