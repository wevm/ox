import type { GlobalErrorType } from '../../Errors/error.js'
import { Hash_keccak256 } from '../../Hash/keccak256.js'
import type { Hex } from '../../Hex/types.js'
import { TransactionEnvelopeEip2930_serialize } from './serialize.js'
import type { TransactionEnvelopeEip2930 } from './types.js'

/**
 * Hashes a {@link ox#TransactionEnvelope.Eip2930}. This is the "transaction hash".
 *
 * @example
 * ```ts twoslash
 * import { Secp256k1, TransactionEnvelopeEip2930 } from 'ox'
 *
 * const envelope = TransactionEnvelopeEip2930.from({
 *   chainId: 1,
 *   nonce: 0n,
 *   gasPrice: 1000000000n,
 *   gas: 21000n,
 *   to: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
 *   value: 1000000000000000000n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: TransactionEnvelopeEip2930.getSignPayload(envelope),
 *   privateKey: '0x...',
 * })
 *
 * const envelope_signed = TransactionEnvelopeEip2930.from(envelope, {
 *   signature,
 * })
 *
 * const hash = TransactionEnvelopeEip2930.hash(envelope_signed) // [!code focus]
 * ```
 *
 * @param envelope - The EIP-2930 Transaction Envelope to hash.
 * @param options - Options.
 * @returns The hash of the transaction envelope.
 */
export function TransactionEnvelopeEip2930_hash<
  presign extends boolean = false,
>(
  envelope: TransactionEnvelopeEip2930<presign extends true ? false : true>,
  options: TransactionEnvelopeEip2930_hash.Options<presign> = {},
): TransactionEnvelopeEip2930_hash.ReturnType {
  const { presign } = options
  return Hash_keccak256(
    TransactionEnvelopeEip2930_serialize({
      ...envelope,
      ...(presign
        ? {
            r: undefined,
            s: undefined,
            yParity: undefined,
            v: undefined,
          }
        : {}),
    }),
  )
}

export declare namespace TransactionEnvelopeEip2930_hash {
  type Options<presign extends boolean = false> = {
    /** Whether to hash this transaction for signing. @default false */
    presign?: presign | boolean | undefined
  }

  type ReturnType = Hex

  type ErrorType =
    | Hash_keccak256.ErrorType
    | TransactionEnvelopeEip2930_serialize.ErrorType
    | GlobalErrorType
}

TransactionEnvelopeEip2930_hash.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as TransactionEnvelopeEip2930_hash.ErrorType
