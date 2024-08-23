import { assertAddress } from '../address/assertAddress.js'
import { versionedHashVersionKzg } from '../constants/kzg.js'
import { size } from '../data/size.js'
import { slice } from '../data/slice.js'
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
import { hexToNumber } from '../hex/fromHex.js'
import type {
  TransactionEnvelope,
  TransactionEnvelopeEip1559,
  TransactionEnvelopeEip2930,
  TransactionEnvelopeEip4844,
  TransactionEnvelopeEip7702,
  TransactionEnvelopeLegacy,
} from '../types/transactionEnvelope.js'
import type { PartialBy } from '../types/utils.js'

/**
 * Asserts a {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelope:function(1)
 */
export function assertTransactionEnvelope(envelope: TransactionEnvelope) {
  if (envelope.type === 'legacy') assertTransactionEnvelopeLegacy(envelope)
  else if (envelope.type === 'eip2930')
    assertTransactionEnvelopeEip2930(envelope)
  else if (envelope.type === 'eip1559')
    assertTransactionEnvelopeEip1559(envelope)
  else if (envelope.type === 'eip4844')
    assertTransactionEnvelopeEip4844(envelope)
  else if (envelope.type === 'eip7702')
    assertTransactionEnvelopeEip7702(envelope)
  else
    throw new TransactionTypeNotImplementedError({
      type: (envelope as any).type,
    })
}

export declare namespace assertTransactionEnvelope {
  type ErrorType =
    | assertTransactionEnvelopeLegacy.ErrorType
    | assertTransactionEnvelopeEip2930.ErrorType
    | assertTransactionEnvelopeEip1559.ErrorType
    | assertTransactionEnvelopeEip4844.ErrorType
    | assertTransactionEnvelopeEip7702.ErrorType
    | TransactionTypeNotImplementedError
    | GlobalErrorType
}

assertTransactionEnvelope.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelope.ErrorType

/**
 * Asserts a legacy {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelopeLegacy:function(1)
 */
export function assertTransactionEnvelopeLegacy(
  envelope: PartialBy<TransactionEnvelopeLegacy, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (to) assertAddress(to, { strict: false })
  if (typeof chainId !== 'undefined' && chainId <= 0)
    throw new InvalidChainIdError({ chainId })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace assertTransactionEnvelopeLegacy {
  type ErrorType =
    | assertAddress.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

assertTransactionEnvelopeLegacy.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelopeLegacy.ErrorType

/**
 * Asserts an EIP-2930 {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelopeEip2930:function(1)
 */
export function assertTransactionEnvelopeEip2930(
  envelope: PartialBy<TransactionEnvelopeEip2930, 'type'>,
) {
  const { chainId, gasPrice, to } = envelope
  if (chainId <= 0) throw new InvalidChainIdError({ chainId })
  if (to) assertAddress(to, { strict: false })
  if (gasPrice && BigInt(gasPrice) > 2n ** 256n - 1n)
    throw new GasPriceTooHighError({ gasPrice })
}

export declare namespace assertTransactionEnvelopeEip2930 {
  type ErrorType =
    | assertAddress.ErrorType
    | InvalidChainIdError
    | GasPriceTooHighError
    | GlobalErrorType
}

assertTransactionEnvelopeEip2930.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelopeEip2930.ErrorType

/**
 * Asserts an EIP-1559 {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelopeEip1559:function(1)
 */
export function assertTransactionEnvelopeEip1559(
  envelope: PartialBy<TransactionEnvelopeEip1559, 'type'>,
) {
  const { chainId, maxPriorityFeePerGas, maxFeePerGas, to } = envelope
  if (chainId <= 0) throw new InvalidChainIdError({ chainId })
  if (to) assertAddress(to, { strict: false })
  if (maxFeePerGas && BigInt(maxFeePerGas) > 2n ** 256n - 1n)
    throw new FeeCapTooHighError({ feeCap: maxFeePerGas })
  if (
    maxPriorityFeePerGas &&
    maxFeePerGas &&
    maxPriorityFeePerGas > maxFeePerGas
  )
    throw new TipAboveFeeCapError({ maxFeePerGas, maxPriorityFeePerGas })
}

export declare namespace assertTransactionEnvelopeEip1559 {
  type ErrorType =
    | assertAddress.ErrorType
    | InvalidChainIdError
    | FeeCapTooHighError
    | TipAboveFeeCapError
    | GlobalErrorType
}

assertTransactionEnvelopeEip1559.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelopeEip1559.ErrorType

/**
 * Asserts an EIP-4844 {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelopeEip4844:function(1)
 */
export function assertTransactionEnvelopeEip4844(
  envelope: PartialBy<TransactionEnvelopeEip4844, 'type'>,
) {
  const { blobVersionedHashes } = envelope
  if (blobVersionedHashes) {
    if (blobVersionedHashes.length === 0)
      throw new EmptyBlobVersionedHashesError()
    for (const hash of blobVersionedHashes) {
      const size_ = size(hash)
      const version = hexToNumber(slice(hash, 0, 1))
      if (size_ !== 32)
        throw new InvalidVersionedHashSizeError({ hash, size: size_ })
      if (version !== versionedHashVersionKzg)
        throw new InvalidVersionedHashVersionError({
          hash,
          version,
        })
    }
  }
  assertTransactionEnvelopeEip1559(envelope as {} as TransactionEnvelopeEip1559)
}

export declare namespace assertTransactionEnvelopeEip4844 {
  type ErrorType =
    | assertTransactionEnvelopeEip1559.ErrorType
    | size.ErrorType
    | hexToNumber.ErrorType
    | slice.ErrorType
    | EmptyBlobVersionedHashesError
    | InvalidVersionedHashSizeError
    | InvalidVersionedHashVersionError
    | GlobalErrorType
}

assertTransactionEnvelopeEip4844.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelopeEip4844.ErrorType

/**
 * Asserts an EIP-7702 {@link Types#TransactionEnvelope} is valid.
 *
 * @example
 * // TODO
 *
 * @alias ox!TransactionEnvelope.assertTransactionEnvelopeEip7702:function(1)
 */
export function assertTransactionEnvelopeEip7702(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
) {
  const { authorizationList } = envelope
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { contractAddress, chainId } = authorization
      if (contractAddress) assertAddress(contractAddress, { strict: false })
      if (Number(chainId) <= 0) throw new InvalidChainIdError({ chainId })
    }
  }
  assertTransactionEnvelopeEip1559(envelope as {} as TransactionEnvelopeEip1559)
}

export declare namespace assertTransactionEnvelopeEip7702 {
  type ErrorType =
    | assertAddress.ErrorType
    | InvalidChainIdError
    | GlobalErrorType
}

assertTransactionEnvelopeEip7702.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assertTransactionEnvelopeEip7702.ErrorType
