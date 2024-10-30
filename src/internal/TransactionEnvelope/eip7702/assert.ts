import type * as Errors from '../../../Errors.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import { Address_assert } from '../../Address/assert.js'
import type { PartialBy } from '../../types.js'
import type { TransactionEnvelopeEip7702 } from './types.js'

/**
 * Asserts a {@link ox#TransactionEnvelopeEip7702.TransactionEnvelope} is valid.
 *
 * @example
 * ```ts twoslash
 * import { TransactionEnvelopeEip7702, Value } from 'ox'
 *
 * TransactionEnvelopeEip7702.assert({
 *   authorizationList: [],
 *   maxFeePerGas: 2n ** 256n - 1n + 1n,
 *   chainId: 1,
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: Value.fromEther('1'),
 * })
 * // @error: FeeCapTooHighError:
 * // @error: The fee cap (`masFeePerGas` = 115792089237316195423570985008687907853269984665640564039457584007913 gwei) cannot be
 * // @error: higher than the maximum allowed value (2^256-1).
 * ```
 *
 * @param envelope - The transaction envelope to assert.
 */
export function TransactionEnvelopeEip7702_assert(
  envelope: PartialBy<TransactionEnvelopeEip7702, 'type'>,
) {
  const { authorizationList } = envelope
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { address, chainId } = authorization
      if (address) Address_assert(address, { strict: false })
      if (Number(chainId) < 0)
        throw new TransactionEnvelope.InvalidChainIdError({ chainId })
    }
  }
  TransactionEnvelopeEip1559.assert(
    envelope as {} as TransactionEnvelopeEip1559.TransactionEnvelopeEip1559,
  )
}

export declare namespace TransactionEnvelopeEip7702_assert {
  type ErrorType =
    | Address_assert.ErrorType
    | TransactionEnvelope.InvalidChainIdError
    | Errors.GlobalErrorType
}

TransactionEnvelopeEip7702_assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip7702_assert.ErrorType
