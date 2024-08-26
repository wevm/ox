import type { GlobalErrorType } from '../errors/error.js'
import type {
  FeeValuesEip1559,
  FeeValuesEip4844,
  FeeValuesLegacy,
} from '../fee/types.js'
import type { Assign, ExactPartial, IsNever, OneOf, ValueOf } from '../types.js'
import { CannotInferTransactionTypeError } from './errors.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Eip1559,
  TransactionEnvelope_Eip2930,
  TransactionEnvelope_Eip4844,
  TransactionEnvelope_Eip7702,
  TransactionEnvelope_Legacy,
  TransactionEnvelope_Type,
} from './types.js'

/** @internal */
export type TransactionEnvelopeGeneric = Assign<
  ExactPartial<TransactionEnvelope>,
  { type?: TransactionEnvelope_Type | undefined }
>

/** @internal */
export type GetTransactionType<
  transaction extends
    OneOf<TransactionEnvelopeGeneric> = TransactionEnvelopeGeneric,
  result =
    | (transaction extends
        | MatchKeys<TransactionEnvelope_Legacy, transaction>
        | LegacyProperties
        ? 'legacy'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelope_Eip1559, transaction>
        | Eip1559Properties
        ? 'eip1559'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelope_Eip2930, transaction>
        | Eip2930Properties
        ? 'eip2930'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelope_Eip4844, transaction>
        | Eip4844Properties
        ? 'eip4844'
        : never)
    | (transaction extends
        | MatchKeys<TransactionEnvelope_Eip7702, transaction>
        | Eip7702Properties
        ? 'eip7702'
        : never)
    | (transaction['type'] extends TransactionEnvelopeGeneric['type']
        ? Extract<transaction['type'], string>
        : never),
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

/** @internal */
export function TransactionEnvelope_getType<
  const transaction extends OneOf<TransactionEnvelopeGeneric>,
>(transaction: transaction): GetTransactionType<transaction> {
  if (transaction.type)
    return transaction.type as GetTransactionType<transaction>

  if (typeof transaction.authorizationList !== 'undefined')
    return 'eip7702' as any

  if (
    typeof transaction.blobVersionedHashes !== 'undefined' ||
    typeof transaction.maxFeePerBlobGas !== 'undefined' ||
    typeof transaction.sidecars !== 'undefined'
  )
    return 'eip4844' as any

  if (
    typeof transaction.maxFeePerGas !== 'undefined' ||
    typeof transaction.maxPriorityFeePerGas !== 'undefined'
  ) {
    return 'eip1559' as any
  }

  if (typeof transaction.gasPrice !== 'undefined') {
    if (typeof transaction.accessList !== 'undefined') return 'eip2930' as any
    return 'legacy' as any
  }

  throw new CannotInferTransactionTypeError({ transaction })
}

/** @internal */
export declare namespace TransactionEnvelope_getType {
  type ErrorType = CannotInferTransactionTypeError | GlobalErrorType
}

////////////////////////////////////////////////////////////////////////////////////////////
// Types

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
    accessList?: TransactionEnvelope_Eip2930['accessList'] | undefined
  }
>

/** @internal */
export type Eip2930Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesLegacy> & {
    accessList: TransactionEnvelope_Eip2930['accessList']
  }
>

/** @internal */
export type Eip4844Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip4844> &
    OneOf<
      | {
          blobVersionedHashes: TransactionEnvelope_Eip4844['blobVersionedHashes']
        }
      | {
          sidecars: TransactionEnvelope_Eip4844['sidecars']
        },
      TransactionEnvelope_Eip4844
    >
>

/** @internal */
export type Eip7702Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip1559> & {
    authorizationList: TransactionEnvelope_Eip7702['authorizationList']
  }
>
