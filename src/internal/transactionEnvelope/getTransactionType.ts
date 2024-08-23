import type { GlobalErrorType } from '../errors/error.js'
import { CannotInferTransactionTypeError } from '../errors/transactionEnvelope.js'
import type {
  FeeValuesEip1559,
  FeeValuesEip4844,
  FeeValuesLegacy,
} from '../types/fee.js'
import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
  TransactionType,
} from '../types/transactionEnvelope.js'
import type {
  Assign,
  ExactPartial,
  IsNever,
  OneOf,
  ValueOf,
} from '../types/utils.js'

type TransactionEnvelopeGeneric = Assign<
  ExactPartial<TransactionEnvelope>,
  { type?: TransactionType | undefined }
>

/** @internal */
export type GetTransactionType<
  transaction extends
    OneOf<TransactionEnvelopeGeneric> = TransactionEnvelopeGeneric,
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
    | (transaction['type'] extends TransactionEnvelopeGeneric['type']
        ? Extract<transaction['type'], string>
        : never),
> = IsNever<keyof transaction> extends true
  ? string
  : IsNever<result> extends false
    ? result
    : string

/** @internal */
export function getTransactionType<
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

export declare namespace getTransactionType {
  type ErrorType = CannotInferTransactionTypeError | GlobalErrorType
}

getTransactionType.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as getTransactionType.ErrorType

////////////////////////////////////////////////////////////////////////////////////////////
// Types

type MatchKeys<T extends object, U extends object> = ValueOf<
  Required<{
    [K in keyof U]: K extends keyof T ? K : undefined
  }>
> extends string
  ? T
  : never

type BaseProperties = {
  accessList?: undefined
  authorizationList?: undefined
  blobVersionedHashes?: undefined
  gasPrice?: undefined
  maxFeePerBlobGas?: undefined
  maxFeePerGas?: undefined
  maxPriorityFeePerGas?: undefined
  sidecars?: undefined
}

type LegacyProperties = Assign<BaseProperties, FeeValuesLegacy>

type Eip1559Properties = Assign<
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

type Eip2930Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesLegacy> & {
    accessList: TransactionEnvelopeEip2930['accessList']
  }
>

type Eip4844Properties = Assign<
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

type Eip7702Properties = Assign<
  BaseProperties,
  ExactPartial<FeeValuesEip1559> & {
    authorizationList: TransactionEnvelopeEip7702['authorizationList']
  }
>
