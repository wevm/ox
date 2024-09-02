import type { GlobalErrorType } from '../errors/error.js'
import type { Signature } from '../signature/types.js'
import type { Compute } from '../types.js'
import { Authorization_fromRpc } from './fromRpc.js'
import type {
  Authorization,
  Authorization_Rpc,
  Authorization_Signed,
} from './types.js'

/**
 * Converts an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization object into a typed {@link Authorization#Authorization}.
 *
 * @example
 * An Authorization can be instantiated from an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple in object format.
 *
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   chainId: 1,
 *   contractAddress: '0x1234567890abcdef1234567890abcdef12345678',
 *   nonce: 69n,
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * A {@link Signature#Signature} can be attached with the `signature` option. The example below demonstrates signing
 * an Authorization with {@link Secp256k1#sign}.
 *
 * ```ts twoslash
 * import { Authorization, Secp256k1 } from 'ox'
 *
 * const authorization = Authorization.from({
 *   contractAddress: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
 *   chainId: 1,
 *   nonce: 40n,
 * })
 *
 * const signature = Secp256k1.sign({
 *   payload: Authorization.getSignPayload(authorization),
 *   privateKey: '0x...',
 * })
 *
 * const authorization_signed = Authorization.from(authorization, { signature }) // [!code focus]
 * ```
 *
 * @param authorization - An [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple in object format.
 * @param options - Authorization options.
 * @returns The {@link Authorization#Authorization}.
 */
export function Authorization_from<
  const authorization extends Authorization | Authorization_Rpc,
  const signature extends Signature | undefined = undefined,
>(
  authorization: authorization | Authorization,
  options: Authorization_from.Options<signature> = {},
): Authorization_from.ReturnType<authorization, signature> {
  if (typeof authorization.chainId === 'string')
    return Authorization_fromRpc(authorization) as never
  return { ...authorization, ...options.signature } as never
}

export declare namespace Authorization_from {
  interface Options<
    signature extends Signature | undefined = Signature | undefined,
  > {
    /** The {@link Signature#Signature} to attach to the Authorization. */
    signature?: signature | Signature | undefined
  }

  type ReturnType<
    authorization extends Authorization | Authorization_Rpc = Authorization,
    signature extends Signature | undefined = Signature | undefined,
  > = Compute<
    authorization extends Authorization_Rpc
      ? Authorization_Signed
      : authorization & (signature extends Signature ? Readonly<signature> : {})
  >

  type ErrorType = GlobalErrorType
}

Authorization_from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization_from.ErrorType
