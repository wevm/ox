import type * as Address from '../core/Address.js'
import type * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'
import type * as EntryPoint from './EntryPoint.js'

/** User Operation type. */
export type UserOperation<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  bigintType = bigint,
> = OneOf<
  | (entryPointVersion extends '0.6' ? V06<bigintType> : never)
  | (entryPointVersion extends '0.7' ? V07<bigintType> : never)
>

/** Type for User Operation on EntryPoint 0.6 */
export type V06<bigintType = bigint> = {
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** The amount of gas to allocate the main execution call */
  callGasLimit: bigintType
  /** Account init code. Only for new accounts. */
  initCode?: Hex.Hex | undefined
  /** Maximum fee per gas. */
  maxFeePerGas: bigintType
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: bigintType
  /** Anti-replay parameter. */
  nonce: bigintType
  /** Paymaster address with calldata. */
  paymasterAndData?: Hex.Hex | undefined
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigintType
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature: Hex.Hex
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: bigintType
}

/** Type for User Operation on EntryPoint 0.7 */
export type V07<bigintType = bigint> = {
  /** The data to pass to the `sender` during the main execution call. */
  callData: Hex.Hex
  /** The amount of gas to allocate the main execution call */
  callGasLimit: bigintType
  /** Account factory. Only for new accounts. */
  factory?: Address.Address | undefined
  /** Data for account factory. */
  factoryData?: Hex.Hex | undefined
  /** Maximum fee per gas. */
  maxFeePerGas: bigintType
  /** Maximum priority fee per gas. */
  maxPriorityFeePerGas: bigintType
  /** Anti-replay parameter. */
  nonce: bigintType
  /** Address of paymaster contract. */
  paymaster?: Address.Address | undefined
  /** Data for paymaster. */
  paymasterData?: Hex.Hex | undefined
  /** The amount of gas to allocate for the paymaster post-operation code. */
  paymasterPostOpGasLimit?: bigintType | undefined
  /** The amount of gas to allocate for the paymaster validation code. */
  paymasterVerificationGasLimit?: bigintType | undefined
  /** Extra gas to pay the Bundler. */
  preVerificationGas: bigintType
  /** The account making the operation. */
  sender: Address.Address
  /** Data passed into the account to verify authorization. */
  signature: Hex.Hex
  /** The amount of gas to allocate for the verification step. */
  verificationGasLimit: bigintType
}
