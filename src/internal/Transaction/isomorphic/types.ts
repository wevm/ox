import type { OneOf, UnionCompute } from '../../types.js'
import type {
  TransactionEip1559,
  TransactionEip1559_Rpc,
  TransactionEip1559_Type,
  TransactionEip1559_TypeRpc,
} from '../eip1559/types.js'
import type {
  TransactionEip2930,
  TransactionEip2930_Rpc,
  TransactionEip2930_Type,
  TransactionEip2930_TypeRpc,
} from '../eip2930/types.js'
import type {
  TransactionEip4844,
  TransactionEip4844_Rpc,
  TransactionEip4844_Type,
  TransactionEip4844_TypeRpc,
} from '../eip4844/types.js'
import type {
  TransactionEip7702,
  TransactionEip7702_Rpc,
  TransactionEip7702_Type,
  TransactionEip7702_TypeRpc,
} from '../eip7702/types.js'
import type {
  TransactionLegacy,
  TransactionLegacy_Rpc,
  TransactionLegacy_Type,
  TransactionLegacy_TypeRpc,
} from '../legacy/types.js'

/**
 * An isomorphic Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml).
 *
 * Supports the following Transaction Types:
 *
 * - `legacy`
 * - `eip1559`
 * - `eip2930`
 * - `eip4844`
 * - `eip7702`
 */
export type Transaction<
  pending extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = UnionCompute<
  OneOf<
    | TransactionLegacy<pending, bigintType, numberType>
    | TransactionEip1559<pending, bigintType, numberType>
    | TransactionEip2930<pending, bigintType, numberType>
    | TransactionEip4844<pending, bigintType, numberType>
    | TransactionEip7702<pending, bigintType, numberType>
  >
>

/**
 * An isomorphic RPC Transaction as defined in the [Execution API specification](https://github.com/ethereum/execution-apis/blob/main/src/schemas/transaction.yaml).
 *
 * Supports the following Transaction Types:
 *
 * - `0x0`: legacy transactions
 * - `0x1`: EIP-1559 transactions
 * - `0x2`: EIP-2930 transactions
 * - `0x3`: EIP-4844 transactions
 * - `0x4`: EIP-7702 transactions
 */
export type Transaction_Rpc<pending extends boolean = boolean> = UnionCompute<
  OneOf<
    | TransactionLegacy_Rpc<pending>
    | TransactionEip1559_Rpc<pending>
    | TransactionEip2930_Rpc<pending>
    | TransactionEip4844_Rpc<pending>
    | TransactionEip7702_Rpc<pending>
  >
>

/**
 * Union of Transaction types.
 *
 * - `legacy`
 * - `eip1559`
 * - `eip2930`
 * - `eip4844`
 * - `eip7702`
 * - any other string
 */
export type Transaction_Type =
  | TransactionLegacy_Type
  | TransactionEip1559_Type
  | TransactionEip2930_Type
  | TransactionEip4844_Type
  | TransactionEip7702_Type

/**
 * Union of RPC Transaction types.
 *
 * - `0x0`: legacy transactions
 * - `0x1`: EIP-1559 transactions
 * - `0x2`: EIP-2930 transactions
 * - `0x3`: EIP-4844 transactions
 * - `0x4`: EIP-7702 transactions
 * - any other string
 */
export type Transaction_TypeRpc =
  | TransactionLegacy_TypeRpc
  | TransactionEip1559_TypeRpc
  | TransactionEip2930_TypeRpc
  | TransactionEip4844_TypeRpc
  | TransactionEip7702_TypeRpc
