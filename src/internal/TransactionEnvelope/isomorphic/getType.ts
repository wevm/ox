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
import type {
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip1559_Serialized,
} from '../eip1559/types.js'
import type {
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip2930_Serialized,
} from '../eip2930/types.js'
import type {
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip4844_Serialized,
} from '../eip4844/types.js'
import type {
  TransactionEnvelopeEip7702,
  TransactionEnvelopeEip7702_Serialized,
} from '../eip7702/types.js'
import {
  TransactionEnvelope_CannotInferTypeError,
  TransactionEnvelope_TypeNotImplementedError,
} from '../errors.js'
import type {
  TransactionEnvelopeLegacy,
  TransactionEnvelopeLegacy_Serialized,
} from '../legacy/types.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Serialized,
  TransactionEnvelope_Type,
} from './types.js'

/** @internal */
export type TransactionEnvelope_GetType<
  transaction extends
    | TransactionEnvelope_Serialized
    | OneOf<TransactionEnvelope_Generic>,
> = transaction extends OneOf<TransactionEnvelope_Generic>
  ? TransactionEnvelope_GetTypeFromObject<transaction>
  : transaction extends TransactionEnvelope_Serialized
    ? TransactionEnvelope_GetTypeFromSerialized<transaction>
    : never

/** @internal */
export function TransactionEnvelope_getType<
  const transaction extends
    | TransactionEnvelope_Serialized
    | OneOf<TransactionEnvelope_Generic>,
>(transaction: transaction): TransactionEnvelope_GetType<transaction> {
  if (typeof transaction === 'string') {
    const serializedType = Hex_slice(transaction as Hex, 0, 1)
    if (serializedType !== '0x' && Number(serializedType) >= 0xc0)
      return 'legacy' as never
    if (serializedType === '0x01') return 'eip2930' as never
    if (serializedType === '0x02') return 'eip1559' as never
    if (serializedType === '0x03') return 'eip4844' as never
    if (serializedType === '0x04') return 'eip7702' as never
    throw new TransactionEnvelope_TypeNotImplementedError({
      type: serializedType,
    })
  }

  if (transaction.type)
    return transaction.type as TransactionEnvelope_GetType<transaction>

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

  throw new TransactionEnvelope_CannotInferTypeError({ transaction })
}

/** @internal */
export declare namespace TransactionEnvelope_getType {
  type ErrorType = TransactionEnvelope_CannotInferTypeError | GlobalErrorType
}

////////////////////////////////////////////////////////////////////////////////////////////
// Types
////////////////////////////////////////////////////////////////////////////////////////////

/** @internal */
export type TransactionEnvelope_Generic = Assign<
  ExactPartial<TransactionEnvelope>,
  { type?: TransactionEnvelope_Type | undefined }
>

/** @internal */
export type TransactionEnvelope_GetTypeFromObject<
  transaction extends
    OneOf<TransactionEnvelope_Generic> = TransactionEnvelope_Generic,
  result =
    | (transaction extends
        | MatchKeys<TransactionEnvelopeLegacy, transaction>
        | LegacyProperties
        ? 'legacy'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelopeEip1559, transaction>
        | Eip1559Properties
        ? 'eip1559'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelopeEip2930, transaction>
        | Eip2930Properties
        ? 'eip2930'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelopeEip4844, transaction>
        | Eip4844Properties
        ? 'eip4844'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelopeEip7702, transaction>
        | Eip7702Properties
        ? 'eip7702'
        : never)
    | (transaction['type'] extends TransactionEnvelope_Generic['type']
        ? Extract<transaction['type'], string>
        : never),
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

/** @internal */
export type TransactionEnvelope_GetTypeFromSerialized<
  serializedTransaction extends
    TransactionEnvelope_Serialized = TransactionEnvelope_Serialized,
  result =
    | (serializedTransaction extends TransactionEnvelopeEip1559_Serialized
        ? 'eip1559'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip2930_Serialized
        ? 'eip2930'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip4844_Serialized
        ? 'eip4844'
        : never)
    | (serializedTransaction extends TransactionEnvelopeEip7702_Serialized
        ? 'eip7702'
        : never)
    | (serializedTransaction extends TransactionEnvelopeLegacy_Serialized
        ? 'legacy'
        : never),
> = IsNarrowable<serializedTransaction, Hex> extends true
  ? IsNever<result> extends false
    ? result
    : TransactionEnvelope_Type
  : TransactionEnvelope_Type

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
    accessList?: TransactionEnvelopeEip2930['accessList'] | undefined
  }
>

/** @internal */
export type Eip2930Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesLegacy> & {
    accessList: TransactionEnvelopeEip2930['accessList']
  }
>

/** @internal */
export type Eip4844Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip4844> &
    OneOf<
      | {
          blobVersionedHashes: TransactionEnvelopeEip4844['blobVersionedHashes']
        }
      | {
          sidecars: TransactionEnvelopeEip4844['sidecars']
        },
      TransactionEnvelopeEip4844
    >
>

/** @internal */
export type Eip7702Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip1559> & {
    authorizationList: TransactionEnvelopeEip7702['authorizationList']
  }
>
