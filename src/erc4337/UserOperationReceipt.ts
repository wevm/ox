import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type * as Log from '../core/Log.js'
import type * as TransactionReceipt from '../core/TransactionReceipt.js'
import type * as EntryPoint from './EntryPoint.js'

/**
 * User Operation Receipt type.
 *
 * @link https://eips.ethereum.org/EIPS/eip-4337#-eth_getuseroperationreceipt
 */
export type UserOperationReceipt<
  _entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  bigIntType = bigint,
  intType = number,
  status = 'success' | 'reverted',
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
  receipt: TransactionReceipt.TransactionReceipt<
    status,
    TransactionReceipt.Type,
    bigIntType,
    intType
  >
  sender: Address.Address
  /** If the user operation execution was successful. */
  success: boolean
  /** Hash of the user operation. */
  userOpHash: Hex.Hex
}
