import type * as Hex from '../core/Hex.js'
import type { OneOf } from '../core/internal/types.js'
import type * as EntryPoint from './EntryPoint.js'

/** User Operation Gas type. */
export type UserOperationGas<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
  bigintType = bigint,
> = OneOf<
  | (entryPointVersion extends '0.6' ? V06<bigintType> : never)
  | (entryPointVersion extends '0.7' ? V07<bigintType> : never)
>

/** RPC User Operation Gas on EntryPoint 0.6 */
export type Rpc<
  entryPointVersion extends EntryPoint.Version = EntryPoint.Version,
> = UserOperationGas<entryPointVersion, Hex.Hex>

/** Type for User Operation Gas on EntryPoint 0.6 */
export type V06<bigintType = bigint> = {
  callGasLimit: bigintType
  preVerificationGas: bigintType
  verificationGasLimit: bigintType
}

/** RPC User Operation Gas on EntryPoint 0.6 */
export type RpcV06 = V06<Hex.Hex>

/** Type for User Operation Gas on EntryPoint 0.7 */
export type V07<bigintType = bigint> = {
  callGasLimit: bigintType
  paymasterVerificationGasLimit?: bigintType | undefined
  paymasterPostOpGasLimit?: bigintType | undefined
  preVerificationGas: bigintType
  verificationGasLimit: bigintType
}

/** RPC User Operation Gas on EntryPoint 0.7 */
export type RpcV07 = V07<Hex.Hex>
