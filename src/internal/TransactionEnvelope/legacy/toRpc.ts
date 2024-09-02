import type { GlobalErrorType } from '../../Errors/error.js'
import { Hex_from } from '../../Hex/from.js'
import { Signature_extract } from '../../Signature/extract.js'
import { Signature_toRpc } from '../../Signature/toRpc.js'
import type {
  TransactionEnvelopeLegacy,
  TransactionEnvelopeLegacy_Rpc,
} from './types.js'

/**
 * Converts an {@link TransactionEnvelope#Legacy} to an {@link TransactionEnvelope#LegacyRpc}.
 *
 * @example
 * ```ts twoslash
 * import { JsonRpc, TransactionEnvelopeLegacy, Value } from 'ox'
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
 * const request = JsonRpc.defineRequest({
 *   id: 0,
 *   method: 'eth_sendTransaction',
 *   params: [envelope_rpc],
 * })
 * ```
 *
 * @param envelope - The legacy transaction envelope to convert.
 * @returns An RPC-formatted legacy transaction envelope.
 */
export function TransactionEnvelopeLegacy_toRpc(
  envelope: Omit<TransactionEnvelopeLegacy, 'type'>,
): TransactionEnvelopeLegacy_Rpc {
  const signature = Signature_extract(envelope)!

  return {
    ...envelope,
    chainId:
      typeof envelope.chainId === 'number'
        ? Hex_from(envelope.chainId)
        : undefined,
    data: envelope.data ?? envelope.input,
    type: '0x0',
    ...(typeof envelope.gas === 'bigint'
      ? { gas: Hex_from(envelope.gas) }
      : {}),
    ...(typeof envelope.nonce === 'bigint'
      ? { nonce: Hex_from(envelope.nonce) }
      : {}),
    ...(typeof envelope.value === 'bigint'
      ? { value: Hex_from(envelope.value) }
      : {}),
    ...(typeof envelope.gasPrice === 'bigint'
      ? { gasPrice: Hex_from(envelope.gasPrice) }
      : {}),
    ...(signature
      ? {
          ...Signature_toRpc(signature),
          v: signature.yParity === 0 ? '0x1b' : '0x1c',
        }
      : {}),
  } as never
}

export declare namespace TransactionEnvelopeLegacy_toRpc {
  export type ErrorType = Signature_extract.ErrorType | GlobalErrorType
}

TransactionEnvelopeLegacy_toRpc.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeLegacy_toRpc.ErrorType
