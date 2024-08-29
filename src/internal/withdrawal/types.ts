import type { Hex } from '../hex/types.js'

/** A Withdrawal as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/withdrawal.yaml). */
export type Withdrawal<bigintType = bigint, numberType = number> = {
  address: Hex
  amount: bigintType
  index: numberType
  validatorIndex: numberType
}

/** An RPC Withdrawal as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/withdrawal.yaml). */
export type Withdrawal_Rpc = Withdrawal<Hex, Hex>
