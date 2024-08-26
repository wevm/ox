import { Address_assert } from '../address/assert.js'
import {
  EmptyBlobVersionedHashesError,
  InvalidVersionedHashSizeError,
  InvalidVersionedHashVersionError,
} from '../errors/blob.js'
import type { GlobalErrorType } from '../errors/error.js'
import {
  FeeCapTooHighError,
  GasPriceTooHighError,
  InvalidChainIdError,
  TipAboveFeeCapError,
  TransactionTypeNotImplementedError,
} from '../errors/transactionEnvelope.js'
import { Hex_size } from '../hex/size.js'
import { Hex_slice } from '../hex/slice.js'
import { Hex_toNumber } from '../hex/to.js'
import { Kzg_versionedHashVersion } from '../kzg/constants.js'
import type {
  TransactionEnvelope,
  TransactionEnvelope_Eip1559,
  TransactionEnvelope_Eip2930,
  TransactionEnvelope_Eip4844,
  TransactionEnvelope_Eip7702,
  TransactionEnvelope_Legacy,
} from '../types/transactionEnvelope.js'
import type { PartialBy } from '../types/utils.js'

/**
 * Asserts a {@link TransactionEnvelope#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assert(envelope: TransactionEnvelope) {
  if (envelope.type === 'legacy') TransactionEnvelope_assertLegacy(envelope)
  else if (envelope.type === 'eip2930')
    TransactionEnvelope_assertEip2930(envelope)
  else if (envelope.type === 'eip1559')
    TransactionEnvelope_assertEip1559(envelope)
  else if (envelope.type === 'eip4844')
    TransactionEnvelope_assertEip4844(envelope)
  else if (envelope.type === 'eip7702')
    TransactionEnvelope_assertEip7702(envelope)
  else
    throw new TransactionTypeNotImplementedError({
      type: (envelope as any).type,
    })
}

export declare namespace TransactionEnvelope_assert {
  type ErrorType =
    | TransactionEnvelope_assertLegacy.ErrorType
    | TransactionEnvelope_assertEip2930.ErrorType
    | TransactionEnvelope_assertEip1559.ErrorType
    | TransactionEnvelope_assertEip4844.ErrorType
    | TransactionEnvelope_assertEip7702.ErrorType
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

TransactionEnvelope_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assert.ErrorType

/**
 * Asserts a {@link TransactionEnvelope#Legacy} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assertLegacy(
  envelope: PartialBy<TransactionEnvelope_Legacy, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (to) Address_assert(to, { strict: false })
  if (typeof chainId !== 'undefined' && chainId <= 0)
    throw new InvalidChainIdError({ chainId })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace TransactionEnvelope_assertLegacy {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

TransactionEnvelope_assertLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assertLegacy.ErrorType

/**
 * Asserts a {@link TransactionEnvelope#Eip2930} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assertEip2930(
  envelope: PartialBy<TransactionEnvelope_Eip2930, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (chainId <= 0) throw new InvalidChainIdError({ chainId })
  if (to) Address_assert(to, { strict: false })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace TransactionEnvelope_assertEip2930 {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

TransactionEnvelope_assertEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assertEip2930.ErrorType

/**
 * Asserts a {@link TransactionEnvelope#Eip1559} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assertEip1559(
  envelope: PartialBy<TransactionEnvelope_Eip1559, 'type'>,
) {
  const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = envelope
  if (chainId <= 0) throw new InvalidChainIdError({ chainId })
  if (to) Address_assert(to, { strict: false })
  if (maxFeePerGas && BigInt(maxFeePerGas) > 2n ** 256n - 1n)
    throw new FeeCapTooHighError({ feeCap: maxFeePerGas })
  if (
    maxPriorityFeePerGas &&
    maxFeePerGas &&
    maxPriorityFeePerGas > maxFeePerGas
  )
    throw new TipAboveFeeCapError({ maxFeePerGas, maxPriorityFeePerGas })
}

export declare namespace TransactionEnvelope_assertEip1559 {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | FeeCapTooHighError
    | TipAboveFeeCapError
    | GlobalErrorType
}

TransactionEnvelope_assertEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assertEip1559.ErrorType

/**
 * Asserts a {@link TransactionEnvelope#Eip4844} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assertEip4844(
  envelope: PartialBy<TransactionEnvelope_Eip4844, 'type'>,
) {
  const { blobVersionedHashes } = envelope
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new EmptyBlobVersionedHashesError()
    for (const hash of blobVersionedHashes) {
      const size = Hex_size(hash)
      const version = Hex_toNumber(Hex_slice(hash, 0, 1))
      if (size !== 32) throw new InvalidVersionedHashSizeError({ hash, size })
      if (version !== Kzg_versionedHashVersion)
        throw new InvalidVersionedHashVersionError({
          hash,
          version,
        })
    }
  }
  TransactionEnvelope_assertEip1559(
    envelope as {} as TransactionEnvelope_Eip1559,
  )
}

export declare namespace TransactionEnvelope_assertEip4844 {
  type ErrorType =
    | TransactionEnvelope_assertEip1559.ErrorType
    | Hex_size.ErrorType
    | Hex_toNumber.ErrorType
    | Hex_slice.ErrorType
    | EmptyBlobVersionedHashesError
    | InvalidVersionedHashSizeError
    | InvalidVersionedHashVersionError
    | GlobalErrorType
}

TransactionEnvelope_assertEip4844.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assertEip4844.ErrorType

/**
 * Asserts a {@link TransactionEnvelope#Eip7702} is valid.
 *
 * @example
 * // TODO
 */
export function TransactionEnvelope_assertEip7702(
  envelope: PartialBy<TransactionEnvelope_Eip7702, 'type'>,
) {
  const { authorizationList } = envelope
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { contractAddress, chainId } = authorization
      if (contractAddress) Address_assert(contractAddress, { strict: false })
      if (Number(chainId) <= 0) throw new InvalidChainIdError({ chainId })
    }
  }
  TransactionEnvelope_assertEip1559(
    envelope as {} as TransactionEnvelope_Eip1559,
  )
}

export declare namespace TransactionEnvelope_assertEip7702 {
  type ErrorType =
    | Address_assert.ErrorType
    | InvalidChainIdError
    | GlobalErrorType
}

TransactionEnvelope_assertEip7702.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelope_assertEip7702.ErrorType
