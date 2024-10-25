import * as Authorization from '../../Authorization.js'
import type * as Errors from '../../Errors.js'
import type * as Signature from '../../Signature.js'
import type { Compute } from '../types.js'

/**
 * Converts an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization object into a typed {@link ox#Authorization.Authorization}.
 *
 * @example
 * An Authorization can be instantiated from an [EIP-7702](https://eips.ethereum.org/EIPS/eip-7702) Authorization tuple in object format.
 *
 * ```ts twoslash
 * import { Authorization } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0x1234567890abcdef1234567890abcdef12345678',
 *   chainId: 1,
 *   nonce: 69n,
 * })
 * ```
 *
 * @example
 * ### Attaching Signatures
 *
 * A {@link ox#Signature.Signature} can be attached with the `signature` option. The example below demonstrates signing
 * an Authorization with {@link ox#Secp256k1.(sign:function)}.
 *
 * ```ts twoslash
 * import { Authorization, Secp256k1 } from 'ox'
 *
 * const authorization = Authorization.from({
 *   address: '0xbe95c3f554e9fc85ec51be69a3d807a0d55bcf2c',
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
 * @returns The {@link ox#Authorization.Authorization}.
 */
export function from<
  const authorization extends Authorization.Authorization | Authorization.Rpc,
  const signature extends Signature.Signature | undefined = undefined,
>(
  authorization: authorization | Authorization.Authorization,
  options: Authorization.from.Options<signature> = {},
): Authorization.from.ReturnType<authorization, signature> {
  if (typeof authorization.chainId === 'string')
    return Authorization.fromRpc(authorization) as never
  return { ...authorization, ...options.signature } as never
}

export declare namespace from {
  interface Options<
    signature extends Signature.Signature | undefined =
      | Signature.Signature
      | undefined,
  > {
    /** The {@link ox#Signature.Signature} to attach to the Authorization. */
    signature?: signature | Signature.Signature | undefined
  }

  type ReturnType<
    authorization extends
      | Authorization.Authorization
      | Authorization.Rpc = Authorization.Authorization,
    signature extends Signature.Signature | undefined =
      | Signature.Signature
      | undefined,
  > = Compute<
    authorization extends Authorization.Rpc
      ? Authorization.Signed
      : authorization &
          (signature extends Signature.Signature ? Readonly<signature> : {})
  >

  type ErrorType = Errors.GlobalErrorType
}

from.parseError = (error: unknown) =>
  /* v8 ignore next */
  error as Authorization.from.ErrorType
