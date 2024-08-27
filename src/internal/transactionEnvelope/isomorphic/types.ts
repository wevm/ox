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

export type TransactionEnvelope_Type =
  | TransactionEnvelopeLegacy_Type
  | TransactionEnvelopeEip1559_Type
  | TransactionEnvelopeEip2930_Type
  | TransactionEnvelopeEip4844_Type
  | TransactionEnvelopeEip7702_Type
  | (string & {})

export type TransactionEnvelope = OneOf<
  | TransactionEnvelopeLegacy
  | TransactionEnvelopeEip1559
  | TransactionEnvelopeEip2930
  | TransactionEnvelopeEip4844
  | TransactionEnvelopeEip7702
>

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
