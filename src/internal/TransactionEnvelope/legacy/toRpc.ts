import type * as Errors from '../../../Errors.js'
import type * as TransactionEnvelopeLegacy from '../../../TransactionEnvelopeLegacy.js'
import { fromNumber } from '../../Hex/fromNumber.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toRpc } from '../../Signature/toRpc.js'

/**
 * Converts an {@link ox#TransactionEnvelope.Legacy} to an {@link ox#TransactionEnvelope.LegacyRpc}.
 *
 * @example
 * ```ts twoslash
 * import { RpcRequest, TransactionEnvelopeLegacy, Value } from 'ox'
 *
 * const envelope = TransactionEnvelopeLegacy.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: Value.fromEther('1'),
 * })
 *
 * const envelope_rpc = TransactionEnvelopeLegacy.toRpc(envelope) // [!code focus]
 *
 * const request = RpcRequest.from({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The legacy transaction envelope to convert.
 * @returns An RPC-formatted legacy transaction envelope.
 */
export function toRpc(
  envelope: Omit<TransactionEnvelopeLegacy.TransactionEnvelope, 'type'>,
): TransactionEnvelopeLegacy.Rpc {
  const signature = Signature_extract(envelope)!

  return {
    ...envelope,
    chainId:
      typeof envelope.chainId === 'number'
        ? fromNumber(envelope.chainId)
        : undefined,
    data: envelope.data ?? envelope.input,
    type: '0x0',
    ...(typeof envelope.gas === 'bigint'
      ? { gas: fromNumber(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: fromNumber(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: fromNumber(envelope.value) }
      : {}),
    ...(typeof envelope.gasPrice === 'bigint'
      ? { gasPrice: fromNumber(envelope.gasPrice) }
      : {}),
    ...(signature
      ? {
          ...Signature_toRpc(signature),
          v: signature.yParity === 0 ? '0x1b' : '0x1c',
        }
      : {}),
  } as never
}

export declare namespace toRpc {
  export type ErrorType = Signature_extract.ErrorType | Errors.GlobalErrorType
}

toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as toRpc.ErrorType
