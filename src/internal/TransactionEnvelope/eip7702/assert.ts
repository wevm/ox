import * as Address from '../../../Address.js'
import * as TransactionEnvelope from '../../../TransactionEnvelope.js'
import * as TransactionEnvelopeEip1559 from '../../../TransactionEnvelopeEip1559.js'
import type * as TransactionEnvelopeEip7702 from '../../../TransactionEnvelopeEip7702.js'
import type { GlobalErrorType } from '../../Errors/error.js'
import type { PartialBy } from '../../types.js'

/**
 * Asserts a {@link ox#TransactionEnvelope.Eip7702} is valid.
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
export function assert(
  envelope: PartialBy<TransactionEnvelopeEip7702.TransactionEnvelope, 'type'>,
) {
  const { authorizationList } = envelope
  if (authorizationList) {
    for (const authorization of authorizationList) {
      const { address, chainId } = authorization
      if (address) Address.assert(address, { strict: false })
      if (Number(chainId) < 0)
        throw new TransactionEnvelope.InvalidChainIdError({ chainId })
    }
  }
  TransactionEnvelopeEip1559.assert(
    envelope as {} as TransactionEnvelopeEip1559.TransactionEnvelope,
  )
}

export declare namespace assert {
  type ErrorType =
    | Address.assert.ErrorType
    | TransactionEnvelope.InvalidChainIdError
    | GlobalErrorType
}

assert.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as assert.ErrorType
