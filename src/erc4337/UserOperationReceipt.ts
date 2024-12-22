import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type * as Log from '../core/Log.js'
import type * as TransactionReceipt from '../core/TransactionReceipt.js'
import type * as EntryPoint from './EntryPoint.js'

/**
 * User Operation Receipt type.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationreceipt
 */
export type UserOperationReceipt<
  _entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  bigIntType = bigint,
  intType = number,
  receipt = TransactionReceipt.TransactionReceipt<
    TransactionReceipt.Status,
    TransactionReceipt.Type,
    bigIntType,
    intType
  >,
> = {
  /** Actual gas cost. */
  actualGasCost: bigIntType
  /** Actual gas used. */
  actualGasUsed: bigIntType
  /** Entrypoint address. */
  entryPoint: Address.Address
  /** Logs emitted during execution. */
  logs: Log.Log<false, bigIntType, intType>[]
  /** Anti-replay parameter. */
  nonce: bigIntType
  /** Paymaster for the user operation. */
  paymaster?: Address.Address | undefined
  /** Revert reason, if unsuccessful. */
  reason?: string | undefined
  /** Transaction receipt of the user operation execution. */
  receipt: receipt
  /** The account sending the user operation. */
  sender: Address.Address
  /** If the user operation execution was successful. */
  success: boolean
  /** Hash of the user operation. */
  userOpHash: Hex.Hex
}

/** RPC User Operation Receipt on EntryPoint 0.6 */
export type Rpc<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
> = UserOperationReceipt<
  entryPointVersion,
  Hex.Hex,
  Hex.Hex,
  TransactionReceipt.TransactionReceipt<
    TransactionReceipt.RpcStatus,
    TransactionReceipt.RpcType,
    Hex.Hex,
    Hex.Hex
  >
>
