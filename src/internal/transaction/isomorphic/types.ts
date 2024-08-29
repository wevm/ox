import type { Hex } from '../../hex/types.js'
import type { OneOf, UnionCompute } from '../../types.js'
import type { Transaction_Eip1559 } from '../eip1559/types.js'
import type { Transaction_Eip2930 } from '../eip2930/types.js'
import type { Transaction_Eip4844 } from '../eip4844/types.js'
import type { Transaction_Eip7702 } from '../eip7702/types.js'
import type { Transaction_Legacy } from '../legacy/types.js'

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

export type Transaction_Rpc<pending extends boolean = boolean> = Transaction<
  pending,
  Hex,
  Hex
>
