import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import type * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import type * as TransactionEnvelopeEip2930 from '../../../TransactionEnvelopeEip2930.js'
import type * as TransactionEnvelopeEip4844 from '../../../TransactionEnvelopeEip4844.js'
import type * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type {
  FeeValuesEip1559,
  FeeValuesEip4844,
  FeeValuesLegacy,
} from '../../Fee/types.js'
import { Hex_slice } from '../../Hex/slice.js'
import type { Hex } from '../../Hex/types.js'
import type {
  Assign,
  ExactPartial,
  IsNarrowable,
  IsNever,
  OneOf,
  ValueOf,
} from '../../types.js'

/** @internal */
export type GetType<
  transaction extends TransactionEnvelope.Serialized | OneOf<Generic>,
> = transaction extends OneOf<Generic>
  ? GetTypeFromObject<transaction>
  : transaction extends TransactionEnvelope.Serialized
    ? GetTypeFromSerialized<transaction>
    : never

/** @internal */
export function getType<
  const transaction extends TransactionEnvelope.Serialized | OneOf<Generic>,
>(transaction: transaction): GetType<transaction> {
  if (typeof transaction === 'string') {
    const serializedType = Hex_slice(transaction as Hex, 0, 1)
    if (serializedType !== '0x' && Number(serializedType) >= 0xc0)
      return 'legacy' as never
    if (serializedType === '0x01') return 'eip2930' as never
    if (serializedType === '0x02') return 'eip1559' as never
    if (serializedType === '0x03') return 'eip4844' as never
    if (serializedType === '0x04') return 'eip7702' as never
    throw new TransactionEnvelope.TypeNotImplementedError({
      type: serializedType,
    })
  }

  if (transaction.type) return transaction.type as GetType<transaction>

  if (typeof transaction.authorizationList !== 'undefined')
    return 'eip7702' as never

  if (
    typeof transaction.blobVersionedHashes !== 'undefined' ||
    typeof transaction.maxFeePerBlobGas !== 'undefined' ||
    typeof transaction.sidecars !== 'undefined'
  )
    return 'eip4844' as never

  if (
    typeof transaction.maxFeePerGas !== 'undefined' ||
    typeof transaction.maxPriorityFeePerGas !== 'undefined'
  ) {
    return 'eip1559' as never
  }

  if (typeof transaction.gasPrice !== 'undefined') {
    if (typeof transaction.accessList !== 'undefined') return 'eip2930' as never
    return 'legacy' as never
  }

  throw new TransactionEnvelope.CannotInferTypeError({ transaction })
}

/** @internal */
export declare namespace getType {
  type ErrorType = TransactionEnvelope.CannotInferTypeError | GlobalErrorType
}

////////////////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type Generic = Assign<
  ExactPartial<TransactionEnvelope.TransactionEnvelope>,
  { type?: TransactionEnvelope.Type | undefined }
>

/** @internal */
export type GetTypeFromObject<
  transaction extends OneOf<Generic> = Generic,
  result =
    | (transaction extends LegacyProperties ? 'legacy' : never)
    | (transaction extends Eip1559Properties ? 'eip1559' : never)
    | (transaction extends Eip2930Properties ? 'eip2930' : never)
    | (transaction extends Eip4844Properties ? 'eip4844' : never)
    | (transaction extends Eip7702Properties ? 'eip7702' : never)
    | (transaction['type'] extends Generic['type']
        ? Extract<transaction['type'], string>
        : never),
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

/** @internal */
export type GetTypeFromSerialized<
  serializedTransaction extends
    TransactionEnvelope.Serialized = TransactionEnvelope.Serialized,
  result =
    | (serializedTransaction extends TransactionEnvelopeEip1559.Serialized
        ? 'eip1559'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip2930.Serialized
        ? 'eip2930'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip4844.Serialized
        ? 'eip4844'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip7702.Serialized
        ? 'eip7702'
        : never)
    | (serializedTransaction extends TransactionEnvelopeLegacy.Serialized
        ? 'legacy'
        : never),
> = IsNarrowable<serializedTransaction, Hex> extends true
  ? IsNever<result> extends false
    ? result
    : TransactionEnvelope.Type
  : TransactionEnvelope.Type

/** @internal */
export type MatchKeys<T extends object, U extends object> = ValueOf<
  Required<{
    [K in keyof U]: K extends keyof T ? K : undefined
  }>
> extends string
  ? T
  : never

/** @internal */
export type BaseProperties = {
  accessList?: undefined
  authorizationList?: undefined
  blobVersionedHashes?: undefined
  gasPrice?: undefined
  maxFeePerBlobGas?: undefined
  maxFeePerGas?: undefined
  maxPriorityFeePerGas?: undefined
  sidecars?: undefined
}

/** @internal */
export type LegacyProperties = Assign<BaseProperties, FeeValuesLegacy>

/** @internal */
export type Eip1559Properties = Assign<
  BaseProperties,
  OneOf<
    | {
        maxFeePerGas: FeeValuesEip1559['maxFeePerGas']
      }
    | {
        maxPriorityFeePerGas: FeeValuesEip1559['maxPriorityFeePerGas']
      }
    | FeeValuesEip1559
  > & {
    accessList?:
      | TransactionEnvelopeEip2930.TransactionEnvelope['accessList']
      | undefined
  }
>

/** @internal */
export type Eip2930Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesLegacy> & {
    accessList: TransactionEnvelopeEip2930.TransactionEnvelope['accessList']
  }
>

/** @internal */
export type Eip4844Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip4844> &
    OneOf<
      | {
          blobVersionedHashes: TransactionEnvelopeEip4844.TransactionEnvelope['blobVersionedHashes']
        }
      | {
          sidecars: TransactionEnvelopeEip4844.TransactionEnvelope['sidecars']
        },
      TransactionEnvelopeEip4844.TransactionEnvelope
    >
>

/** @internal */
export type Eip7702Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip1559> & {
    authorizationList: TransactionEnvelopeEip7702.TransactionEnvelope['authorizationList']
  }
>
