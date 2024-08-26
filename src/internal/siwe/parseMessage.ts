import type { Address } from 'abitype'
import type { Siwe_Message } from '../types/siwe.js'
import type { Compute, ExactPartial } from '../types/utils.js'
import { Siwe_prefixRegex, Siwe_suffixRegex } from './constants.js'

/**
 * EIP-4361 formatted message into message fields object.
 *
 * - Docs: https://oxlib.sh/api/siwe/parseMessage
 * - Spec: https://eips.ethereum.org/EIPS/eip-4361
 *
 * @example
 * ```ts twoslash
 * import { Siwe } from 'ox'
 *
 * Siwe.parseMessage(`example.com wants you to sign in with your Ethereum account:
 * 0xA0Cf798816D4b9b9866b5330EEa46a18382f251e
 *
 * I accept the ExampleOrg Terms of Service: https://example.com/tos
 *
 * URI: https://example.com/path
 * Version: 1
 * Chain ID: 1
 * Nonce: foobarbaz
 * Issued At: 2023-02-01T00:00:00.000Z`)
 * // {
 * //   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * //   chainId: 1,
 * //   domain: 'example.com',
 * //   issuedAt: '2023-02-01T00:00:00.000Z',
 * //   nonce: 'foobarbaz',
 * //   statement: 'I accept the ExampleOrg Terms of Service: https://example.com/tos',
 * //   uri: 'https://example.com/path',
 * //   version: '1',
 * // }
 * ```
 */
export function Siwe_parseMessage(
  message: string,
): Siwe_parseMessage.ReturnType {
  const { scheme, statement, ...prefix } = (message.match(Siwe_prefixRegex)
    ?.groups ?? {}) as {
    address: Address
    domain: string
    scheme?: string
    statement?: string
  }
  const { chainId, expirationTime, issuedAt, notBefore, requestId, ...suffix } =
    (message.match(Siwe_suffixRegex)?.groups ?? {}) as {
      chainId: string
      expirationTime?: string
      issuedAt?: string
      nonce: string
      notBefore?: string
      requestId?: string
      uri: string
      version: '1'
    }
  const resources = message.split('Resources:')[1]?.split('\n- ').slice(1)
  return {
    ...prefix,
    ...suffix,
    ...(chainId ? { chainId: Number(chainId) } : {}),
    ...(expirationTime ? { expirationTime: new Date(expirationTime) } : {}),
    ...(issuedAt ? { issuedAt: new Date(issuedAt) } : {}),
    ...(notBefore ? { notBefore: new Date(notBefore) } : {}),
    ...(requestId ? { requestId } : {}),
    ...(resources ? { resources } : {}),
    ...(scheme ? { scheme } : {}),
    ...(statement ? { statement } : {}),
  }
}

export declare namespace Siwe_parseMessage {
  type ReturnType = Compute<ExactPartial<Siwe_Message>>
}
