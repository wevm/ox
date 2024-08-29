import type { Hex } from '../../hex/types.js'
import type { IsNarrowable, IsNever, OneOf } from '../../types.js'
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
  TransactionEnvelopeEip1559_Type,
} from '../eip1559/types.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
  TransactionEnvelopeEip2930_Type,
} from '../eip2930/types.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
  TransactionEnvelopeEip4844_Type,
} from '../eip4844/types.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
  TransactionEnvelopeEip7702_Type,
} from '../eip7702/types.js'
import type {
  TransactionEnvelopeLegacy,
  TransactionEnvelopeLegacy_Serialized,
  TransactionEnvelopeLegacy_Type,
} from '../legacy/types.js'

export type TransactionEnvelope<
  signed extends boolean = boolean,
  bigintType = bigint,
  numberType = number,
> = OneOf<
  | TransactionEnvelopeLegacy<signed, bigintType, numberType>
  | TransactionEnvelopeEip1559<signed, bigintType, numberType>
  | TransactionEnvelopeEip2930<signed, bigintType, numberType>
  | TransactionEnvelopeEip4844<signed, bigintType, numberType>
  | TransactionEnvelopeEip7702<signed, bigintType, numberType>
>

export type TransactionEnvelope_Rpc<signed extends boolean = boolean> =
  TransactionEnvelope<signed, Hex, Hex>

export type TransactionEnvelope_Serialized<
  type extends TransactionEnvelope_Type = TransactionEnvelope_Type,
  result =
    | (type extends 'eip1559' ? TransactionEnvelopeEip1559_Serialized : never)
    | (type extends 'eip2930' ? TransactionEnvelopeEip2930_Serialized : never)
    | (type extends 'eip4844' ? TransactionEnvelopeEip4844_Serialized : never)
    | (type extends 'eip7702' ? TransactionEnvelopeEip7702_Serialized : never)
    | (type extends 'legacy' ? TransactionEnvelopeLegacy_Serialized : never),
> = IsNarrowable<type, string> extends true
  ? IsNever<result> extends true
    ? `0x${string}`
    : result
  : `0x${string}`

export type TransactionEnvelope_Signed<
  bigintType = bigint,
  numberType = number,
> = TransactionEnvelope<true, bigintType, numberType>

export type TransactionEnvelope_Type =
  | TransactionEnvelopeLegacy_Type
  | TransactionEnvelopeEip1559_Type
  | TransactionEnvelopeEip2930_Type
  | TransactionEnvelopeEip4844_Type
  | TransactionEnvelopeEip7702_Type
  | (string & {})
