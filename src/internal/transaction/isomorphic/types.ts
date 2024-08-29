import type { Compute, OneOf, UnionCompute } from '../../types.js'
import type {
  Transaction_Eip1559,
  Transaction_Eip1559Rpc,
  Transaction_Eip1559Type,
  Transaction_Eip1559TypeRpc,
} from '../eip1559/types.js'
import type {
  Transaction_Eip2930,
  Transaction_Eip2930Rpc,
  Transaction_Eip2930Type,
  Transaction_Eip2930TypeRpc,
} from '../eip2930/types.js'
import type {
  Transaction_Eip4844,
  Transaction_Eip4844Rpc,
  Transaction_Eip4844Type,
  Transaction_Eip4844TypeRpc,
} from '../eip4844/types.js'
import type {
  Transaction_Eip7702,
  Transaction_Eip7702Rpc,
  Transaction_Eip7702Type,
  Transaction_Eip7702TypeRpc,
} from '../eip7702/types.js'
import type {
  Transaction_Legacy,
  Transaction_LegacyRpc,
  Transaction_LegacyType,
  Transaction_LegacyTypeRpc,
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
    | Transaction_Legacy<pending, bigintType, numberType>
    | Transaction_Eip1559<pending, bigintType, numberType>
    | Transaction_Eip2930<pending, bigintType, numberType>
    | Transaction_Eip4844<pending, bigintType, numberType>
    | Transaction_Eip7702<pending, bigintType, numberType>
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
    | Transaction_LegacyRpc<pending>
    | Transaction_Eip1559Rpc<pending>
    | Transaction_Eip2930Rpc<pending>
    | Transaction_Eip4844Rpc<pending>
    | Transaction_Eip7702Rpc<pending>
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
  | Transaction_LegacyType
  | Transaction_Eip1559Type
  | Transaction_Eip2930Type
  | Transaction_Eip4844Type
  | Transaction_Eip7702Type

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
  | Transaction_LegacyTypeRpc
  | Transaction_Eip1559TypeRpc
  | Transaction_Eip2930TypeRpc
  | Transaction_Eip4844TypeRpc
  | Transaction_Eip7702TypeRpc
