import type * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import type * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import type * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import type * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { IsNarrowable, IsNever, OneOf } from '../../types.js'

export type TransactionEnvelope<
  bigintType = bigint,
  numberType = number,
> = OneOf<
  | TransactionEnvelopeLegacy.TransactionEnvelope<bigintType, numberType>
  | TransactionEnvelopeEip1559.TransactionEnvelope<bigintType, numberType>
  | TransactionEnvelopeEip2930.TransactionEnvelope<bigintType, numberType>
  | TransactionEnvelopeEip4844.TransactionEnvelope<bigintType, numberType>
  | TransactionEnvelopeEip7702.TransactionEnvelope<bigintType, numberType>
>

export type Rpc = OneOf<
  | TransactionEnvelopeLegacy.Rpc
  | TransactionEnvelopeEip1559.Rpc
  | TransactionEnvelopeEip2930.Rpc
  | TransactionEnvelopeEip4844.Rpc
  | TransactionEnvelopeEip7702.Rpc
>

export type Serialized<
  type extends Type = Type,
  result =
    | (type extends 'eip1559' ? TransactionEnvelopeEip1559.Serialized : never)
    | (type extends 'eip2930' ? TransactionEnvelopeEip2930.Serialized : never)
    | (type extends 'eip4844' ? TransactionEnvelopeEip4844.Serialized : never)
    | (type extends 'eip7702' ? TransactionEnvelopeEip7702.Serialized : never)
    | (type extends 'legacy' ? TransactionEnvelopeLegacy.Serialized : never),
> = IsNarrowable<type, string> extends true
  ? IsNever<result> extends true
    ? `0x${string}`
    : result
  : `0x${string}`

export type Type =
  | TransactionEnvelopeLegacy.Type
  | TransactionEnvelopeEip1559.Type
  | TransactionEnvelopeEip2930.Type
  | TransactionEnvelopeEip4844.Type
  | TransactionEnvelopeEip7702.Type
  | (string & {})
